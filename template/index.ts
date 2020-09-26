import { ThemeLoader, ThemeSource } from "../src/theme/loader";

class SampleThemeLoader extends ThemeLoader {
	async load(): Promise<ThemeSource> {
		return {
			template: await this.loadTemplates("./template"),
			config: {
				render: {
					backend: "markdown-it",
					config: {
						preset: "commonmark",
					}
				},
				srcfs: {
					backend: "local",
					config: {
						root: "./tmp/src",
					}
				},
				dstfs: {
					backend: "local",
					config: {
						root: "./tmp/dst",
					}
				},
			},
			preference: {
				siteName: "Roki Sample Site",
				copyright: "2020 Roki Authors",
			},
		};
	}
};

export default new SampleThemeLoader().serialize();
