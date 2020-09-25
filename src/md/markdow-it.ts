import MarkdownIt from "markdown-it";

import { Renderer } from ".";

export default class MarkdownItRenderer implements Renderer {

	private md: MarkdownIt;

	constructor() {
		this.md = new MarkdownIt("commonmark");
	}

	async render(input: string): Promise<string> {
		return this.md.render(input);
	}
}
