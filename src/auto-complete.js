import { assert, forEachValue, fuzzyMatching, addEventListener } from "./util";
import Receptacle from "receptacle";
import axios from "axios";

const cache = new Receptacle({ max: 100 }); // Create a cache with max 100 items.
const FSM_AUTOC_PREFIX = "fsm_autoc_";
let keyCache = [];

export default class AutoComplete {
	constructor(selector, options) {
		if (typeof selector === "string") {
			selector = document.querySelector(selector);
		}

		if (process.env.NODE_ENV !== "production") {
			assert(
				selector instanceof Element,
				"reference error, instantiation failed."
			);
			assert(
				selector.tagName.toLowerCase() === "input",
				"reference error, should be an INPUT element, instantiation failed."
			);
		}

		this.element = selector;
		this.parElement = selector.parentNode;

		let { hoverClass = "fsm-item-selected" } = options;
		this.hoverClass = hoverClass;

		this._initUIEvent();

		initKeyupEvent(selector, options);
	}

	_initUIEvent() {
		let parElement = document.body;
		addEventListener(parElement, "mouseover", ev => {
			var target = ev.target;
			while (target !== parElement) {
				if (target.classList.contains("fsm-list-item")) {
					target.classList.add(this.hoverClass);
					break;
				}
				target = target.parentNode;
			}
		});
		addEventListener(parElement, "mouseout", ev => {
			var target = ev.target;
			while (target !== parElement) {
				if (target.classList.contains("fsm-list-item")) {
					target.classList.remove(this.hoverClass);
					break;
				}
				target = target.parentNode;
			}
		});
	}
}

function initKeyupEvent(elem, options) {
	let {
		isServer = false,
		url = "",
		method = "get",
		param = {},
		identity = "_",
		data = []
	} = options;

	addEventListener(elem, "keyup", event => {
		// if (!/[a-zA-Z_\.]/.test(event.key) && "Backspace" !== event.key) {
		//  // filter input which donot match a variable regExp
		// 	return;
		// }
		let elemValue = elem.value;
		let curInput = elemValue.split(" ").pop();
		if (curInput.indexOf(".") === -1) {
			if (elem.hasAttribute("autoComplete")) {
				hideAutoComplete(elem);
			}
			return;
		}

		let curInputArr = curInput.split(".");
		let parVariable = curInputArr[0];
		let matchingRegString = curInputArr[1];
		if (
			/[^a-zA-Z_\s]/g.test(parVariable) ||
			/[^a-zA-Z_]/g.test(matchingRegString)
		) {
			if (elem.hasAttribute("autoComplete")) {
				hideAutoComplete(elem);
			}
			return;
		}

		if (isServer) {
			axios({
				method: method,
				url: url,
				data: param
			}).then(resp => {
				if (typeof resp !== "array") {
					resp = [resp];
				}
				data = resp;
			});
		}

		let matchingArr = fuzzyMatching(data, matchingRegString);
		if (matchingArr.length) {
			showAutoComplete(elem, matchingArr);
		} else {
			hideAutoComplete(elem);
		}
	});
}

function hideAutoComplete(elem) {
	let fsmAutocId = FSM_AUTOC_PREFIX + elem.id;
	let autoDom = document.body.querySelector(`#${fsmAutocId}`);
	if (autoDom) {
		autoDom.style.display = "none";
		elem.removeAttribute("autoComplete");
	}
}
function showAutoComplete(elem, datas) {
	let fsmAutocId = FSM_AUTOC_PREFIX + elem.id;
	let autoDom = document.body.querySelector(`#${fsmAutocId}`);
	if (!autoDom) {
		insertFsmStyles();
		autoDom = document.createElement("div");
		autoDom.classList.add("fsm-auto-complete");
		autoDom.id = fsmAutocId;
		autoDom.innerHTML = renderOptions(datas);
		document.body.append(autoDom);
	} else {
		autoDom.innerHTML = renderOptions(datas);
	}
	autoDom.style.display = "block";
	elem.setAttribute("autoComplete", true);
}

function insertFsmStyles() {
	const borderRadius = "3px";
	let style = document.createElement("style");
	style.type = "text/css";

	style.innerHTML = `
		ul,li{
			list-style: none;
			margin: 0;
			padding: 0;
		}
		.fsm-auto-complete {
			position: absolute;
			width: 200px;
			border: 1px solid #dedede;
			border-radius: ${borderRadius};
			max-height: 142px;
    		overflow: auto;
		}
		.fsm-auto-complete ul {
			padding: 1px;
			font-size: 14px;
		}
		.fsm-auto-complete .fsm-list-item {
			border-bottom: 1px solid #dedede;
			padding: 4px;
			
		}
		.fsm-auto-complete .fsm-list-item:first-child {
			border-radius: ${borderRadius} ${borderRadius} 0 0;
		}
		.fsm-auto-complete .fsm-list-item:last-child {
			border-bottom: none;
			border-radius: 0 0 ${borderRadius} ${borderRadius};
		}
		.fsm-auto-complete .fsm-item-selected {
			background: #007CEE;
			color: #fff;
			cursor: default;
		}
	`;
	document.body.children[0].before(style);
}

function renderOptions(options) {
	if (!Array.isArray(options)) {
		return "";
	}

	let html = "<ul>";
	forEachValue(options, option => {
		html += `
            <li class="fsm-list-item">${option}</li>
        `;
	});
	html += "</ul>";
	return html;
}
