/**
 * Configuration types and validation for @resurgam/seo-next.
 */

export class ResurgamConfigurationError extends Error {
  constructor(message: string) {
    super(`[@resurgam/seo-next] Configuration Error: ${message}`);
    this.name = 'ResurgamConfigurationError';
  }
}

export interface ResurgamSEOConfig {
  /**
   * Root WordPress URL (e.g. "https://cms.example.com").
   */
  wordpressUrl: string;

  /**
   * Optional custom Resurgam SEO REST API endpoint override.
   * Defaults to `${wordpressUrl}/wp-json/resurgam-seo/v1`.
   */
  apiUrl?: string;

  /**
   * Public frontend Next.js site URL (e.g. "https://www.example.com").
   * Used as metadataBase and to rewrite canonical links to the headless storefront.
   */
  siteUrl: string;

  /**
   * Optional API key or bearer token for accessing protected/draft content.
   * Sent in X-Resurgam-Api-Key and Authorization headers.
   */
  apiKey?: string;

  /**
   * Optional preview token secret for draft previews.
   */
  previewSecret?: string;

  /**
   * Network timeout in milliseconds. Default: 8000ms.
   */
  timeoutMs?: number;

  /**
   * Default revalidation interval in seconds for Next.js fetch cache.
   * Set to `false` to disable caching (`cache: 'no-store'`).
   * Default: 3600 (1 hour).
   */
  defaultRevalidate?: number | false;

  /**
   * Default Next.js cache tags added to metadata fetch requests.
   * Default: ['resurgam-seo']
   */
  defaultTags?: string[];

  /**
   * Enforce trailing slash behavior on generated canonical URLs.
   * - true: always ensure trailing slash ('/about-us/')
   * - false: strip trailing slash ('/about-us')
   * - undefined: preserve as returned from WordPress
   */
  trailingSlash?: boolean;

  /**
   * Custom request headers to pass along with fetch requests.
   */
  headers?: Record<string, string>;
}

/**
 * Validates and normalizes the configuration object.
 * Throws ResurgamConfigurationError with descriptive feedback if requirements are not met.
 */
export function validateConfig(config: unknown): ResurgamSEOConfig {
  if (!config || typeof config !== 'object') {
    throw new ResurgamConfigurationError('Configuration object must be provided.');
  }

  const raw = config as Partial<ResurgamSEOConfig>;

  if (!raw.wordpressUrl || typeof raw.wordpressUrl !== 'string' || !raw.wordpressUrl.trim()) {
    throw new ResurgamConfigurationError(
      'Missing or invalid "wordpressUrl". Please provide a valid WordPress root URL (e.g. "https://cms.example.com").'
    );
  }

  if (!raw.siteUrl || typeof raw.siteUrl !== 'string' || !raw.siteUrl.trim()) {
    throw new ResurgamConfigurationError(
      'Missing or invalid "siteUrl". Please provide the public frontend site URL (e.g. "https://www.example.com").'
    );
  }

  const cleanWpUrl = raw.wordpressUrl.trim().replace(/\/+$/, '');
  const cleanSiteUrl = raw.siteUrl.trim().replace(/\/+$/, '');

  let cleanApiUrl = raw.apiUrl ? raw.apiUrl.trim().replace(/\/+$/, '') : `${cleanWpUrl}/wp-json/resurgam-seo/v1`;

  // Basic URL validation
  try {
    new URL(cleanWpUrl);
  } catch {
    throw new ResurgamConfigurationError(`"wordpressUrl" is not a valid absolute URL: "${raw.wordpressUrl}"`);
  }

  try {
    new URL(cleanSiteUrl);
  } catch {
    throw new ResurgamConfigurationError(`"siteUrl" is not a valid absolute URL: "${raw.siteUrl}"`);
  }

  try {
    new URL(cleanApiUrl);
  } catch {
    throw new ResurgamConfigurationError(`"apiUrl" is not a valid absolute URL: "${cleanApiUrl}"`);
  }

  return {
    wordpressUrl: cleanWpUrl,
    apiUrl: cleanApiUrl,
    siteUrl: cleanSiteUrl,
    apiKey: raw.apiKey?.trim(),
    previewSecret: raw.previewSecret?.trim(),
    timeoutMs: typeof raw.timeoutMs === 'number' && raw.timeoutMs > 0 ? raw.timeoutMs : 8000,
    defaultRevalidate: raw.defaultRevalidate === false ? false : typeof raw.defaultRevalidate === 'number' ? raw.defaultRevalidate : 3600,
    defaultTags: Array.isArray(raw.defaultTags) ? raw.defaultTags : ['resurgam-seo'],
    trailingSlash: typeof raw.trailingSlash === 'boolean' ? raw.trailingSlash : undefined,
    headers: raw.headers || {},
  };
}
