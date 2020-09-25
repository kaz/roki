import fs from "fs";
import { partials, templates } from "handlebars";
import path from "path";

import { Template, Loader, TemplateStore } from ".";

export default class LocalLoader implements Loader {
	private dir: string;

	constructor(dir: string) {
		this.dir = dir;
	}

	async load(): Promise<Template> {
		const template = {
			templates: {} as TemplateStore,
			partials: {} as TemplateStore,
		};

		const entries = await Promise.all(
			(await fs.promises.readdir(this.dir, { withFileTypes: true }))
				.filter(ent => !ent.isDirectory() && /\.html$/.test(ent.name))
				.map(async ({ name }) => {
					const [key] = name.split(/\.html$/);
					return { key, content: await fs.promises.readFile(path.join(this.dir, name)) };
				})
		);

		for (const { key, content } of entries) {
			template[/^_/.test(key) ? "partials" : "templates"][key] = content.toString();
		}

		return template;
	}
}
