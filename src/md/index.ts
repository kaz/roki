import MarkdownItRenderer from "./markdow-it";

export interface Renderer {
	render(md: string): Promise<string>;
}

export default (): Renderer => {
	return new MarkdownItRenderer();
};
