import type { WordPressSEOData } from '../types/wordpress';
import type { ResurgamSEOConfig } from '../types/config';
import type { NextMetadata, SEOQueryParams } from '../types/seo';
import { resolveCanonicalUrl } from './canonical';
import { mapOpenGraph } from './open-graph';
import { mapTwitter } from './twitter';

/**
 * Maps actual normalized WordPress SEO data into a Next.js App Router Metadata object.
 *
 * Strictly reflects the metadata returned by the Resurgam SEO WordPress API.
 * Never fabricates or substitutes fallback values when data is omitted.
 */
export function mapToNextMetadata(
  data: WordPressSEOData | null | undefined,
  config: ResurgamSEOConfig,
  query?: SEOQueryParams
): NextMetadata {
  if (!data) {
    return {};
  }

  // Title & description (only if provided by WordPress)
  const title = data.title && data.title.trim() ? data.title.trim() : undefined;
  const description = data.description && data.description.trim() ? data.description.trim() : undefined;

  // Canonical URL (only if provided by WordPress)
  const canonicalUrl = resolveCanonicalUrl(data.canonical || data.canonical_url, {
    siteUrl: config.siteUrl,
    trailingSlash: config.trailingSlash,
    type: data.content_type,
    slug: data.slug || query?.slug,
    preferredPath: query?.path || query?.url,
    urlMappings: config.urlMappings,
  });

  // Robots directives (only if provided by WordPress)
  let robots: NextMetadata['robots'] | undefined;
  if (data.robots) {
    const wpRobots = data.robots;
    robots = {
      index: wpRobots.index,
      follow: wpRobots.follow,
      nocache: wpRobots.noarchive ?? false,
      googleBot: {
        index: wpRobots.index,
        follow: wpRobots.follow,
        noimageindex: wpRobots.nosnippet ?? false,
        'max-video-preview': wpRobots.max_video_preview ?? -1,
        'max-image-preview': wpRobots.max_image_preview ?? 'large',
        'max-snippet': wpRobots.max_snippet ?? -1,
      },
    };
  }

  // Open Graph and Twitter
  const openGraph = mapOpenGraph(data, config, query);
  const twitter = mapTwitter(data, config);

  // Metadata base URL
  let metadataBase: URL | undefined;
  try {
    metadataBase = new URL(config.siteUrl);
  } catch {
    metadataBase = undefined;
  }

  const metadata: NextMetadata = {
    metadataBase,
    title,
    description,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    robots,
    openGraph,
    twitter,
  };

  return metadata;
}
