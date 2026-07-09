import "./style/main.less";

import { formatMarkdown } from "./md_lib";

async function main() {
  console.log("script start");

  const stats = formatMarkdown();
  console.log(
    `[fenced-md] processed=${stats.processed}, converted=${stats.converted}, skipped=${stats.skipped}`,
  );
}

main().catch((e) => {
  console.log(e);
});
