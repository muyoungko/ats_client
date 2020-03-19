# Auto Test Client
Auto test client is mobile phone. 
Web base console. 

Create code with web console then execute or schedule it.
You can use your own device or using another's device. 

If you want to use your own device, 
then you need to use 'Auto Test Client'

# instruction
```shell
$ npm -g i ats_client

Welcome Auto Test Hub
Get your client token in here - http://www.autotesthub.co.kr.s3-website.ap-northeast-2.amazonaws.com//#/token
Please enter the client token(default - eyJhbGciOi...) :

```



#Predecessor
안드로이드의 경우
Android Studio 및 sdk

아이폰의 경우
Xcode 설치
Appium 프로젝트를 iPhone에서 실행
프로비저닝 세팅

#선행 작업2
Mac의 경우 
* node 설치
* npm i - g appium 설치
* pip install Appium-Python
   Appium-Python이 파이썬2에 설치되면, python3에서 그 모듈을 못찾는다. 만약 그렇다면, 다음과 같이 설치해야한다.
   python3 -m pip install Appium-Python-Client

윈도우의 경우
* node 설치
* npm i - g appium 설치
* pip install Appium-Python

[Site](https://lodash.com/) |
[Docs](https://lodash.com/docs) |
[FP Guide](https://github.com/lodash/lodash/wiki/FP-Guide) |
[Contributing](https://github.com/lodash/lodash/blob/master/.github/CONTRIBUTING.md) |
[Wiki](https://github.com/lodash/lodash/wiki "Changelog, Roadmap, etc.") |
[Code of Conduct](https://js.foundation/community/code-of-conduct) |
[Twitter](https://twitter.com/bestiejs) |
[Chat](https://gitter.im/lodash/lodash)

The [Lodash](https://lodash.com/) library exported as a [UMD](https://github.com/umdjs/umd) module.

Generated using [lodash-cli](https://www.npmjs.com/package/lodash-cli):
```shell
$ npm run build
$ lodash -o ./dist/lodash.js
$ lodash core -o ./dist/lodash.core.js
```

## Download

 * [Core build](https://raw.githubusercontent.com/lodash/lodash/4.17.10-npm/core.js) ([~4 kB gzipped](https://raw.githubusercontent.com/lodash/lodash/4.17.10-npm/core.min.js))
 * [Full build](https://raw.githubusercontent.com/lodash/lodash/4.17.10-npm/lodash.js) ([~24 kB gzipped](https://raw.githubusercontent.com/lodash/lodash/4.17.10-npm/lodash.min.js))
 * [CDN copies](https://www.jsdelivr.com/projects/lodash) [![jsDelivr Hits](https://data.jsdelivr.com/v1/package/npm/lodash/badge)](https://www.jsdelivr.com/package/npm/lodash)

Lodash is released under the [MIT license](https://raw.githubusercontent.com/lodash/lodash/4.17.10-npm/LICENSE) & supports modern environments.<br>
Review the [build differences](https://github.com/lodash/lodash/wiki/build-differences) & pick one that’s right for you.

## Installation

In a browser:
```html
<script src="lodash.js"></script>
```

Using npm:
```shell
$ npm i -g npm
$ npm i lodash
```
Note: add --save if you are using npm < 5.0.0

In Node.js:
```js
// Load the full build.
var _ = require('lodash');
// Load the core build.
var _ = require('lodash/core');
// Load the FP build for immutable auto-curried iteratee-first data-last methods.
var fp = require('lodash/fp');

// Load method categories.
var array = require('lodash/array');
var object = require('lodash/fp/object');

// Cherry-pick methods for smaller browserify/rollup/webpack bundles.
var at = require('lodash/at');
var curryN = require('lodash/fp/curryN');
```

Looking for Lodash modules written in ES6 or smaller bundle sizes? Check out [lodash-es](https://www.npmjs.com/package/lodash-es).

## Why Lodash?

Lodash makes JavaScript easier by taking the hassle out of working with arrays,<br>
numbers, objects, strings, etc. Lodash’s modular methods are great for:

 * Iterating arrays, objects, & strings
 * Manipulating & testing values
 * Creating composite functions

## Module Formats

Lodash is available in a [variety of builds](https://lodash.com/custom-builds) & module formats.

 * [lodash](https://www.npmjs.com/package/lodash) & [per method packages](https://www.npmjs.com/search?q=keywords:lodash-modularized)
 * [lodash-es](https://www.npmjs.com/package/lodash-es), [babel-plugin-lodash](https://www.npmjs.com/package/babel-plugin-lodash), & [lodash-webpack-plugin](https://www.npmjs.com/package/lodash-webpack-plugin)
 * [lodash/fp](https://github.com/lodash/lodash/tree/npm/fp)
 * [lodash-amd](https://www.npmjs.com/package/lodash-amd)
