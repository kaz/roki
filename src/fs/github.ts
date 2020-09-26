import { Octokit } from "@octokit/rest";
import { OctokitOptions } from "@octokit/core/dist-types/types";
import { GitGetTreeResponseData } from "@octokit/types/dist-types/generated/Endpoints";

import { Entry, Filesystem } from ".";

export type Config = {
	owner: string;
	repo: string;
	ref: string;
	octokitOpts: OctokitOptions;
};

type TreeNode = {
	parent: string;
	sha: string;
	tree: GitGetTreeResponseData["tree"];
};

export class GithubFilesystem implements Filesystem {
	private octokit: Octokit;
	private config: Config;
	private base?: string;

	private trees: { [key: string]: TreeNode; } = {};
	private blobs: { [key: string]: Buffer; } = {};

	private tx: { path: string; content?: Buffer; }[] = [];

	private constructor(config: Config) {
		this.octokit = new Octokit(config.octokitOpts);
		this.config = config;
	}

	static async init(config: Config): Promise<GithubFilesystem> {
		const ghfs = new GithubFilesystem(config);

		const { data: { object: { sha } } } = await ghfs.octokit.git.getRef({
			headers: {
				"If-None-Match": "",
			},
			owner: config.owner,
			repo: config.repo,
			ref: config.ref,
		});

		ghfs.base = sha;
		ghfs.trees["root"] = await ghfs.getTree("root", sha);

		return ghfs;
	}

	private async getTree(parent: string, sha: string): Promise<TreeNode> {
		if (!(sha in this.trees)) {
			const { data } = await this.octokit.git.getTree({
				owner: this.config.owner,
				repo: this.config.repo,
				tree_sha: sha,
			});

			if (data.truncated) {
				throw new Error("tree was truncated!");
			}

			this.trees[sha] = {
				parent,
				sha: data.sha,
				tree: data.tree,
			};
		}

		return this.trees[sha];
	}
	private async getBlob(sha: string): Promise<Buffer> {
		if (!(sha in this.blobs)) {
			const { data: { content, encoding } } = await this.octokit.git.getBlob({
				owner: this.config.owner,
				repo: this.config.repo,
				file_sha: sha,
			});

			if (encoding != "base64" && encoding != "utf-8") {
				throw new Error(`unexpected encoding ${encoding}`);
			}
			this.blobs[sha] = Buffer.from(content, encoding);
		}

		return this.blobs[sha];
	}

	private async _find(tnode: TreeNode, path: string[]): Promise<TreeNode> {
		if (path.length == 0) {
			return tnode;
		}

		const [cur, ...rem] = path;
		for (const elm of tnode.tree) {
			if (elm.path == cur) {
				if (elm.type != "tree") {
					throw new Error(`${cur} is ${elm.type}, expected tree`);
				}
				return this._find(await this.getTree(tnode.sha, elm.sha), rem);
			}
		}

		throw new Error(`not found: ${cur}`);
	}
	private async find(path: string): Promise<TreeNode> {
		return this._find(await this.getTree("", "root"), path.split("/"));
	}

	async list(path: string): Promise<Entry[]> {
		const { tree } = await this.find(path);
		return tree
			.filter(({ type }) => type == "blob" || type == "tree")
			.map(({ type, path }) => {
				const pathElms = path.split("/");
				return {
					name: pathElms.pop()!,
					directory: type == "tree",
				};
			});
	}
	async readFile(path: string): Promise<Buffer> {
		const pathElms = path.split("/");
		const fileName = pathElms.pop();
		const { tree } = await this.find(pathElms.join("/"));
		for (const elm of tree) {
			if (elm.path == fileName) {
				return this.getBlob(elm.sha);
			}
		}
		throw new Error(`not found: ${fileName}`);
	}
	async writeFile(path: string, content?: Buffer) {
		this.tx.push({ path, content });
	}

	async commit(message: string, bare: Boolean = false) {
		if (!this.tx.length) {
			return;
		}

		const { data: { sha: tree } } = await this.octokit.git.createTree({
			owner: this.config.owner,
			repo: this.config.repo,
			base_tree: bare ? undefined : this.base,
			tree: await Promise.all(this.tx.map(async ({ path, content }) => {
				const ret = { path, sha: null as string | null, mode: "100644" as "100644" };
				if (content) {
					const { data: { sha } } = await this.octokit.git.createBlob({
						owner: this.config.owner,
						repo: this.config.repo,
						encoding: "base64",
						content: content.toString("base64"),
					});
					ret.sha = sha;
				}
				return ret;
			})),
		});
		const { data: { sha } } = await this.octokit.git.createCommit({
			owner: this.config.owner,
			repo: this.config.repo,
			tree,
			parents: [this.base!],
			message,
		});
		await this.octokit.git.updateRef({
			owner: this.config.owner,
			repo: this.config.repo,
			ref: this.config.ref,
			sha,
		});
	}
}
