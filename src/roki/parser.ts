import path from "path";
import yaml from "js-yaml";

import { Filesystem } from "../fs";

const REVISION_DIR = "_revision";
const ATTACHMENT_DIR = "_attachment";

export class PathTranslator {
	static pageDir(page: string): string {
		return path.resolve("/", page).substr(1);
	}

	static revisionDir(page: string): string {
		return path.join(this.pageDir(page), REVISION_DIR);
	}
	static attachmentDir(page: string): string {
		return path.join(this.pageDir(page), ATTACHMENT_DIR);
	}

	static revisionFile(page: string, id: string): string {
		return path.join(this.revisionDir(page), `${id}.md`);
	}
	static attachmentFile(page: string, id: string, extSrc: string): string {
		return path.join(this.attachmentDir(page), `${id}${path.extname(extSrc)}`);
	}
}

export type Page = {
	path: string;
	revisions: Revision[];
	attachments: Attachment[];
};
export type Revision = {
	id: string;
	timestamp: Date;
	content: string;
};
export type Attachment = {
	filename: string;
	content: Buffer;
};

export default class SourceParser {
	private src: Filesystem;

	constructor(src: Filesystem) {
		this.src = src;
	}

	async getPages(pagePath: string = "/"): Promise<Page[]> {
		const fsPath = PathTranslator.pageDir(pagePath);

		const pages = (await this.src.list(fsPath))
			.filter(({ name, directory }) => {
				if (!directory) {
					console.warn("[WARN]", "unexpected file found:", path.join(fsPath, name));
					return false;
				}
				if (name == REVISION_DIR || name == ATTACHMENT_DIR) {
					return false;
				}
				return true;
			})
			.map(({ name }) => this.getPages(path.join(pagePath, name)));

		pages.unshift((async () => {
			const [revisions, attachments] = await Promise.all([
				this.getRevisions(pagePath),
				this.getAttachments(pagePath),
			]);
			return [{
				path: pagePath,
				revisions,
				attachments,
			}];
		})());

		return (await Promise.all(pages)).flat().filter(({ revisions }) => revisions.length);
	}

	private async getRevisions(pagePath: string): Promise<Revision[]> {
		const fsPath = PathTranslator.revisionDir(pagePath);
		const entries = await this.src.list(fsPath).catch(() => []);

		return await Promise.all(
			entries
				.filter(({ name, directory }) => {
					if (directory) {
						console.warn("[WARN]", "unexpected directory found:", path.join(fsPath, name));
						return false;
					}
					if (!/\.md$/.test(name)) {
						console.warn("[WARN]", "unexpected file found:", path.join(fsPath, name));
						return false;
					}
					return true;
				})
				.map(async ({ name }) => this.parseRevision(await this.src.readFile(path.join(fsPath, name))))
		);
	}
	private async getAttachments(pagePath: string): Promise<Attachment[]> {
		const fsPath = PathTranslator.attachmentDir(pagePath);
		const entries = await this.src.list(fsPath).catch(() => []);

		return Promise.all(
			entries
				.filter(({ name, directory }) => {
					if (directory) {
						console.warn("[WARN]", "unexpected directory found:", path.join(fsPath, name));
						return false;
					}
					return true;
				})
				.map(async ({ name }) => ({
					filename: name,
					content: await this.src.readFile(path.join(fsPath, name)),
				}))
		);
	}

	private parseRevision(data: Buffer): Revision {
		const [, meta, content] = data.toString("utf-8").split("---\n");
		const rev = yaml.safeLoad(meta) as Revision;
		rev.content = content;
		return rev;
	}
}
