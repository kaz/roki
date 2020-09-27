import os from "os";

import Roki from "./roki";
import theme from "../theme/def";
import configLoader from "../config";

(async () => {
	const config = configLoader.instantiate(process.env);
	const srcfs = await config.getSourceFilesystem();
	const dstfs = await config.getDestinationFilesystem();

	const roki = new Roki(srcfs, dstfs);

	console.log("roki.newRevision");
	await roki.newRevision("a/b/README.md", "# Hello, world!");

	if (srcfs.sync) {
		console.log("srcfs.sync");
		await srcfs.sync({
			message: `from ${os.hostname()} (CLI)`,
			bare: false,
		});
	}

	console.log("roki.generate");
	await roki.generate(await config.getRenderer(), theme);

	if (dstfs.sync) {
		console.log("dstfs.sync");
		await dstfs.sync({
			message: `from ${os.hostname()} (CLI)`,
			bare: true,
		});
	}
})();
