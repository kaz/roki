import MarkdownIt, { Options, PresetName } from "markdown-it";

import { Renderer } from ".";

export type Config = {
	preset?: PresetName;
	option?: Options;
};

export default class MarkdownItRenderer implements Renderer {
	private md: MarkdownIt;

	constructor(config: Config) {
		if (config.preset) {
			this.md = new MarkdownIt(config.preset, config.option);
		} else if (config.option) {
			this.md = new MarkdownIt(config.option);
		} else {
			this.md = new MarkdownIt();
		}
	}

	async render(input: string): Promise<string> {
		return this.md.render(input);
	};
}
