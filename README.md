# katsu 

Katsu is a mobile conjugation practise app for Japanese verbs and adjectives.

The name is an abbreviation of the Japanese word 活用 (katsuyō), which means conjugation.

Conjungations can be practised for verbs, i-adjectives and na-adjectives.

The following forms can be practised:

* Formal or informal
* Past or non-past
* Positive or negative
* Te-form
* Volitional
* Tai-form
* Potential
* Imperative / prohibitive 


## Demo

Use a web version of the app at http://katsu.arthurhoek.nl/


## Installation and run

Make sure you have the correct environment tools available.

```
$ npm install -g ionic cordova
$ git clone https://github.com/ahoek/katsu.git
$ cd katsu
$ ionic serve
```


## Tests

Install the testing tool

```
npm install -g karma-cli
```

Run the tests

```
npm test
```


## Acknowledgements

The app is based on the Ionic framework. The word definitions were retrieved from the 
online dictionary [Jisho](http://jisho.org/).


## To do

- Add dutch translation
- Make start screen easier (disable if not correct settings)
- Option to resume quiz
- Better information on summary screen
- Handle errors if no questions could be made
