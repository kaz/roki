import path from "path";

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
