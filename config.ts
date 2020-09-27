import { BaseConfig } from "./src/config";
import { ConfigLoader } from "./src/config/loader";

export default new class extends ConfigLoader {
	load(): BaseConfig {
		return {
			render: {
				backend: "markdown-it",
				config: {
					preset: "commonmark",
				}
			},
			srcfs: {
				backend: "github",
				config: {
					owner: "kaz",
					repo: "test",
					ref: "heads/master",
					octokitOpts: {
						auth: this.env("GITHUB_TOKEN"),
					},
				},
			},
			dstfs: {
				backend: "github",
				config: {
					owner: "kaz",
					repo: "test",
					ref: "heads/gh-pages",
					octokitOpts: {
						auth: this.env("GITHUB_TOKEN"),
					},
				},
			},
		};
	}
};
