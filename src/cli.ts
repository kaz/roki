import Roki from "./roki";
import theme from "../theme/def";
import configLoader from "../config";

(async () => {
	const config = configLoader.instantiate(process.env);
	const roki = new Roki(await config.getSourceFilesystem(), await config.getDestinationFilesystem());

	console.log("roki.newRevision");
	await roki.newRevision("a/b/README.md", "# Hello, world!");

	console.log("roki.generate");
	await roki.generate(await config.getRenderer(), theme);

	console.log("config.finalize");
	await config.finalize({
		message: new Date().toString(),
		bare: false,
	}, {
		message: new Date().toString(),
		bare: true,
	});
})();
