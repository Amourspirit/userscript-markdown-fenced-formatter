const {
  author,
  dependencies,
  repository,
  version,
} = require("../package.json");

module.exports = {
  name: {
    $: "Fenced Markdown Formatter",
    cn: "Markdown 代码块格式化",
    en: "Fenced Markdown Formatter",
  },
  namespace: "com.github.amourspirit.userscripts",
  version: version,
  author: author,
  source: repository.url,
  // 'license': 'MIT',
  match: ["*://pinboard.in/*"],
  require: [
    `https://cdn.jsdelivr.net/npm/jquery@${dependencies.jquery}/dist/jquery.min.js`,
  ],
  grant: [
    "GM.xmlHttpRequest",
    "GM_addStyle",
    "GM_getResourceText",
    "GM_registerMenuCommand",
    "GM_unregisterMenuCommand",
    "GM_setValue",
    "GM_getValue",
    "GM_listValues",
    "GM_deleteValue",
  ],
  connect: ["httpbin.org"],
  "run-at": "document-end",
};
