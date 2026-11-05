import type { ResurgamSEOConfig } from '../types/config';
import type { FetchOptions } from '../types/seo';

export interface NextFetchOptions {
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  headers?: Record<string, string>;
}

/**
 * Builds standard cache tag for all Resurgam SEO entities.
 */
export function resurgamSeoTag(): string {
  return 'resurgam-seo';
}

/**
 * Builds entity-specific cache tag by post/object ID.
 */
export function resurgamPostTag(id: number): string {
  return `resurgam-post-${id}`;
}

/**
 * Builds entity-specific cache tag by slug.
 */
export function resurgamSlugTag(slug: string): string {
  return `resurgam-slug-${slug}`;
}

/**
 * Builds cache tag for sitemap data.
 */
export function resurgamSitemapTag(): string {
  return 'resurgam-sitemap';
}

/**
 * Resolves Next.js fetch cache options from client config and per-request overrides.
 */
export function resolveFetchCacheOptions(
  config: ResurgamSEOConfig,
  requestOptions?: FetchOptions,
  extraTags: string[] = []
): NextFetchOptions {
  const result: NextFetchOptions = {};

  // Determine revalidate
  let reval: number | false = config.defaultRevalidate ?? 3600;
  if (requestOptions?.revalidate !== undefined) {
    reval = requestOptions.revalidate;
  }

  // Determine tags
  const tagsSet = new Set<string>(config.defaultTags || ['resurgam-seo']);
  if (requestOptions?.tags) {
    for (const t of requestOptions.tags) {
      tagsSet.add(t);
    }
  }
  for (const t of extraTags) {
    tagsSet.add(t);
  }

  // Handle cache mode override
  if (requestOptions?.cache) {
    result.cache = requestOptions.cache as RequestCache;
  } else if (reval === false || reval === 0) {
    result.cache = 'no-store';
  } else {
    result.next = {
      revalidate: reval,
      tags: Array.from(tagsSet),
    };
  }

  return result;
}

