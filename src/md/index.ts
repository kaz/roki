export interface Renderer {
	render(md: string): Promise<string>;
}
