import { DOKKA_BASE_URL, DOKKA_PUBLISHED_VERSION } from "./site-config";

/**
 * Dokka's HTML page-name convention (verified against the live, published
 * site at dev-pasaka.github.io/kandra/v0.4.3/ on 2026-07-22): a class or
 * annotation named `PartitionKey` gets a page at `-partition-key/index.html`
 * — kebab-case the identifier, lowercase it, and prefix with a leading dash.
 */
function dokkaSlug(identifier: string): string {
  const kebab = identifier
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
  return `-${kebab}`;
}

export function dokkaModuleUrl(module: string): string {
  return `${DOKKA_BASE_URL}/v${DOKKA_PUBLISHED_VERSION}/${module}/index.html`;
}

export function dokkaPackageUrl(module: string, pkg: string): string {
  return `${DOKKA_BASE_URL}/v${DOKKA_PUBLISHED_VERSION}/${module}/${pkg}/index.html`;
}

export function dokkaClassUrl(module: string, pkg: string, className: string): string {
  return `${DOKKA_BASE_URL}/v${DOKKA_PUBLISHED_VERSION}/${module}/${pkg}/${dokkaSlug(className)}/index.html`;
}
