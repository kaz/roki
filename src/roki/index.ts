import path from "path";
import crypto from "crypto";
import yaml from "js-yaml";

import { Filesystem } from "../fs";

export default class Roki {
	private src: Filesystem;
	private dst: Filesystem;

	constructor(src: Filesystem, dst: Filesystem) {
		this.src = src;
		this.dst = dst;
	}

	private getPagePath(page: string): string {
		return path.resolve("/", page).substr(1);
	}
	private getRevisionPath(page: string, id: string): string {
		return path.join(this.getPagePath(page), "_revision", `${id}.md`);
	}
	private getAttachmentPath(page: string, filename: string): string {
		return path.join(this.getPagePath(page), "_attachment", filename);
	}

	async newRevision(page: string, content: string) {
		const timestamp = new Date();
		const meta = {
			page,
			timestamp,
			id: timestamp.getTime().toString(36),
		};
		return this.src.writeFile(
			this.getRevisionPath(page, meta.id),
			Buffer.from(["---", yaml.safeDump(meta).trim(), "---", content.trim()].join("\n")),
		);
	}
	async newAttachment(page: string, original: string, content: Buffer) {
		const filename = crypto.createHash("md5").update(content).digest("hex") + path.extname(original);
		return this.src.writeFile(this.getAttachmentPath(page, filename), content);
	}

	async deletePage(page: string) {
		return Promise.all([
			this.src.writeFile(path.dirname(this.getRevisionPath(page, "dummy")), undefined),
			this.src.writeFile(path.dirname(this.getAttachmentPath(page, "dummy")), undefined),
		]);
	}
	async deleteRevision(page: string, id: string) {
		return this.src.writeFile(this.getRevisionPath(page, id), undefined);
	}
	async deleteAttachment(page: string, filename: string) {
		return this.src.writeFile(this.getAttachmentPath(page, filename), undefined);
	}

}
