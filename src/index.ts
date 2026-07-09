import "./style/main.less";

import { formatMarkdown } from "./md_lib";
import { loadConfig, registerConfigMenu } from "./script_config";

async function main() {
  console.log("script start");

  registerConfigMenu();

  const cfg = loadConfig();
  if (!cfg.enabled) {
    return;
  }

  const stats = formatMarkdown(cfg);
  if (cfg.debug) {
    console.log(
      `[fenced-md] processed=${stats.processed}, converted=${stats.converted}, skipped=${stats.skipped}`,
    );
  }
}

main().catch((e) => {
  console.log(e);
});
