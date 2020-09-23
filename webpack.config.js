"use strict";

const path = require("path");

module.exports = {
	mode: "development",
	entry: "./src/web.ts",
	output: {
		filename: "app.js",
		path: path.join(__dirname, "./dist"),
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
};
