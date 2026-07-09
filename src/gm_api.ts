const DEV_STORE_PREFIX = "__userscript_dev__";

type MenuCallback = () => void;

function getDevStoreKey(key: string): string {
  return `${DEV_STORE_PREFIX}${key}`;
}

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function gmGetValue<T>(key: string, defaultValue: T): T {
  if (typeof GM_getValue === "function") {
    return GM_getValue<T>(key, defaultValue);
  }

  if (!hasLocalStorage()) {
    return defaultValue;
  }

  const raw = localStorage.getItem(getDevStoreKey(key));
  if (!raw) {
    return defaultValue;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function gmSetValue<T>(key: string, value: T): void {
  if (typeof GM_setValue === "function") {
    GM_setValue(key, value);
    return;
  }

  if (!hasLocalStorage()) {
    return;
  }

  localStorage.setItem(getDevStoreKey(key), JSON.stringify(value));
}

export function gmDeleteValue(key: string): void {
  if (typeof GM_deleteValue === "function") {
    GM_deleteValue(key);
    return;
  }

  if (!hasLocalStorage()) {
    return;
  }

  localStorage.removeItem(getDevStoreKey(key));
}

export function gmRegisterMenuCommand(
  name: string,
  callback: MenuCallback,
): void {
  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand(name, callback);
  }
}
