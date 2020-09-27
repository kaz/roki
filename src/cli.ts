import Roki from "./roki";
import theme from "../theme/def";
import configLoader from "../config";

(async () => {
	const config = configLoader.instantiate();
	const roki = new Roki(await config.getSourceFilesystem(), await config.getDestinationFilesystem());

	console.log("roki.newRevision");
	await roki.newRevision("a/b/README.md", "# Hello, world!");

	console.log("roki.generate");
	await roki.generate(await config.getRenderer(), theme);
})();
