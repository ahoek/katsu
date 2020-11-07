<?php

/**
 * Get the words via the Jisho api
 */
$j = new JishoScraper();
$j->getWords();

class JishoScraper
{
    protected $baseUrl = 'http://jisho.org/api/v1/search/words';
    protected $words = [];
    protected $baseRequest = '';

    private $currentType;

    function __construct()
    {
    }

    public function getWords()
    {
        $dictionary = [];
        for ($level = 5; $level >= 1; $level--) {
            $dictionary = array_merge_recursive($dictionary, $this->getWordsOfLevel($level));
        }
        $json = json_encode($dictionary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        file_put_contents(__DIR__ . '/../src/assets/data/questions/words.json', $json);
    }

    public function getWordsOfLevel($level = 5)
    {
        $this->level = $level;
        $types = [
            'verb',
            'adj-i',
            'adj-na',
        ];

        $dictionary = [];
        foreach ($types as $type) {
            $this->baseRequest = $this->baseUrl.'?keyword='
                .urlencode('#jlpt-n'.$level.' #'.$type);
            $this->currentType = $type;
            echo $this->baseRequest."\n";
            $words = $this->getWordsFromPage(1);
            echo "# ".count($words)." $type\n";

            $dictionary[$type] = $this->stripUnwantedInfo($words);
        }

        return $dictionary;
    }

    /**
     * Get the words from page $page and above
     *
     * @param int $page
     * @return array
     */
    protected function getWordsFromPage($page = 1)
    {
        echo "Page $page";
        $response = file_get_contents($this->baseRequest.'&page='.$page);
        $responseDecoded = json_decode($response, true);
        $words = $responseDecoded['data'];
        echo " [".count($words)."]\n";
        if (count($words) > 0 && $page < 100) {
            // Don't spam the server
            sleep(2);
            $nextWords = $this->getWordsFromPage($page + 1);
            if (is_array($nextWords)) {
                $words = array_merge($words, $nextWords);
            }
        }

        return $words;
    }

    protected function stripUnwantedInfo($words)
    {
        foreach ($words as $index => $word) {
            $word['level'] = $this->level;
            $word['japanese'] = [$word['japanese'][0]];
            unset($word['slug']);
            unset($word['jlpt']);
            unset($word['is_common']);
            unset($word['tags']);
            unset($word['attribution']);
            foreach ($word['senses'] as $key => $sense) {
                $pos = $sense['parts_of_speech'];
                $pos = array_filter($pos, function ($p) {
                    if ($this->currentType === 'adj-na') {
                        return $p === 'Na-adjective';
                    } else {
                        return $p !== 'Noun' && $p !== 'No-adjective' && $p !== 'Adverb' && $p !== 'Na-adjective';
                    }
                });
                if (
                    !$pos
                    || $pos === ['Wikipedia definition']
                ) {
                    unset($word['senses'][$key]);
                    continue;
                }
                $sense['parts_of_speech'] = array_values($pos);

                unset($sense['links']);
                unset($sense['tags']);
                unset($sense['restrictions']);
                unset($sense['see_also']);
                unset($sense['antonyms']);
                unset($sense['source']);
                unset($sense['info']);
                $sense['english_definitions'] = [$sense['english_definitions'][0]];
                $word['senses'][$key] =  $sense;
            }
            $word['senses'] = array_values($word['senses']);
            $words[$index] = $word;
        }
        return $words;
    }
}
