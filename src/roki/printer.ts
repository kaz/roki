import path from "path";
import Handlebars from "handlebars";

import { Renderer } from "../md";
import { Page, Revision, Attachment } from "./parser";
import { Loader } from "../template";

interface Artifact {
	path: string;
	content: Buffer;
}

type Context = PageListContext | PageContext | RevisionListContext | RevisionContext;
type PageListContext = {
	pages: PageContext[];
};
type PageContext = {
	path: string;
	created: Date;
	revision: Revision;
	rendered?: string;
};
type RevisionListContext = {
	page: PageContext;
	revisions: RevisionContext[];
};
type RevisionContext = PageContext;

type TemplateDictionary = { [key: string]: (ctx: Context) => Buffer; };

class JobManager {
	private md: Renderer;
	private dic: TemplateDictionary;

	constructor(md: Renderer, dic: TemplateDictionary) {
		this.md = md;
		this.dic = dic;
	}

	private async pageContext(page: Page, render: Boolean): Promise<PageContext> {
		return {
			path: page.path,
			created: page.revisions[page.revisions.length - 1].timestamp,
			revision: page.revisions[0],
			rendered: render ? await this.md.render(page.revisions[0].content) : undefined,
		};
	}
	private async revisionContext(page: Page, revision: Revision, render: Boolean): Promise<PageContext> {
		return {
			path: page.path,
			created: page.revisions[page.revisions.length - 1].timestamp,
			revision,
			rendered: render ? await this.md.render(revision.content) : undefined,
		};
	}

	private async jobPageList(pages: Page[]): Promise<Artifact> {
		const ctx: PageListContext = {
			pages: (await Promise.all(pages.map(page => this.pageContext(page, false))))
				.sort((a, b) => b.revision.timestamp.getTime() - a.revision.timestamp.getTime()),
		};
		return {
			path: "/_pages/index.html",
			content: this.dic["pageList"](ctx),
		};
	}
	private async jobPage(page: Page): Promise<Artifact> {
		return {
			path: path.join(page.path, "index.html"),
			content: this.dic["page"](await this.pageContext(page, true)),
		};
	}
	private async jobRevisionList(page: Page): Promise<Artifact> {
		const ctx: RevisionListContext = {
			page: await this.pageContext(page, false),
			revisions: (await Promise.all(page.revisions.map(revision => this.revisionContext(page, revision, false))))
				.sort((a, b) => b.revision.timestamp.getTime() - a.revision.timestamp.getTime()),
		};
		return {
			path: path.join(page.path, "_revisions", "index.html"),
			content: this.dic["revisionList"](ctx),
		};
	}
	private async jobRevision(page: Page, revision: Revision): Promise<Artifact> {
		return {
			path: path.join(page.path, "_revisions", revision.id, "index.html"),
			content: this.dic["revision"](await this.revisionContext(page, revision, true)),
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
