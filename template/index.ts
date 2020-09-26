import { Theme } from "../src/theme";
import ThemeLoader from "../src/theme/loader";

class SampleThemeLoader extends ThemeLoader {
	async load(): Promise<Theme> {
		return {
			template: await this.readTemplateFromFiles("./template"),
			preference: {
				siteName: "Roki Sample Site",
				copyright: "2020 Roki Authors",
			},
		};
	}
};

export default new SampleThemeLoader().serialize();
