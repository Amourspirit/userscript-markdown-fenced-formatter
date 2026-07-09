import "./style/site.less";
import "./style/md.less";

import { formatMarkdown } from "./md_lib";
import { loadConfig, registerConfigMenu } from "./script_config";

function applyStyleMode(
  styleMode: ReturnType<typeof loadConfig>["useMainStyles"],
) {
  if (styleMode) {
    document.documentElement.setAttribute("data-pinboard-style", styleMode);
    return;
  }

  document.documentElement.removeAttribute("data-pinboard-style");
}

function runFormatterWhenDomReady(cfg: ReturnType<typeof loadConfig>) {
  const run = () => {
    const stats = formatMarkdown(cfg);
    if (cfg.debug) {
      console.log(
        `[fenced-md] processed=${stats.processed}, converted=${stats.converted}, skipped=${stats.skipped}`,
      );
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
    return;
  }

  run();
}

async function main() {
  console.log("script start");

  registerConfigMenu();

  const cfg = loadConfig();
  // Apply the style selector as early as possible to reduce first-paint flashing.
  applyStyleMode(cfg.useMainStyles);

  if (!cfg.enabled) {
    return;
  }

  runFormatterWhenDomReady(cfg);
}

main().catch((e) => {
  console.log(e);
});
