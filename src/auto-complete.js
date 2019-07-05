import { assert, forEachValue, fuzzyMatching, addEventListener } from "./util";
import Receptacle from "receptacle";
import axios from "axios";

const cache = new Receptacle({ max: 100 }); // Create a cache with max 100 items.
const FSM_AUTOC_PREFIX = "fsm_autoc_";
const FSM_LIST_ITEM_CLASS = "fsm-list-item";
const FSM_ITEM_SELECTED_CLASS = "fsm-item-selected";
const FSM_ITEM_HEIGHT = 28;
const FSM_VISIBLE_ITEM_NUM = 5;
let ID_COUNTER = 1;
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
				selector.type === "text" || selector.type === "textarea",
				"reference error, should be an text element, instantiation failed."
			);
		}

		this.options = options;
		this.element = selector;
		this.parElement = selector.parentNode;

		let { hoverClass = FSM_ITEM_SELECTED_CLASS } = options;
		this.hoverClass = hoverClass;

		this._initUIEvent();

		addEventListener(selector, "focus", () => {
			this._initKeyupEvent();
		});
	}

	_initUIEvent() {
		let parElement = document.body;
		addEventListener(parElement, "mouseover", ev => {
			let target = ev.target;
			while (target !== parElement) {
				if (target.classList.contains(FSM_LIST_ITEM_CLASS)) {
					target.classList.add(this.hoverClass);
					break;
				}
				target = target.parentNode;
			}
		});
		addEventListener(parElement, "mouseout", ev => {
			let target = ev.target;
			while (target !== parElement) {
				if (target.classList.contains(FSM_LIST_ITEM_CLASS)) {
					target.classList.remove(this.hoverClass);
					break;
				}
				target = target.parentNode;
			}
		});

		addEventListener(parElement, "click", ev => {
			let target = ev.target;
			let toHideAutoC = true;
			while (target !== parElement) {
				if (target.classList.contains("fsm-auto-complete")) {
					toHideAutoC = false;
					break;
				}
				target = target.parentNode;
			}
			if (toHideAutoC) {
				hideAutoComplete();
			}
		});
	}

	_initKeyupEvent() {
		let {
			isServer = false,
			url = "",
			method = "get",
			param = {},
			identity = "_",
			data = []
		} = this.options;
		let elem = this.element;

		addEventListener(elem, "keyup", event => {
			// if (!/[a-zA-Z_\.]/.test(event.key) && "Backspace" !== event.key) {
			//  // filter input which donot match a variable regExp
			// 	return;
			// }
			if ((event.which >= 37 && event.which <= 40) || event.which === 13) {
				// arrow keycode
				this._initKeyArrowEvent(event.which);
				return;
			}

			let elemValue = elem.value;
			let elemValueSplit = elemValue.split(" ");
			let curInput = elemValueSplit.pop();
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
				showAutoComplete(this, elem, matchingArr);
			} else {
				hideAutoComplete(elem);
			}
		});
	}

	_initKeyArrowEvent(key) {
		console.log("=========== _initKeyArrowEvent", key);
		let elem = this.element;
		if (elem.hasAttribute("autoComplete")) {
			let fsmAutocId = FSM_AUTOC_PREFIX + elem.id;
			let autocDom = document.body.querySelector(`#${fsmAutocId}`);
			if (autocDom) {
				let autocItems = autocDom.querySelectorAll(`.${FSM_LIST_ITEM_CLASS}`);
				let hoverIndex = 0;
				let hoverItem = autocDom.querySelector(`.${this.hoverClass}`);
				if (key === 13) {
					// enter
					hoverItem.click();
					return;
				} else if (key === 38) {
					// up arrow
					if (hoverItem) {
						hoverIndex = parseInt(hoverItem.getAttribute("index")) - 1;
						if (hoverIndex < 0) {
							hoverIndex = 0;
						}
					}
					autocDom.scroll({
						top: FSM_ITEM_HEIGHT * (hoverIndex - FSM_VISIBLE_ITEM_NUM + 1)
					});
				} else if (key === 40) {
					// down arrow
					if (hoverItem) {
						hoverIndex = parseInt(hoverItem.getAttribute("index")) + 1;
						if (hoverIndex > autocItems.length - 1) {
							hoverIndex = autocItems.length - 1;
						}
					}
					autocDom.scroll({
						top: FSM_ITEM_HEIGHT * (hoverIndex - FSM_VISIBLE_ITEM_NUM + 1)
					});
				}
				let curhoverItem = autocItems[hoverIndex];
				console.log(">>> hoverItem:", autocItems, autocItems[0], curhoverItem);
				if (hoverItem) {
					hoverItem.classList.remove("fsm-item-selected");
				}
				curhoverItem.classList.add("fsm-item-selected");
				// curhoverItem.scrollIntoView();
			}
		}
	}
}

function hideAutoComplete(context, elem) {
	if (!elem) {
		let autocDom = document.body.querySelector('[autoComplete="true"]');
		if (autocDom) {
			elem = autocDom;
		}
	}
	if (!elem || !elem.id) {
		return;
	}
	let fsmAutocId = FSM_AUTOC_PREFIX + elem.id;
	let autocDom = document.body.querySelector(`#${fsmAutocId}`);
	if (autocDom) {
		autocDom.style.display = "none";
		elem.removeAttribute("autoComplete");
	}
}
function showAutoComplete(context, elem, datas) {
	console.log(">>>showAutoComplete...");
	if (!elem.id) {
		elem.id = "ran" + ID_COUNTER;
		ID_COUNTER = ID_COUNTER + 1;
	}
	let fsmAutocId = FSM_AUTOC_PREFIX + elem.id;
	let autocDom = document.body.querySelector(`#${fsmAutocId}`);
	if (!autocDom) {
		insertStyles(context);
		autocDom = document.createElement("div");
		autocDom.classList.add("fsm-auto-complete");
		autocDom.id = fsmAutocId;
		autocDom.innerHTML = renderOptions(datas);
		document.body.append(autocDom);
		initNormalEvent(elem, autocDom);
	} else {
		autocDom.innerHTML = renderOptions(datas);
	}
	autocDom.style.display = "block";
	elem.setAttribute("autoComplete", true);
}
function initNormalEvent(elem, autoCompleteElem) {
	addEventListener(autoCompleteElem, "click", ev => {
		let target = ev.target;
		while (target !== autoCompleteElem) {
			if (target.classList.contains(FSM_LIST_ITEM_CLASS)) {
				// reset value of elem
				let elemValue = elem.value;
				let elemValueSplit = elemValue.split(".");
				elemValueSplit.pop();
				elemValueSplit.push(target.innerText);
				elem.value = elemValueSplit.join(".");
				hideAutoComplete(elem);
				elem.focus();
				break;
			}
			target = target.parentNode;
		}
	});
}

function insertStyles(context) {
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
			max-height: ${FSM_ITEM_HEIGHT * FSM_VISIBLE_ITEM_NUM + 2}px;
    		overflow: auto;
		}
		.fsm-auto-complete ul {
			padding: 1px;
			font-size: 14px;
		}
		.fsm-auto-complete .${FSM_LIST_ITEM_CLASS} {
			border-bottom: 1px solid #dedede;
			padding: 4px;
		}
		.fsm-auto-complete .${FSM_LIST_ITEM_CLASS}:first-child {
			border-radius: ${borderRadius} ${borderRadius} 0 0;
		}
		.fsm-auto-complete .${FSM_LIST_ITEM_CLASS}:last-child {
			border-bottom: none;
			border-radius: 0 0 ${borderRadius} ${borderRadius};
		}
		.fsm-auto-complete .${context.hoverClass} {
			background: #007CEE;
			color: #fff;
			cursor: default;
		}
	`;
	document.body.children[0].before(style);
}

function renderOptions(options) {
	console.log(">>> renderOptions....");
	if (!Array.isArray(options)) {
		return "";
	}

	let html = "<ul>";
	forEachValue(options, (option, index) => {
		html += `
            <li index="${index}" class="${FSM_LIST_ITEM_CLASS}">${option}</li>
        `;
	});
	html += "</ul>";
	return html;
}
