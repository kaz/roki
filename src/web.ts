import Roki from "./roki";
import theme from "../theme/def";
import configLoader from "../config";

(async () => {
	const config = configLoader.instantiate(localStorage);
	const roki = new Roki(await config.getSourceFilesystem(), await config.getDestinationFilesystem());

	document.querySelector("button")?.addEventListener("click", async () => {
		console.log("roki.newRevision");
		await roki.newRevision(
			(document.querySelector("#path") as HTMLInputElement).value,
			(document.querySelector("#content") as HTMLTextAreaElement).value,
		);

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
	});
})();
