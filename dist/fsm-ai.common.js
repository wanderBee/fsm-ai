/**
 * fsm.ai v0.1.0
 * (c) 2019 Pengfei Wang
 * @license MIT
 */
'use strict';

/**
 * Deep copy the given object considering circular structure.
 * This function caches all nested objects and its copies.
 * If it detects circular structure, use cached copy to avoid infinite loop.
 *
 * @param {*} obj
 * @param {Array<Object>} cache
 * @return {*}
 */

/**
 * forEach for object
 */
function forEachValue(obj, fn) {
	Object.keys(obj).forEach(function (key) { return fn(obj[key], key); });
}

function fuzzyMatching(array, fuzzy) {
	if (!Array.isArray(array)) {
		return [];
	}
	if (fuzzy === "") {
		return array;
	}

	var matchingArr = [];
	for (var i = 0; i < array.length; i++) {
		if (typeof fuzzy === "string") {
			var _find = new RegExp(fuzzy).exec(array[i]);
			if (_find != null && _find.index > -1) {
				matchingArr.push(array[i]);
			}
		}
	}
	return matchingArr;
}

function addEventListener(elem, eventName, handler) {
	if (elem.addEventListener) {
		// IE9以下不兼容
		elem.addEventListener(eventName, handler, false);
	} else if (elem.attachEvent) {
		//IE独有
		elem.attachEvent("on" + eventName, handler);
	} else {
		elem["on" + eventName] = handler; //一个元素只能绑定一个处理程序
	}
}

// import axios from "axios";

var FSM_AUTOC_PREFIX = "fsm_autoc_";
var FSM_LIST_ITEM_CLASS = "fsm-list-item";
var FSM_ITEM_SELECTED_CLASS = "fsm-item-selected";
var FSM_ITEM_HEIGHT = 28;
var FSM_VISIBLE_ITEM_NUM = 5;
var ID_COUNTER = 1;
var triggerX = "";

var AutoComplete = function AutoComplete(selector, options) {
	if (typeof selector === "string") {
		selector = document.querySelectorAll(selector);
	}

	this.options = options;
	this.elements = selector;
	this.parElement = selector.parentNode;

	var hoverClass = options.hoverClass; if ( hoverClass === void 0 ) hoverClass = FSM_ITEM_SELECTED_CLASS;
	this.hoverClass = hoverClass;

	this._initUIEvent();
	for (var i = 0; i < this.elements.length; i++) {
		this._initKeyupEvent(this.elements[i]);
	}
};

AutoComplete.prototype._initUIEvent = function _initUIEvent () {
		var this$1 = this;

	var parElement = document.body;
	addEventListener(parElement, "mouseover", function (ev) {
		var target = ev.target;
		while (target !== parElement) {
			if (target.classList.contains(FSM_LIST_ITEM_CLASS)) {
				target.classList.add(this$1.hoverClass);
				break;
			}
			target = target.parentNode;
		}
	});
	addEventListener(parElement, "mouseout", function (ev) {
		var target = ev.target;
		while (target !== parElement) {
			if (target.classList.contains(FSM_LIST_ITEM_CLASS)) {
				target.classList.remove(this$1.hoverClass);
				break;
			}
			target = target.parentNode;
		}
	});

	addEventListener(parElement, "click", function (ev) {
		var target = ev.target;
		var toHideAutoC = true;
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
};

AutoComplete.prototype._initKeyupEvent = function _initKeyupEvent (elem) {
		var this$1 = this;

	var ref = this.options;
		var isServer = ref.isServer; if ( isServer === void 0 ) isServer = false;
		var url = ref.url; if ( url === void 0 ) url = "";
		var method = ref.method; if ( method === void 0 ) method = "get";
		var param = ref.param; if ( param === void 0 ) param = {};
		var identity = ref.identity; if ( identity === void 0 ) identity = "_";
		var data = ref.data; if ( data === void 0 ) data = [];
		var trigger = ref.trigger; if ( trigger === void 0 ) trigger = ".";
	triggerX = trigger;
	console.log("elem", elem);
	addEventListener(elem, "keyup", function (event) {
		// if (!/[a-zA-Z_\.]/.test(event.key) && "Backspace" !== event.key) {
		//  // filter input which donot match a variable regExp
		// return;
		// }
		if ((event.which >= 37 && event.which <= 40) || event.which === 13) {
			// arrow keycode
			this$1._initKeyArrowEvent(elem, event.which);
			return false;
		}

		var elemValue = elem.value;
		if (typeof elem.selectionStart !== "undefined") {
			var selPos = elem.selectionStart;
			var currentWord = getRealWord(elemValue, selPos);
		}
		var elemValueSplit = elemValue.split(" ");
		var curInput = elemValueSplit.pop();
		if (curInput.indexOf(trigger) === -1) {
			if (elem.hasAttribute("autoComplete")) {
				hideAutoComplete();
			}
			return;
		}

		var curInputArr = curInput.split(trigger);
		var parVariable = curInputArr[0];
		var matchingRegString = curInputArr[1];
		if (
			/[^a-zA-Z_\s]/g.test(parVariable) ||
			/[^a-zA-Z_]/g.test(matchingRegString)
		) {
			if (elem.hasAttribute("autoComplete")) {
				hideAutoComplete();
			}
			return;
		}

		var matchingArr = fuzzyMatching(data, matchingRegString);
		if (matchingArr.length) {
			var elemBoundingRect = elem.getBoundingClientRect();
			var inputWAndH = getWAndHOfInput(elem);
			var offsetForView = {
				x: 4,
				y: 4
			};
			var pos = {
				x:
					elemBoundingRect.left +
					Math.min(inputWAndH.width, elemBoundingRect.width) +
					offsetForView.x,
				y:
					elemBoundingRect.top +
					Math.min(inputWAndH.height, elemBoundingRect.height) +
					offsetForView.y
			};
			showAutoComplete(this$1, elem, matchingArr, pos);
		} else {
			hideAutoComplete();
		}
	});
};

AutoComplete.prototype._initKeyArrowEvent = function _initKeyArrowEvent (elem, key) {
	if (elem.hasAttribute("autoComplete")) {
		var fsmAutocId = FSM_AUTOC_PREFIX + elem.id;
		var autocDom = document.body.querySelector(("#" + fsmAutocId));
		if (autocDom) {
			var autocItems = autocDom.querySelectorAll(("." + FSM_LIST_ITEM_CLASS));
			var hoverIndex = 0;
			var hoverItem = autocDom.querySelector(("." + (this.hoverClass)));
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
			var curhoverItem = autocItems[hoverIndex];
			if (hoverItem) {
				hoverItem.classList.remove("fsm-item-selected");
			}
			curhoverItem.classList.add("fsm-item-selected");
			// curhoverItem.scrollIntoView();
		}
	}
};

// 通过空格分隔出字符串，获取当前pos位置的实际单词
function getRealWord(value, pos) {
	if (pos >= value.length) {
		return value;
	}
	var vAarray = value.split(" ");
	var length = 0;
	var realWord = value;
	for (var i = 0; i < vAarray.length; i++) {
		var word = vAarray[i];
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
	var predom = document.getElementById("preFC");
	if (!predom) {
		predom = document.createElement("pre");
		predom.id = "preFC";
	}
	var inputBounding = input.getBoundingClientRect();
	predom.innerText = input.value;
	predom.style.display = "initial";
	predom.style.position = "absolute";
	predom.style["font-size"] = window.getComputedStyle(input)["font-size"];
	predom.style["font-family"] = window.getComputedStyle(input)["font-family"];
	predom.style.opacity = "0";
	document.body.appendChild(predom);
	var width = predom.offsetWidth;
	var height = predom.offsetHeight;
	predom.remove();
	return {
		width: width,
		height: height
	};
}
function hideAutoComplete(context, elem) {
	if (!elem) {
		var autocDom$1 = document.body.querySelector('[autoComplete="true"]');
		if (autocDom$1) {
			elem = autocDom$1;
		}
	}
	if (!elem || !elem.id) {
		return;
	}
	var fsmAutocId = FSM_AUTOC_PREFIX + elem.id;
	var autocDom = document.body.querySelector(("#" + fsmAutocId));
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
	var fsmAutocId = FSM_AUTOC_PREFIX + elem.id;
	var autocDom = document.body.querySelector(("#" + fsmAutocId));
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
	addEventListener(autoCompleteElem, "click", function (ev) {
		var target = ev.target;
		while (target !== autoCompleteElem) {
			if (target.classList.contains(FSM_LIST_ITEM_CLASS)) {
				elem.value = elem.value.replace(/[\r\n]$/g, ""); // 去除换行符
				// reset value of elem
				if (typeof elem.selectionStart !== "undefined") {
					var pos = elem.selectionStart;
					setElemValue(elem, target.innerText, pos);
				} else {
					var elemValue = elem.value;
					var elemValuSplit = elemValue.split(triggerX);
					elemValuSplit.pop();
					elemValuSplit.push(target.innerText);

					elem.value = elemValuSplit.join(triggerX);
				}
				hideAutoComplete();
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
	var borderRadius = "3px";
	var style = document.createElement("style");
	style.type = "text/css";

	style.innerHTML = "\n\t\tul,li{\n\t\t\tlist-style: none;\n\t\t\tmargin: 0;\n\t\t\tpadding: 0;\n\t\t}\n\t\t.fsm-auto-complete {\n\t\t\tposition: absolute;\n\t\t\tbackground: #fff;\n\t\t\twidth: 200px;\n\t\t\tborder: 1px solid #dedede;\n\t\t\tborder-radius: " + borderRadius + ";\n\t\t\tmax-height: " + (FSM_ITEM_HEIGHT * FSM_VISIBLE_ITEM_NUM + 2) + "px;\n    \t\toverflow: auto;\n\t\t}\n\t\t.fsm-auto-complete ul {\n\t\t\tpadding: 1px;\n\t\t\tfont-size: 14px;\n\t\t}\n\t\t.fsm-auto-complete ." + FSM_LIST_ITEM_CLASS + " {\n\t\t\tborder-bottom: 1px solid #dedede;\n\t\t\tpadding: 4px;\n\t\t}\n\t\t.fsm-auto-complete ." + FSM_LIST_ITEM_CLASS + ":first-child {\n\t\t\tborder-radius: " + borderRadius + " " + borderRadius + " 0 0;\n\t\t}\n\t\t.fsm-auto-complete ." + FSM_LIST_ITEM_CLASS + ":last-child {\n\t\t\tborder-bottom: none;\n\t\t\tborder-radius: 0 0 " + borderRadius + " " + borderRadius + ";\n\t\t}\n\t\t.fsm-auto-complete ." + (context.hoverClass) + " {\n\t\t\tbackground: #007CEE;\n\t\t\tcolor: #fff;\n\t\t\tcursor: default;\n\t\t}\n\t";
	document.body.children[0].before(style);
}

function renderOptions(options) {
	if (!Array.isArray(options)) {
		return "";
	}

	var html = "<ul>";
	forEachValue(options, function (option, index) {
		html += "\n            <li index=\"" + index + "\" class=\"" + FSM_LIST_ITEM_CLASS + "\">" + option + "</li>\n        ";
	});
	html += "</ul>";
	return html;
}

var AI = function AI() {};

AI.intellisense = function intellisense (selector, options) {
	return new AutoComplete(selector, options);
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author pengfei.wang
*/

module.exports = AI;
