import type { WordPressSEOData } from '../types/wordpress';
import type { ResurgamSEOConfig } from '../types/config';
import type { NextMetadata, SEOQueryParams } from '../types/seo';
import { resolveCanonicalUrl } from './canonical';

/**
 * Maps WordPress Open Graph data to Next.js Metadata['openGraph'].
 * Strictly uses actual values provided by WordPress without inventing defaults.
 */
export function mapOpenGraph(
  data: WordPressSEOData | null | undefined,
  config: ResurgamSEOConfig,
  query?: SEOQueryParams
): NextMetadata['openGraph'] {
  const og = data?.open_graph;
  if (!og) {
    return undefined;
  }

  const title = og.title || data?.title || undefined;
  const description = og.description || data?.description || undefined;
  const canonicalUrl = resolveCanonicalUrl(og.url || data?.canonical || data?.canonical_url, {
    siteUrl: config.siteUrl,
    trailingSlash: config.trailingSlash,
    type: data?.content_type,
    slug: data?.slug || query?.slug,
    preferredPath: query?.path || query?.url,
    urlMappings: config.urlMappings,
  });

  const images: NonNullable<NextMetadata['openGraph']>['images'] = [];
  if (og.image && og.image.url) {
    images.push({
      url: og.image.url,
      width: og.image.width,
      height: og.image.height,
      alt: og.image.alt,
    });
  }

  const rawType = og.type || (data?.content_type === 'post' ? 'article' : 'website');
  const type = rawType === 'article' ? 'article' : 'website';

  const baseOg: NonNullable<NextMetadata['openGraph']> = {
    title,
    description,
    url: canonicalUrl,
    siteName: og.site_name || undefined,
    locale: og.locale ? og.locale.replace('_', '-') : undefined,
    type,
    images: images.length > 0 ? images : undefined,
  };

  if (type === 'article' && data?.timestamps) {
    baseOg.publishedTime = data.timestamps.published_at || undefined;
    baseOg.modifiedTime = data.timestamps.modified_at || undefined;
  }

  return baseOg;
}
