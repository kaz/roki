import configLoader from "../config";
import serializedThemeLoader from "../template";

import Roki from "./roki";
import ThemeLoader from "./theme/loader";

(async () => {
	const themeLoader = ThemeLoader.deserialize(await serializedThemeLoader());
	const theme = await themeLoader.load();

	const config = configLoader.instantiate();
	const roki = new Roki(await config.getSourceFilesystem(), await config.getDestinationFilesystem());

	console.log("roki.newRevision");
	await roki.newRevision("a/b/README.md", "# Hello, world!");

	console.log("roki.generate");
	await roki.generate(await config.getRenderer(), theme);
})();
