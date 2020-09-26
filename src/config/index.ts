import { Filesystem } from "../fs";
import GithubFilesystem from "../fs/github";
import LocalFilesystem from "../fs/local";
import { Renderer } from "../md";
import MarkdownItRenderer from "../md/markdown-it";


import { Config as LocalFilesystemConfig } from "../fs/local";
import { Config as GithubFilesystemConfig } from "../fs/github";
import { Config as MarkdownItRenderConfig } from "../md/markdown-it";

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

export type BaseConfig = {
	render: RenderConfig;
	srcfs: FilesystemConfig;
	dstfs: FilesystemConfig;
};

export default class Config {
	private base: BaseConfig;

	constructor(base: BaseConfig) {
		this.base = base;
	}

	async getRenderer(): Promise<Renderer> {
		const { backend, config } = this.base.render;
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
		return this.getFilesystem(this.base.srcfs);
	}
	async getDestinationFilesystem(): Promise<Filesystem> {
		return this.getFilesystem(this.base.dstfs);
	}
}
