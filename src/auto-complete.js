import { assert, forEachValue, fuzzyMatching, addEventListener } from "./util";
import Receptacle from "receptacle";
import axios from "axios";

const cache = new Receptacle({ max: 100 }); // Create a cache with max 100 items.

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

		initKeyupEvent(selector, options);
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

	let keyCache = [];
	addEventListener(elem, "keyup", event => {
		if (/\s/.test(event.code)) {
			keyCache = [];
			hideAutoComplete(elem);
			return;
		}

		keyCache.push(event.code);

		let lastKey = keyCache[keyCache.length - 1];
		let inputValue = keyCache.splice(1).join("");

		if (lastKey === ".") {
			if (keyCache.length > 1) {
				// 已经存在 .
				keyCache = ["."];
				inputValue = "";
			}

			if (isServer) {
				console.log(">>> axios request auto-complete data...");
				axios({
					method: method,
					url: url,
					data: param
				}).then(resp => {
					console.log(">>> axios request auto-complete data, response:", resp);
				});
			}
		}

		let matchingArr = fuzzyMatching(data, inputValue);
		// console.log(
		// 	">>>> fuzzyMatching:",
		// 	data,
		// 	inputValue === "" ? "nothing" : inputValue,
		// 	matchingArr
		// );
		if (matchingArr.length) {
			showAutoComplete(elem, matchingArr);
		}
	});
}

function hideAutoComplete(elem) {
	let autoDom = document.body.querySelector(`#${fsmAutocId}`);
	if (autoDom) {
		autoDom.style.display = "none";
	}
}
function showAutoComplete(elem, datas) {
	let fsmAutocId = "fsm_autoc_" + elem.id;
	let autoDom = document.body.querySelector(`#${fsmAutocId}`);
	if (!autoDom) {
		insertFsmStyles();
		autoDom = document.createElement("div");
		autoDom.id = fsmAutocId;
		autoDom.innerHTML = renderOptions(datas);
		document.body.append(autoDom);
	} else {
		autoDom.innerHTML = renderOptions(datas);
	}
}

function insertFsmStyles() {
	var style = document.createElement("style");
	style.type = "text/css";
	style.innerHTML = `
		ul,li{
			list-style: none;
		}
		.fsm-auto-complete {
			display: none;		
			position: absolute;
		}
		.fsm-auto-complete .list-item {

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
            <li class="list-item">${option}</li>
        `;
	});
	html += "</ul>";
	return html;
}
