import LocalFilesystem from "./fs/local";
import RendererFactory from "./md";
import Roki from "./roki";

(async () => {
	const srcfs = new LocalFilesystem("./tmp/src");
	const dstfs = new LocalFilesystem("./tmp/dst");
	const md = await RendererFactory();

	const roki = new Roki(srcfs, dstfs, md);

	console.log("roki.newRevision");
	await roki.newRevision("a/b/README.md", "# Hello, world!");

	console.log("roki.generate");
	await roki.generate();
})();
