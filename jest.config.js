module.exports = {
	testRegex: "/test/.*.spec.jsx?$",
	transform: {
		"^.+\\.jsx?$": "babel-jest"
	},
	verbose: true,
	bail: 1
};
