/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author pengfei.wang
*/
"use strict";

import AutoComplete from "../src/auto-complete";

describe("Intellisense", () => {
	var i;
	beforeEach(function() {
		// Set up our document body
		document.body.innerHTML = ` 
		<div><input type="text" value="" id="demo" /></div>
        `;
		i = new AutoComplete("#demo", {
			data: ["终点就在前方不远处啊", "terminal"]
		});
	});

	it("should exists", () => {
		expect(i).toBeDefined();
	});

	it("keypress '.' and 'm' should trigger auto-complete.", () => {
		let dom = document.querySelector("#demo"),
			autoCompleteItems;
		var ev = new KeyboardEvent("keyup", { code: "." });
		dom.dispatchEvent(ev);
		setTimeout(() => {
			autoCompleteItems =
				document.querySelector("#fsm_autoc_demo .list-item") || [];
			expect(autoCompleteItems.length).toEqual(2);
		}, 0);

		ev = new KeyboardEvent("keyup", { code: "m" });
		dom.dispatchEvent(ev);
		setTimeout(() => {
			autoCompleteItems =
				document.querySelector("#fsm_autoc_demo .list-item") || [];
			expect(autoCompleteItems.length).toEqual(1);
		}, 0);

		expect(i).toBeDefined();
	});

	it("no keypress '.' before 'm' will trigger nothing.", () => {
		let dom = document.querySelector("#demo"),
			autoCompleteItems;
		var ev = new KeyboardEvent("keyup", { code: "m" });
		dom.dispatchEvent(ev);
		setTimeout(() => {
			autoCompleteItems =
				document.querySelector("#fsm_autoc_demo .list-item") || [];
			expect(autoCompleteItems.length).toEqual(0);
		}, 0);
	});
});
