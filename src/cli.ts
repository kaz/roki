import serialized from "../template";
import Roki from "./roki";
import { ThemeLoader } from "./theme/loader";

(async () => {
	const themeLoader = ThemeLoader.deserialize(await serialized());
	const theme = await themeLoader.instantiate();

	const roki = new Roki(await theme.getSourceFilesystem(), await theme.getDestinationFilesystem());

	console.log("roki.newRevision");
	await roki.newRevision("a/b/README.md", "# Hello, world!");

	console.log("roki.generate");
	await roki.generate(theme);
})();
