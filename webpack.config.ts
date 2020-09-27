import path from "path";
import { Configuration } from "webpack";

const config: Configuration = {
	mode: "development",
	module: {
		rules: [{
			test: /\.ts$/,
			use: "ts-loader",
			exclude: /node_modules/,
		}, {
			test: /\.html$/,
			use: "raw-loader",
		}],
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
};

const webConfig: Configuration = {
	name: "web",
	target: "web",
	entry: "./src/web.ts",
	output: {
		filename: "app.js",
		path: path.join(__dirname, "./dist"),
	},
};

const cliConfig: Configuration = {
	name: "cli",
	target: "node",
	entry: "./src/cli.ts",
	output: {
		filename: "index.js",
		path: path.join(__dirname, "./lib"),
	},
};

export default [
	Object.assign({}, config, webConfig),
	Object.assign({}, config, cliConfig),
];
