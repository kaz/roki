import { Filesystem } from "../fs";
import GithubFilesystem from "../fs/github";
import LocalFilesystem from "../fs/local";
import { Renderer } from "../md";
import MarkdownItRenderer from "../md/markdown-it";
import { FilesystemConfig, GithubFilesystemConfig, LocalFilesystemConfig, Template, ThemeSource } from "./loader";

export default class Theme {
	private src: ThemeSource;

	constructor(src: ThemeSource) {
		this.src = src;
	}

	async getRenderer(): Promise<Renderer> {
		const { backend, config } = this.src.config.render;
		if (backend == "markdown-it") {
			return new MarkdownItRenderer(config);
		}
		throw new Error(`Unexpected renderer backend: ${backend}`);
	}

	private async getFilesystem({ backend, config }: FilesystemConfig): Promise<Filesystem> {
		if (backend == "local") {
			return new LocalFilesystem(config as LocalFilesystemConfig);
		}
		if (backend == "github") {
			return GithubFilesystem.init(config as GithubFilesystemConfig);
		}
		throw new Error(`Unexpected filesystem backend: ${backend}`);
	}
	async getSourceFilesystem(): Promise<Filesystem> {
		return this.getFilesystem(this.src.config.srcfs);
	}
	async getDestinationFilesystem(): Promise<Filesystem> {
		return this.getFilesystem(this.src.config.dstfs);
	}

	get template(): Template {
		return this.src.template;
	}
	get preference(): any {
		return this.src.preference;
	}
};
