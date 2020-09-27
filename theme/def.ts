import { Theme } from "../src/theme";

import _body from "./_body.html";
import _head from "./_head.html";
import page from "./page.html";
import pageList from "./pageList.html";
import revision from "./revision.html";
import revisionList from "./revisionList.html";

export default {
	template: {
		partials: { _body, _head },
		templates: { page, pageList, revision, revisionList },
	},
	preference: {
		siteName: "Roki Sample Site",
		copyright: "2020 Roki Authors",
	},
} as Theme;
