<?php

/**
 * Get the words via the Jisho api
 */
$j = new JishoScraper();
$j->getWordsOfLevel('n5');
$j->getWordsOfLevel('n4');
$j->getWordsOfLevel('n3');
$j->getWordsOfLevel('n2');
$j->getWordsOfLevel('n1');

class JishoScraper
{
    protected $baseUrl = 'http://jisho.org/api/v1/search/words';
    protected $words = [];
    protected $baseRequest = '';

    function __construct()
    {
        
    }

    public function getWordsOfLevel($level = 'n5')
    {
        $types = [
            'verb',
            'adj-i',
            'adj-na',
        ];
        
        $words = [];
        $dictionary = new stdClass();
        foreach ($types as $type) {
            $this->baseRequest = $this->baseUrl.'?keyword='.urlencode('#jlpt-'.$level.' #'.$type);
            echo $this->baseRequest."\n";
            $words = $this->getWordsFromPage(1);
            
            $dictionary->$type = $this->stripUnwantedInfo($words);
        }

        $json = json_encode($dictionary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        file_put_contents(__DIR__ . '/../src/assets/data/questions/words-'.$level.'.json', $json);
        echo "# ".count($words)."\n";
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
        $responseDecoded = json_decode($response);
        $words = $responseDecoded->data;
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
        foreach ($words as $word) {
            unset($word->is_common);
            unset($word->tags);
            unset($word->attribution);
            foreach ($word->senses as $key => $sense) {
                if (!$sense->parts_of_speech || $sense->parts_of_speech == ['Wikipedia definition']) {
                    unset($word->senses[$key]);
                    continue;
                }
                unset($sense->links);
                unset($sense->tags);
                unset($sense->restrictions);
                unset($sense->see_also);
                unset($sense->antonyms);
                unset($sense->source);
                unset($sense->info);
                $sense->english_definitions = [$sense->english_definitions[0]];
            }
            $word->senses = array_values($word->senses);
        }
        return $words;
    }

}
