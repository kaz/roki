import { Filesystem } from "./fs";

export default class Roki {
	private src: Filesystem;
	private dst: Filesystem;

	constructor(src: Filesystem, dst: Filesystem) {
		this.src = src;
		this.dst = dst;
	}

	async newRevision(path: string, content: string) {
		return this.src.writeFile(path, Buffer.from(content));
	}
	async newAttachment(path: string, content: Buffer) {
		return this.src.writeFile(path, content);
	}

}
