import {
  gmDeleteValue,
  gmGetValue,
  gmRegisterMenuCommand,
  gmSetValue,
} from "./gm_api";

export type FenceStyle = "backtick" | "tilde";
export type FenceMode = "md-only" | "any-fence";

export type UserConfig = {
  version: 1;
  enabled: boolean;
  selector: string;
  wrapperClass: string;
  fenceMode: FenceMode;
  allowedFenceStyles: FenceStyle[];
  convertBrToNewline: boolean;
  trimInput: boolean;
  sanitizeHtml: boolean;
  skipIfAlreadyWrapped: boolean;
  debug: boolean;
};

const CONFIG_KEY = "fenced_md_config";

const DEFAULT_CONFIG: UserConfig = {
  version: 1,
  enabled: true,
  selector: ".bookmark > .display > .description",
  wrapperClass: "md-block",
  fenceMode: "md-only",
  allowedFenceStyles: ["backtick", "tilde"],
  convertBrToNewline: true,
  trimInput: true,
  sanitizeHtml: true,
  skipIfAlreadyWrapped: true,
  debug: false,
};

function normalizeConfig(raw: Partial<UserConfig> | undefined): UserConfig {
  const candidate = raw ?? {};
  const allowedFenceStyles =
    candidate.allowedFenceStyles && candidate.allowedFenceStyles.length > 0
      ? candidate.allowedFenceStyles
      : DEFAULT_CONFIG.allowedFenceStyles;

  return {
    ...DEFAULT_CONFIG,
    ...candidate,
    version: 1,
    selector: candidate.selector?.trim() || DEFAULT_CONFIG.selector,
    wrapperClass: candidate.wrapperClass?.trim() || DEFAULT_CONFIG.wrapperClass,
    allowedFenceStyles,
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

  gmRegisterMenuCommand("Toggle BR-to-newline conversion", () => {
    const cfg = loadConfig();
    const nextValue = !cfg.convertBrToNewline;
    saveConfig({ convertBrToNewline: nextValue });
    alert(
      `BR-to-newline conversion is now ${nextValue ? "enabled" : "disabled"}. Reload page to apply.`,
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
