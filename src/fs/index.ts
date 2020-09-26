export type Entry = {
	name: string;
	directory: Boolean;
};

export interface Filesystem {
	list(path: string): Promise<Entry[]>;
	readFile(path: string): Promise<Buffer>;
	writeFile(path: string, content?: Buffer): Promise<void>;
}
