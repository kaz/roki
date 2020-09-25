import { Filesystem } from "../fs";

import path from "path";
import crypto from "crypto";
import yaml from "js-yaml";

export default class Roki {
	private src: Filesystem;
	private dst: Filesystem;

	constructor(src: Filesystem, dst: Filesystem) {
		this.src = src;
		this.dst = dst;
	}

	async newRevision(page: string, content: string) {
		const timestamp = new Date();
		const meta = {
			page,
			timestamp,
			id: timestamp.getTime(),
		};

		const filePath = path.join(page, "_revision", `${meta.id}.md`);
		return this.src.writeFile(filePath, Buffer.from(["---", yaml.safeDump(meta).trim(), "---", content.trim()].join("\n")));
	}
	async newAttachment(page: string, original: string, content: Buffer) {
		const id = crypto.createHash("md5").update(content).digest("hex");
		const filePath = path.join(page, "_attachment", `${id}${path.extname(original)}`);
		return this.src.writeFile(filePath, content);
	}

}
