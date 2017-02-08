<?php

/**
 * Get the words via the Jisho api
 */
$j = new JishoScraper();
$words = $j->getVerbsOfLevel('n3');

var_dump("#" . count($words));

class JishoScraper
{

    protected $baseUrl = 'http://jisho.org/api/v1/search/words';
    protected $words = [];
    protected $baseRequest = '';

    function __construct()
    {
    }

    public function getVerbsOfLevel($level = 'n5')
    {
        $page = 1;
        $this->baseRequest = $this->baseUrl 
                . '?keyword=' .urlencode('#jlpt-' . $level . ' #verb');
        $this->recursiveRequest($page);

        //var_dump($this->words);
        $fileObject = new stdClass();
        $fileObject->data = $this->words;
        $json = json_encode($fileObject, JSON_UNESCAPED_UNICODE);
        file_put_contents('../src/assets/data/questions/words-' . $level . '.json', $json);
        
        return $this->words;
    }

    public function recursiveRequest($page = 1)
    {
        var_dump("page $page");
        $response = file_get_contents($this->baseRequest . '&page=' . $page);
        $responseDecoded = json_decode($response);
        $words = $responseDecoded->data;
        echo "w = ".count($words) . "\n";
        if (count($words) > 0 && $page < 30) {
            // Don't spam the server
            sleep(2);
            $nextWords = $this->recursiveRequest($page + 1);
            if (is_array($nextWords)) {
                $this->words = array_merge($this->words, $nextWords);
            }
        }
        
        return $words;
    }

}
