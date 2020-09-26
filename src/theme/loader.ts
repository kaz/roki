import fs from "fs";
import path from "path";

import { Config as LocalFilesystemConfig } from "../fs/local";
import { Config as GithubFilesystemConfig } from "../fs/github";
import { Config as MarkdownItRenderConfig } from "../md/markdown-it";
import Theme from ".";

type TemplateStore = { [key: string]: string; };
export type Template = {
	templates: TemplateStore;
	partials: TemplateStore;
};

export { MarkdownItRenderConfig };
export type RenderConfig = {
	backend: "markdown-it";
	config: MarkdownItRenderConfig;
};

export { LocalFilesystemConfig, GithubFilesystemConfig };
export type FilesystemConfig = {
	backend: "local" | "github";
	config: LocalFilesystemConfig | GithubFilesystemConfig;
};

type Config = {
	render: RenderConfig;
	srcfs: FilesystemConfig;
	dstfs: FilesystemConfig;
};

export type ThemeSource = {
	template: Template;
	config: Config;
	preference?: any;
};

type SerializedThemeLoader = { code: string; };

export default abstract class ThemeLoader {
	abstract async load(): Promise<ThemeSource>;

	async instantiate(): Promise<Theme> {
		return new Theme(await this.load());
	}

	serialize(): () => Promise<SerializedThemeLoader> {
		return async () => ({ code: `module.exports=${JSON.stringify(await this.load())};` });
	}
	static deserialize({ code }: SerializedThemeLoader): ThemeLoader {
		return new class extends ThemeLoader {
			async load(): Promise<ThemeSource> {
				return Function(`const module = {}; return ${code};`)();
			}
		};
	}

	protected async loadTemplates(dir: string): Promise<Template> {
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
