const path = require("path");
const buble = require("rollup-plugin-buble");
const replace = require("rollup-plugin-replace");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const version = process.env.VERSION || require("../package.json").version;
const banner = `/**
 * fsm.svg v${version}
 * (c) ${new Date().getFullYear()} Pengfei Wang
 * @license MIT
 */`;

const path_resolve = _path => path.resolve(__dirname, "../", _path);

const configs = {
	umdDev: {
		input: path_resolve("src/index.js"),
		file: path_resolve("dist/fsm-svg.js"),
		format: "umd",
		env: "development"
	},
	umdProd: {
		input: path_resolve("src/index.js"),
		file: path_resolve("dist/fsm-svg.min.js"),
		format: "umd",
		env: "production"
	},
	commonjs: {
		input: path_resolve("src/index.js"),
		file: path_resolve("dist/fsm-svg.common.js"),
		format: "cjs"
	},
	esm: {
		input: path_resolve("src/index.esm.js"),
		file: path_resolve("dist/fsm-svg.esm.js"),
		format: "esm"
	}
};

function genConfig(opts) {
	const config = {
		input: {
			input: opts.input,
			plugins: [
				replace({
					__VERSION__: version
				})
			]
		},
		output: {
			banner,
			file: opts.file,
			format: opts.format,
			name: "Fsm"
		}
	};

	if (opts.env) {
		config.input.plugins.unshift(
			replace({
				"process.env.NODE_ENV": JSON.stringify(opts.env)
			})
		);
	}

	if (opts.transpile !== false) {
		config.input.plugins.push(buble());
	}

	config.input.plugins.push(resolve());

	config.input.plugins.push(
		commonjs({
			// include: "node_modules/snapsvg/**"
		})
	);

	return config;
}

function mapValues(obj, fn) {
	const res = {};
	Object.keys(obj).forEach(key => {
		res[key] = fn(obj[key], key);
	});
	return res;
}

module.exports = mapValues(configs, genConfig);
