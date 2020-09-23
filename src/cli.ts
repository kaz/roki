import GithubFilesystem from "./fs/github";
import LocalFilesystem from "./fs/local";
import Roki from "./roki";

(async () => {
	const lfs = new LocalFilesystem("./tmp");
	const ghfs = await GithubFilesystem.init("kaz", "test", "heads/master", {
		auth: "183c58e125be2241135f2ff185a732023a5269ee", // discarded!
	});

	const roki = new Roki(lfs, ghfs);

	console.log("roki.newRevision");
	await roki.newRevision("a/b/README.md", "# Hello, world!");

	console.log("ghfs.commit");
	await ghfs.commit(`${new Date().toLocaleString()} (from CLI)`);
})();
