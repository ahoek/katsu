<?php

/**
 * Get the words via the Jisho api
 */
$j = new JishoScraper();
//$words = $j->getWordsOfLevel('n5');
//$words = $j->getWordsOfLevel('n4');
//$words = $j->getWordsOfLevel('n3');
//$words = $j->getWordsOfLevel('n2');
$words = $j->getWordsOfLevel('n1');
var_dump("#".count($words));

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
        
        $fileObject = new stdClass();
        foreach ($types as $type) {
            $this->baseRequest = $this->baseUrl.'?keyword='.urlencode('#jlpt-'.$level.' #'.$type);
            var_dump($this->baseRequest);
            $words = $this->recursiveRequest(1);
            $fileObject->$type = $words;
        }

        $json = json_encode($fileObject, JSON_UNESCAPED_UNICODE);
        file_put_contents('../src/assets/data/questions/words-'.$level.'.json', $json);

        return $words;
    }

    public function recursiveRequest($page = 1)
    {
        var_dump("page $page");
        $response = file_get_contents($this->baseRequest.'&page='.$page);
        $responseDecoded = json_decode($response);
        $words = $responseDecoded->data;
        echo "w = ".count($words)."\n";
        if (count($words) > 0 && $page < 100) {
            // Don't spam the server
            sleep(3);
            $nextWords = $this->recursiveRequest($page + 1);
            if (is_array($nextWords)) {
                $words = array_merge($words, $nextWords);
            }
        }

        return $words;
    }

}
