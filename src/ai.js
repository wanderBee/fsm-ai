import AutoComplete from "./auto-complete";

class AI {
	constructor() {}

	static intellisense(selector, options) {
		return new AutoComplete(selector, options);
	}
}

export default AI;
