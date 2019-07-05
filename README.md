# fsm.ai

[![Gitter](https://badges.gitter.im/fsm-ai/fsm.ai.svg)](https://gitter.im/fsm-ai/fsm.ai?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![NPM Version](https://img.shields.io/npm/v/fsm.ai.svg)](https://www.npmjs.com/package/fsm.ai)

## Installation

```
$ npm install fsm.ai
```

## Load

### HTML

```html
<script src="https://cdn.jsdelivr.net/npm/fsm.ai/dist/fsm-ai.common.min.js"></script>
```

### ES6

```js
import FsmAI from "fsm.ai";
```

## Usage

> in your file

```javascript
// auto-complete
FsmAI.intellisense("#demo", {
	data: [
		"normal",
		"error",
		"warning",
		"problematic",
		"exit",
		"entrance",
		"talk",
		"insurance",
		"save and protect"
	]
});
```

## License

[MIT](LICENSE)
