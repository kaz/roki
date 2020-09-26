import fs from "fs";
import path from "path";
import rmrf from "rmfr";

import { Entry, Filesystem } from ".";

export type Config = {
	root: string;
};

export class LocalFilesystem implements Filesystem {
	private root: string;

	constructor(config: Config) {
		this.root = path.resolve(config.root);
	}

	async list(dir: string): Promise<Entry[]> {
		const ents = await fs.promises.readdir(path.join(this.root, dir), { withFileTypes: true });
		return ents.map(e => ({ name: e.name, directory: e.isDirectory() }));
	}
	async readFile(file: string): Promise<Buffer> {
		return fs.promises.readFile(path.join(this.root, file));
	}
	async writeFile(file: string, content?: Buffer) {
		const filePath = path.join(this.root, file);
		if (!content) {
			return rmrf(filePath);
		}
		await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
		return fs.promises.writeFile(filePath, content);
	}
}
