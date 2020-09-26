import fs from "fs";
import path from "path";

import { Template, TemplateStore, Theme } from ".";

type Serialized = { code: string; };

export abstract class ThemeLoader {
	abstract async load(): Promise<Theme>;

	serialize(): () => Promise<Serialized> {
		return async () => ({ code: `module.exports=${JSON.stringify(await this.load())};` });
	}
	static deserialize({ code }: Serialized): ThemeLoader {
		return new class extends ThemeLoader {
			async load(): Promise<Theme> {
				return Function(`const module = {}; return ${code};`)();
			}
		};
	}

	protected async readTemplateFromFiles(dir: string): Promise<Template> {
		const template = {
			templates: {} as TemplateStore,
			partials: {} as TemplateStore,
		};

		const entries = await Promise.all(
			(await fs.promises.readdir(dir, { withFileTypes: true }))
				.filter(ent => !ent.isDirectory() && /\.html$/.test(ent.name))
				.map(async ({ name }) => {
					const [key] = name.split(/\.html$/);
					return { key, content: await fs.promises.readFile(path.join(dir, name)) };
				})
		);

		for (const { key, content } of entries) {
			template[/^_/.test(key) ? "partials" : "templates"][key] = content.toString();
		}

		return template;
	};
};
