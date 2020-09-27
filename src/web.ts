import Roki from "./roki";
import theme from "../theme/def";
import configLoader from "../config";
import { Filesystem } from "./fs";

(async () => {
	const config = configLoader.instantiate(localStorage);
	const srcfs = await config.getSourceFilesystem();
	const dstfs = await config.getDestinationFilesystem();

	const roki = new Roki(srcfs, dstfs);

	const stage = async () => {
		const t = new Date().getTime();
		await roki.newRevision(
			(document.querySelector("#path") as HTMLInputElement).value,
			(document.querySelector("#content") as HTMLTextAreaElement).value,
		);
		console.log(`📝 New article was added in ${new Date().getTime() - t}ms`);
	};
	const build = async () => {
		const t = new Date().getTime();
		await roki.generate(await config.getRenderer(), theme);
		console.log(`📝 Built pages in ${new Date().getTime() - t}ms`);
	};
	const sync = (fs: Filesystem) => async () => {
		if (fs.sync) {
			const t = new Date().getTime();
			await fs.sync({
				message: `from ${navigator.userAgent}`,
				bare: false,
			});
			console.log(`🔁 Synced filesystem in ${new Date().getTime() - t}ms`);
		} else {
			console.log("👋 Using immediately synced filesystem!");
		}
	};

	document.querySelector(".publish")?.addEventListener("click", async () => {
		await stage();
		await sync(srcfs)();
		await build();
		await sync(dstfs)();
	});
	document.querySelector(".stage")?.addEventListener("click", stage);
	document.querySelector(".build")?.addEventListener("click", build);
	document.querySelector(".sync-srcfs")?.addEventListener("click", sync(srcfs));
	document.querySelector(".sync-dstfs")?.addEventListener("click", sync(dstfs));
})();
