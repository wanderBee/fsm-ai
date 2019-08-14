import { assert, forEachValue, fuzzyMatching, addEventListener } from "./util";
import axios from "axios";

const FSM_AUTOC_PREFIX = "fsm_autoc_";
const FSM_LIST_ITEM_CLASS = "fsm-list-item";
const FSM_ITEM_SELECTED_CLASS = "fsm-item-selected";
const FSM_ITEM_HEIGHT = 28;
const FSM_VISIBLE_ITEM_NUM = 5;
let ID_COUNTER = 1;
let keyCache = [];
let triggerX = "";

export default class AutoComplete {
	constructor(selector, options) {
		if (typeof selector === "string") {
			selector = document.querySelectorAll(selector);
		}

		this.options = options;
		this.elements = selector;
		this.parElement = selector.parentNode;

		let { hoverClass = FSM_ITEM_SELECTED_CLASS } = options;
		this.hoverClass = hoverClass;

		this._initUIEvent();
		for (var i = 0; i < this.elements.length; i++) {
			this._initKeyupEvent(this.elements[i]);
		}
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

	_initKeyupEvent(elem) {
		let {
			isServer = false,
			url = "",
			method = "get",
			param = {},
			identity = "_",
			data = [],
			trigger = "."
		} = this.options;
		triggerX = trigger;
		console.log("elem", elem);
		addEventListener(elem, "keyup", event => {
			// if (!/[a-zA-Z_\.]/.test(event.key) && "Backspace" !== event.key) {
			//  // filter input which donot match a variable regExp
			// 	return;
			// }
			if ((event.which >= 37 && event.which <= 40) || event.which === 13) {
				// arrow keycode
				this._initKeyArrowEvent(elem, event.which);
				return false;
			}

			let elemValue = elem.value;
			if (typeof elem.selectionStart !== "undefined") {
				let selPos = elem.selectionStart;
				let currentWord = getRealWord(elemValue, selPos);
			} else {
			}
			let elemValueSplit = elemValue.split(" ");
			let curInput = elemValueSplit.pop();
			if (curInput.indexOf(trigger) === -1) {
				if (elem.hasAttribute("autoComplete")) {
					hideAutoComplete(elem);
				}
				return;
			}

			let curInputArr = curInput.split(trigger);
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
				let elemBoundingRect = elem.getBoundingClientRect();
				let inputWAndH = getWAndHOfInput(elem);
				let offsetForView = {
					x: 4,
					y: 4
				};
				let pos = {
					x:
						elemBoundingRect.left +
						Math.min(inputWAndH.width, elemBoundingRect.width) +
						offsetForView.x,
					y:
						elemBoundingRect.top +
						Math.min(inputWAndH.height, elemBoundingRect.height) +
						offsetForView.y
				};
				showAutoComplete(this, elem, matchingArr, pos);
			} else {
				hideAutoComplete(elem);
			}
		});
	}

	_initKeyArrowEvent(elem, key) {
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
				if (hoverItem) {
					hoverItem.classList.remove("fsm-item-selected");
				}
				curhoverItem.classList.add("fsm-item-selected");
				// curhoverItem.scrollIntoView();
			}
		}
	}
}

// 通过空格分隔出字符串，获取当前pos位置的实际单词
function getRealWord(value, pos) {
	if (pos >= value.length) {
		return value;
	}
	let vAarray = value.split(" ");
	let length = 0;
	let realWord = value;
	for (var i = 0; i < vAarray.length; i++) {
		let word = vAarray[i];
		length += word.length + 1; // +1 代表空格
		if (length > pos) {
			realWord = word;
			break;
		}
	}
	return realWord;
}
// get width of input
function getWAndHOfInput(input) {
	let predom = document.getElementById("preFC");
	if (!predom) {
		predom = document.createElement("pre");
		predom.id = "preFC";
	}
	let inputBounding = input.getBoundingClientRect();
	predom.innerText = input.value;
	predom.style.display = "initial";
	predom.style.position = "absolute";
	predom.style["font-size"] = window.getComputedStyle(input)["font-size"];
	predom.style["font-family"] = window.getComputedStyle(input)["font-family"];
	predom.style.opacity = "0";
	document.body.appendChild(predom);
	let width = predom.offsetWidth;
	let height = predom.offsetHeight;
	predom.remove();
	return {
		width,
		height
	};
}

// 移动光标到最后
function moveEnd(textbox) {
	var sel = window.getSelection();
	var range = document.createRange();
	range.selectNodeContents(textbox);
	range.collapse(false);
	sel.removeAllRanges();
	sel.addRange(range);
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
function showAutoComplete(context, elem, datas, pos) {
	console.log(">>>showAutoComplete...", pos);
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
	if (pos) {
		pos.x && (autocDom.style.left = pos.x + "px");
		pos.y && (autocDom.style.top = pos.y + "px");
	}
}
function initNormalEvent(elem, autoCompleteElem) {
	addEventListener(autoCompleteElem, "click", ev => {
		let target = ev.target;
		while (target !== autoCompleteElem) {
			if (target.classList.contains(FSM_LIST_ITEM_CLASS)) {
				elem.value = elem.value.replace(/[\r\n]$/g, ""); // 去除换行符
				// reset value of elem
				if (typeof elem.selectionStart !== "undefined") {
					let pos = elem.selectionStart;
					setElemValue(elem, target.innerText, pos);
				} else {
					let elemValue = elem.value;
					let elemValuSplit = elemValue.split(triggerX);
					elemValuSplit.pop();
					elemValuSplit.push(target.innerText);

					elem.value = elemValuSplit.join(triggerX);
				}
				hideAutoComplete(elem);
				elem.focus();
				break;
			}
			target = target.parentNode;
		}
	});
}
function setElemValue(elem, value, pos) {
	elem.value =
		elem.value.substring(0, pos) +
		value +
		elem.value.substring(pos, elem.value.length);
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
			background: #fff;
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
