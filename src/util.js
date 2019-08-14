/**
 * Deep copy the given object considering circular structure.
 * This function caches all nested objects and its copies.
 * If it detects circular structure, use cached copy to avoid infinite loop.
 *
 * @param {*} obj
 * @param {Array<Object>} cache
 * @return {*}
 */
export function deepCopy(obj, cache = []) {
	// just return if obj is immutable value
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	// if obj is hit, it is in circular structure
	const hit = find(cache, c => c.original === obj);
	if (hit) {
		return hit.copy;
	}

	const copy = Array.isArray(obj) ? [] : {};
	// put the copy into cache at first
	// because we want to refer it in recursive deepCopy
	cache.push({
		original: obj,
		copy
	});

	Object.keys(obj).forEach(key => {
		copy[key] = deepCopy(obj[key], cache);
	});

	return copy;
}

/**
 * forEach for object
 */
export function forEachValue(obj, fn) {
	Object.keys(obj).forEach(key => fn(obj[key], key));
}

export function assert(condition, msg) {
	if (!condition) throw new Error(`[fsm.ai] ${msg}`);
}

export function binarySearch(array, key) {
	if (!Array.isArray(array)) {
		return -1;
	}
	var begin = 0;
	var end = array.length - 1;
	while (begin <= end) {
		var mid = begin + (end - begin) / 2;
		if (array[mid] > key) {
			end = mid - 1;
		} else if (array[mid] < key) {
			begin = mid + 1;
		} else {
			return mid;
		}
	}
	return -1;
}

export function fuzzyMatching(array, fuzzy) {
	if (!Array.isArray(array)) {
		return [];
	}
	if (fuzzy === "") {
		return array;
	}

	let matchingArr = [];
	for (var i = 0; i < array.length; i++) {
		if (typeof fuzzy === "string") {
			let _find = new RegExp(fuzzy).exec(array[i]);
			if (_find != null && _find.index > -1) {
				matchingArr.push(array[i]);
			}
		}
	}
	return matchingArr;
}

export function addEventListener(elem, eventName, handler) {
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
export function removeEventListener(elem, eventName, handler) {
	if (elem.removeEventListener) {
		//addEventListener
		elem.removeEventListener(eventName, handler, false);
	} else if (elem.detachEvent) {
		//attachEvent
		elem.detachEvent("on" + eventName, handler);
	} else {
		elem["on" + type] = null;
	}
}
