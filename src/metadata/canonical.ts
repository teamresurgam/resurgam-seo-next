/**
 * Canonical URL resolution and origin rewriting for Headless WordPress storefronts.
 */

export interface CanonicalOptions {
  siteUrl: string;
  trailingSlash?: boolean;
}

/**
 * Normalizes and rewrites an actual canonical URL returned by WordPress so it points to the Next.js public storefront domain.
 *
 * Example:
 *   WordPress returned: "https://cms.example.com/about-us/"
 *   Site URL: "https://www.example.com"
 *   Output: "https://www.example.com/about-us/"
 *
 * If no canonical URL is provided by WordPress, returns undefined. Never fabricates a fallback canonical.
 */
export function resolveCanonicalUrl(
  rawCanonical: string | undefined | null,
  options: CanonicalOptions
): string | undefined {
  if (!rawCanonical || !rawCanonical.trim()) {
    return undefined;
  }

  const { siteUrl, trailingSlash } = options;
  const cleanSiteBase = siteUrl.replace(/\/+$/, '');
  const trimmed = rawCanonical.trim();

  let pathAndQuery = '';
  try {
    const parsed = new URL(trimmed);
    pathAndQuery = `${parsed.pathname}${parsed.search}`;
  } catch {
    // Relative path passed
    pathAndQuery = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // Ensure leading slash
  if (!pathAndQuery.startsWith('/')) {
    pathAndQuery = `/${pathAndQuery}`;
  }

  // Handle trailing slash preference
  const [pathname, search] = pathAndQuery.split('?');
  let cleanPath = pathname || '/';
  const queryPart = search ? `?${search}` : '';

  // Skip trailing slash modification if path looks like a file (e.g. robots.txt, sitemap.xml)
  const isFile = /\.[a-zA-Z0-9]{2,5}$/.test(cleanPath);

  if (!isFile && cleanPath !== '/') {
    if (trailingSlash === true && !cleanPath.endsWith('/')) {
      cleanPath = `${cleanPath}/`;
    } else if (trailingSlash === false && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.replace(/\/+$/, '');
    }
  }

  return `${cleanSiteBase}${cleanPath}${queryPart}`;
}
