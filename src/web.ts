import GithubFilesystem from "./fs/github";
import Roki from "./roki";

(async () => {
	const ghfs = await GithubFilesystem.init("kaz", "test", "heads/master", {
		auth: "183c58e125be2241135f2ff185a732023a5269ee", // discarded!
	});

	const roki = new Roki(ghfs, ghfs);

	document.querySelector("button")?.addEventListener("click", async () => {
		console.log("roki.newRevision");
		await roki.newRevision(
			(document.querySelector("#path") as HTMLInputElement).value,
			(document.querySelector("#content") as HTMLTextAreaElement).value,
		);

		console.log("ghfs.commit");
		await ghfs.commit(`${new Date().toLocaleString()} (from ${navigator.userAgent})`);
	});
})();
