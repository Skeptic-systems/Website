import { authEnv } from "../config/env";

type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[];
};

const hasAttribute = (cookie: string, pattern: RegExp): boolean => pattern.test(cookie);

const setOrAppendAttribute = (cookie: string, pattern: RegExp, replacement: string, appendValue: string): string => {
  if (pattern.test(cookie)) {
    return cookie.replace(pattern, replacement);
  }

  return `${cookie}; ${appendValue}`;
};

const appendFlag = (cookie: string, flag: string): string => {
  if (new RegExp(`(?:^|;)\\s*${flag}(?:;|$)`, "i").test(cookie)) {
    return cookie;
  }

  return `${cookie}; ${flag}`;
};

const normalizeCookieValue = (cookie: string, domain: string): string => {
  let updated = setOrAppendAttribute(cookie, /Domain=[^;]+/i, `Domain=${domain}`, `Domain=${domain}`);
  updated = setOrAppendAttribute(updated, /SameSite=[^;]+/i, "SameSite=None", "SameSite=None");
  updated = appendFlag(updated, "Secure");
  return updated;
};

const getSetCookieValues = (headers: Headers): string[] => {
  const extended = headers as HeadersWithGetSetCookie;

  if (typeof extended.getSetCookie === "function") {
    return extended.getSetCookie();
  }

  const rawValue = headers.get("set-cookie");

  if (!rawValue) {
    return [];
  }

  return [rawValue];
};

export const rewriteAuthCookies = (headers: Headers): void => {
  const cookieDomain = authEnv.cookieDomain;

  if (!cookieDomain) {
    return;
  }

  const cookies = getSetCookieValues(headers);

  if (cookies.length === 0) {
    return;
  }

  headers.delete("set-cookie");

  for (const cookie of cookies) {
    headers.append("Set-Cookie", normalizeCookieValue(cookie, cookieDomain));
  }
};

