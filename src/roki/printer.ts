import path from "path";
import Handlebars from "handlebars";

import { Renderer } from "../md";
import { Page, Revision, Attachment } from "./parser";
import { Theme } from "../theme";

type Artifact = {
	path: string;
	content: Buffer;
};

type CompiledTemplate = (ctx: Context) => Buffer;
type CompiledTemplateSet = { [key: string]: CompiledTemplate; };

type Context = CommonContext & (PageListContext | PageContext | RevisionListContext | RevisionContext);
type CommonContext = {
	preference: any;
};
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

export class Printer {
	private md: Renderer;
	private commonCtx: CommonContext;
	private templates: CompiledTemplateSet;

	constructor(md: Renderer, theme: Theme) {
		this.md = md;
		this.commonCtx = { preference: theme.preference };

		this.templates = Object.fromEntries(Object.entries(theme.template.templates).map(([name, content]) => {
			const fn = Handlebars.compile(content);
			return [name, (ctx: object) => Buffer.from(fn(ctx))];
		}));
		Object.entries(theme.template.partials).forEach(([name, content]) => Handlebars.registerPartial(name, content));
	}

	private async pageContext(page: Page, render: boolean): Promise<PageContext> {
		return {
			path: page.path,
			created: page.revisions[page.revisions.length - 1].timestamp,
			revision: page.revisions[0],
			rendered: render ? await this.md.render(page.revisions[0].content) : undefined,
		};
	}
	private async revisionContext(page: Page, revision: Revision, render: boolean): Promise<PageContext> {
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
			content: this.templates["pageList"](Object.assign(ctx, this.commonCtx)),
		};
	}
	private async jobPage(page: Page): Promise<Artifact> {
		const ctx: PageContext = await this.pageContext(page, true);
		return {
			path: path.join(page.path, "index.html"),
			content: this.templates["page"](Object.assign(ctx, this.commonCtx)),
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
			content: this.templates["revisionList"](Object.assign(ctx, this.commonCtx)),
		};
	}
	private async jobRevision(page: Page, revision: Revision): Promise<Artifact> {
		const ctx: RevisionContext = await this.revisionContext(page, revision, true);
		return {
			path: path.join(page.path, "_revisions", revision.id, "index.html"),
			content: this.templates["revision"](Object.assign(ctx, this.commonCtx)),
		};
	}
	private async jobAttachment(page: Page, attachment: Attachment): Promise<Artifact> {
		return {
			path: path.join(page.path, "_attachments", attachment.filename),
			content: Buffer.from("jobRevisionList"),
		};
	};

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
