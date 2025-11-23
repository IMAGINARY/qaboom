import { AbstractText, Container } from "pixi.js";

const I18N_ATTR = "data-i18n";

let languages: string[] = [];
const strings: Record<string, any> = {};
let currentLang: string = "en";

export async function loadLanguages(langs: string[]) {
  languages = langs;
  for (const code of languages) {
    const response = await fetch(`/locales/${code}.json`, {
      cache: "no-cache",
    });
    strings[code] = await response.json();
  }
}

export async function switchLanguage(node: any) {
  const currentIndex = languages.findIndex((code) => getCurrentLang() === code);
  const code = languages[(currentIndex + 1) % languages.length];
  changeLanguage(code);
  refreshI18nText(node);
}

/**
 * Set a translatable element with the provided tag
 * that will be re-translated when `refreshI18Text` is called.
 */
export function setI18nKey(
  node: AbstractText,
  key: string,
  format: (t: string) => string = (t) => t
) {
  (node as any).i18nKey = key;
  (node as any).i18nFormat = format;
  translate(node);
}

// export function createI18nText(tag: string, key: string) {
//   const el = document.createElement(tag);
//   el.textContent = translate(key);
//   el.setAttribute(I18N_ATTR, key);
//   return el;
// }

/**
 * Retranslate all translateable text in the current language.
 */
export function refreshI18nText(node: any) {
  if (node instanceof Container) {
    for (let child of node.children) {
      refreshI18nText(child);
    }
  }
  if (node instanceof AbstractText) {
    translate(node);
  }
  // for (const el of document.querySelectorAll(`[${I18N_ATTR}]`)) {
  //   const key = el.getAttribute(I18N_ATTR) ?? "";
  //   el.textContent = translate(key);
  // }
}

export function getCurrentLang() {
  return currentLang;
}

export function changeLanguage(newLang: string) {
  if (!Object.keys(strings).includes(newLang)) {
    throw new Error(`Unknown code: ${newLang}`);
  }
  currentLang = newLang;
}

export function setFormat(node: AbstractText, format: (t: string) => string) {
  (node as any).i18nFormat = format;
  translate(node);
}

function translate(node: AbstractText) {
  const key = (node as any).i18nKey;
  if (!key) {
    return;
  }
  const format = (node as any).i18nFormat;
  node.text = format(getNestedKey(strings[currentLang], key.split(".")));
}

function getNestedKey(object: Record<string, any>, path: string[]) {
  const [head, ...tail] = path;
  const value = object[head];
  if (tail.length === 0) {
    return value;
  }
  if (value == null) {
    return undefined;
  }
  return getNestedKey(value, tail);
}
