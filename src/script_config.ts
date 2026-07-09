import {
  gmDeleteValue,
  gmGetValue,
  gmRegisterMenuCommand,
  gmSetValue,
} from "./gm_api";

export type FenceStyle = "backtick" | "tilde";
export type FenceMode = "md-only" | "any-fence";
export type StyleMode = "dark" | "lite" | "";
export type MdBlockInitialView = "expanded" | "collapsed";

export type UserConfig = {
  version: 1;
  enabled: boolean;
  useMainStyles: StyleMode;
  selector: string;
  wrapperClass: string;
  fenceMode: FenceMode;
  allowedFenceStyles: FenceStyle[];
  trimInput: boolean;
  sanitizeHtml: boolean;
  skipIfAlreadyWrapped: boolean;
  initialMdBlockView: MdBlockInitialView;
  debug: boolean;
};

const CONFIG_KEY = "fenced_md_config";

const DEFAULT_CONFIG: UserConfig = {
  version: 1,
  enabled: true,
  useMainStyles: "lite",
  selector: ".bookmark > .display > .description",
  wrapperClass: "md-block",
  fenceMode: "md-only",
  allowedFenceStyles: ["backtick", "tilde"],
  trimInput: true,
  sanitizeHtml: true,
  skipIfAlreadyWrapped: true,
  initialMdBlockView: "expanded",
  debug: false,
};

function normalizeConfig(raw: Partial<UserConfig> | undefined): UserConfig {
  const candidate = raw ?? {};
  let normalizedStyleMode: StyleMode = DEFAULT_CONFIG.useMainStyles;
  if (
    candidate.useMainStyles === "dark" ||
    candidate.useMainStyles === "lite" ||
    candidate.useMainStyles === ""
  ) {
    normalizedStyleMode = candidate.useMainStyles;
  } else if (typeof candidate.useMainStyles === "boolean") {
    // Backward compatibility with previous boolean config.
    normalizedStyleMode = candidate.useMainStyles ? "lite" : "";
  }
  const allowedFenceStyles =
    candidate.allowedFenceStyles && candidate.allowedFenceStyles.length > 0
      ? candidate.allowedFenceStyles
      : DEFAULT_CONFIG.allowedFenceStyles;
  const initialMdBlockView: MdBlockInitialView =
    candidate.initialMdBlockView === "collapsed" ? "collapsed" : "expanded";

  return {
    ...DEFAULT_CONFIG,
    ...candidate,
    version: 1,
    useMainStyles: normalizedStyleMode,
    selector: candidate.selector?.trim() || DEFAULT_CONFIG.selector,
    wrapperClass: candidate.wrapperClass?.trim() || DEFAULT_CONFIG.wrapperClass,
    allowedFenceStyles,
    initialMdBlockView,
  };
}

function loadConfig(): UserConfig {
  const saved = gmGetValue<Partial<UserConfig>>(CONFIG_KEY, {});
  return normalizeConfig(saved);
}

function saveConfig(patch: Partial<UserConfig>): UserConfig {
  const next = normalizeConfig({ ...loadConfig(), ...patch });
  gmSetValue(CONFIG_KEY, next);
  return next;
}

function registerConfigMenu(): void {
  gmRegisterMenuCommand("Toggle formatter", () => {
    const cfg = loadConfig();
    saveConfig({ enabled: !cfg.enabled });
    alert("Formatter toggled. Reload page to apply.");
  });

  gmRegisterMenuCommand("Set description selector", () => {
    const cfg = loadConfig();
    const value = prompt("CSS selector:", cfg.selector);
    if (value && value.trim()) {
      saveConfig({ selector: value.trim() });
      alert("Selector saved. Reload page to apply.");
    }
  });

  gmRegisterMenuCommand("Cycle style mode (dark/lite/off)", () => {
    const cfg = loadConfig();
    const nextValue: StyleMode =
      cfg.useMainStyles === "dark"
        ? "lite"
        : cfg.useMainStyles === "lite"
          ? ""
          : "dark";
    saveConfig({ useMainStyles: nextValue });
    alert(`Style mode is now '${nextValue || "off"}'. Reload page to apply.`);
  });

  gmRegisterMenuCommand("Set style mode", () => {
    const cfg = loadConfig();
    const value = prompt(
      "Style mode (dark, lite, off):",
      cfg.useMainStyles || "off",
    );
    if (value === null) {
      return;
    }

    const normalized = value.trim().toLowerCase();
    let nextValue: StyleMode;
    if (normalized === "dark") {
      nextValue = "dark";
    } else if (normalized === "lite") {
      nextValue = "lite";
    } else if (normalized === "off" || normalized === "") {
      nextValue = "";
    } else {
      alert("Invalid style mode. Use: dark, lite, or off.");
      return;
    }

    saveConfig({ useMainStyles: nextValue });
    alert(`Style mode is now '${nextValue || "off"}'. Reload page to apply.`);
  });

  gmRegisterMenuCommand("Set wrapper class", () => {
    const cfg = loadConfig();
    const value = prompt("Wrapper class:", cfg.wrapperClass);
    if (value && value.trim()) {
      saveConfig({ wrapperClass: value.trim() });
      alert("Wrapper class saved. Reload page to apply.");
    }
  });

  gmRegisterMenuCommand("Toggle fence mode (md-only/any-fence)", () => {
    const cfg = loadConfig();
    const nextMode: FenceMode =
      cfg.fenceMode === "md-only" ? "any-fence" : "md-only";
    saveConfig({ fenceMode: nextMode });
    alert(`Fence mode is now: ${nextMode}. Reload page to apply.`);
  });

  gmRegisterMenuCommand("Toggle HTML sanitization", () => {
    const cfg = loadConfig();
    const nextValue = !cfg.sanitizeHtml;
    saveConfig({ sanitizeHtml: nextValue });
    alert(
      `HTML sanitization is now ${nextValue ? "enabled" : "disabled"}. Reload page to apply.`,
    );
  });

  gmRegisterMenuCommand("Toggle skip already wrapped", () => {
    const cfg = loadConfig();
    const nextValue = !cfg.skipIfAlreadyWrapped;
    saveConfig({ skipIfAlreadyWrapped: nextValue });
    alert(
      `Skip already wrapped is now ${nextValue ? "enabled" : "disabled"}. Reload page to apply.`,
    );
  });

  gmRegisterMenuCommand("Toggle trim input", () => {
    const cfg = loadConfig();
    const nextValue = !cfg.trimInput;
    saveConfig({ trimInput: nextValue });
    alert(
      `Trim input is now ${nextValue ? "enabled" : "disabled"}. Reload page to apply.`,
    );
  });

  gmRegisterMenuCommand("Toggle initial markdown view", () => {
    const cfg = loadConfig();
    const nextValue: MdBlockInitialView =
      cfg.initialMdBlockView === "expanded" ? "collapsed" : "expanded";
    saveConfig({ initialMdBlockView: nextValue });
    alert(`Initial markdown view is now '${nextValue}'. Reload page to apply.`);
  });

  gmRegisterMenuCommand("Set initial markdown view", () => {
    const cfg = loadConfig();
    const value = prompt(
      "Initial markdown view (expanded/collapsed):",
      cfg.initialMdBlockView,
    );
    if (value === null) {
      return;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized !== "expanded" && normalized !== "collapsed") {
      alert("Invalid value. Use: expanded or collapsed.");
      return;
    }

    saveConfig({ initialMdBlockView: normalized as MdBlockInitialView });
    alert(
      `Initial markdown view is now '${normalized}'. Reload page to apply.`,
    );
  });

  gmRegisterMenuCommand("Toggle debug logs", () => {
    const cfg = loadConfig();
    saveConfig({ debug: !cfg.debug });
    alert("Debug setting updated.");
  });

  gmRegisterMenuCommand("Reset settings", () => {
    gmDeleteValue(CONFIG_KEY);
    alert("Settings reset to defaults. Reload page.");
  });
}

export {
  CONFIG_KEY,
  DEFAULT_CONFIG,
  loadConfig,
  normalizeConfig,
  registerConfigMenu,
  saveConfig,
};
