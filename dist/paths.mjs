// Resolve app links from this module's directory, including a Pages project path.
const moduleBase = new URL('./', import.meta.url);

export function appUrl(path = '', base = moduleBase) {
  const url = new URL(path.replace(/^\/+/, ''), base);
  return url.pathname + url.search + url.hash;
}

export function appPath(pathname, base = moduleBase) {
  const prefix = new URL(base).pathname.replace(/\/+$/, '');
  const path = pathname === prefix || pathname.startsWith(prefix + '/')
    ? pathname.slice(prefix.length)
    : pathname;
  return path.replace(/\/+$/, '') || '/';
}
