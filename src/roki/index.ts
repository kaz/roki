import crypto from "crypto";
import yaml from "js-yaml";

import { Filesystem } from "../fs";
import { Renderer } from "../md";
import SourceParser, { PathTranslator } from "./parser";

export default class Roki {
	private src: Filesystem;
	private dst: Filesystem;
	private md: Renderer;

	constructor(src: Filesystem, dst: Filesystem, md: Renderer) {
		this.src = src;
		this.dst = dst;
		this.md = md;
	}

	async newRevision(page: string, content: string) {
		const timestamp = new Date();
		const meta = {
			page,
			timestamp,
			id: timestamp.getTime().toString(36),
		};
		return this.src.writeFile(
			PathTranslator.revisionFile(page, meta.id),
			Buffer.from(["---", yaml.safeDump(meta).trim(), "---", content.trim()].join("\n")),
		);
	}
	async newAttachment(page: string, original: string, content: Buffer) {
		const id = crypto.createHash("md5").update(content).digest("hex");
		return this.src.writeFile(PathTranslator.attachmentFile(page, id, original), content);
	}

	async deletePage(page: string) {
		return Promise.all([
			this.src.writeFile(PathTranslator.revisionDir(page), undefined),
			this.src.writeFile(PathTranslator.attachmentDir(page), undefined),
		]);
	}
	async deleteRevision(page: string, id: string) {
		return this.src.writeFile(PathTranslator.revisionFile(page, id), undefined);
	}
	async deleteAttachment(page: string, filename: string) {
		return this.src.writeFile(PathTranslator.attachmentFile(page, filename, ""), undefined);
	}

	async generate() {
		const parser = new SourceParser(this.src);
		const pages = await parser.getPages();

		console.log(pages);
	}
}
