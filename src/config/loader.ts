import Config, { BaseConfig } from ".";

export default abstract class ConfigLoader {
	abstract load(): BaseConfig;

	instantiate(): Config {
		return new Config(this.load());
	}

	protected env(key: string): string {
		const value = process.env[key];
		if (!value) {
			throw new Error(`env ${key} is undefined`);
		}
		return value;
	}
}
