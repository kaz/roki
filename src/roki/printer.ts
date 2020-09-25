import path from "path";
import Handlebars from "handlebars";

import { Renderer } from "../md";
import { Page, Revision, Attachment } from "./parser";
import { Loader } from "../template";

interface Artifact {
	path: string;
	content: Buffer;
}

interface PageContext {
	path: string;
	created: Date;
	revision: Revision;
}
type RevisionContext = PageContext;

type TemplateDictionary = { [key: string]: (ctx: object) => Buffer; };

class JobManager {
	private md: Renderer;
	private dic: TemplateDictionary;

	constructor(md: Renderer, dic: TemplateDictionary) {
		this.md = md;
		this.dic = dic;
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
			content: this.dic["page"]({
				path: page.path,
				created: page.revisions[page.revisions.length - 1].timestamp,
				revision: Object.assign({}, page.revisions[0], { content: await this.md.render(page.revisions[0].content) }),
			} as PageContext),
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
			content: this.dic["revision"]({
				path: page.path,
				created: page.revisions[page.revisions.length - 1].timestamp,
				revision: Object.assign({}, revision, { content: await this.md.render(revision.content) }),
			} as RevisionContext),
		};
	}
	private async jobAttachment(page: Page, attachment: Attachment): Promise<Artifact> {
		return {
			path: path.join(page.path, "_attachments", attachment.filename),
			content: Buffer.from("jobRevisionList"),
		};
	};

	generateJobs(pages: Page[]): Promise<Artifact>[] {
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
		return jobs;
	}
}

export default class Printer {
	private md: Renderer;
	private loader: Loader;

	constructor(md: Renderer, loader: Loader) {
		this.md = md;
		this.loader = loader;
	}

	async print(pages: Page[]): Promise<Artifact[]> {
		const { templates, partials } = await this.loader.load();

		Object.entries(partials).forEach(([name, content]) => Handlebars.registerPartial(name, content));
		const dic = Object.fromEntries(Object.entries(templates).map(([name, content]) => {
			const fn = Handlebars.compile(content);
			return [name, (ctx: object) => Buffer.from(fn(ctx))];
		}));

		const man = new JobManager(this.md, dic);
		return Promise.all(man.generateJobs(pages));
	}
}
