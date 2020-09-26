import { BaseConfig } from "./src/config";
import ConfigLoader from "./src/config/loader";

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
				backend: "local",
				config: {
					root: this.env("SRC_DIR"),
				}
			},
			dstfs: {
				backend: "local",
				config: {
					root: this.env("DST_DIR"),
				}
			},
		};
	}
};
