import path from "path";

import { Renderer } from "../md";
import { Page, Revision, Attachment } from "./parser";

interface Artifact {
	path: string;
	content: Buffer;
}

export default class Printer {
	private md: Renderer;

	constructor(md: Renderer) {
		this.md = md;
	}

	private async jobPageList(pages: Page[]): Promise<Artifact> {
		return {
			path: "/_pages/index.html",
			content: Buffer.from("jobPageList"),
		};
	}
	private async jobPage(page: Page): Promise<Artifact> {
		return {
			path: path.join(page.path, "index.html"),
			content: Buffer.from("jobPage"),
		};
	}
	private async jobRevisionList(page: Page): Promise<Artifact> {
		return {
			path: path.join(page.path, "_revisions", "index.html"),
			content: Buffer.from("jobRevisionList"),
		};
	}
	private async jobRevision(page: Page, revision: Revision): Promise<Artifact> {
		return {
			path: path.join(page.path, "_revisions", revision.id, "index.html"),
			content: Buffer.from("jobRevisionList"),
		};
	}
	private async jobAttachment(page: Page, attachment: Attachment): Promise<Artifact> {
		return {
			path: path.join(page.path, "_attachments", attachment.filename),
			content: Buffer.from("jobRevisionList"),
		};
	}

	async print(pages: Page[]): Promise<Artifact[]> {
		const jobs = [];

		jobs.push(this.jobPageList(pages));
		for (const page of pages) {
			jobs.push(this.jobPage(page));
			jobs.push(this.jobRevisionList(page));
			for (const revision of page.revisions) {
				jobs.push(this.jobRevision(page, revision));
			}
			for (const attachment of page.attachments) {
				jobs.push(this.jobAttachment(page, attachment));
			}
		}

		return Promise.all(jobs);
	}
}
