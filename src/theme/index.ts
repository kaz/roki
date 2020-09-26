export type TemplateStore = { [key: string]: string; };

export type Template = {
	templates: TemplateStore;
	partials: TemplateStore;
};

export type Theme = {
	template: Template;
	preference?: any;
};
