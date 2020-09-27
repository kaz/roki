import { BaseConfig, Config } from ".";

type Environment = { [key: string]: string | undefined; };

export abstract class ConfigLoader {
	private envSrc?: Environment;

	abstract load(): BaseConfig;

	instantiate(envSrc: Environment): Config {
		this.envSrc = envSrc;
		return new Config(this.load());
	}

	protected env(key: string): string {
		const value = this.envSrc![key];
		if (!value) {
			throw new Error(`env ${key} is undefined`);
		}
		return value;
	}
}
