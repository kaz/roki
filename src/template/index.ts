import LocalLoader from "./local";

export type TemplateStore = { [key: string]: string; };

export type Template = {
	templates: TemplateStore;
	partials: TemplateStore;
};

export interface Loader {
	load(): Promise<Template>;
}

export default (): Loader => {
	return new LocalLoader("./template");
};
