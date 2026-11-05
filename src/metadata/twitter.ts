import type { WordPressSEOData } from '../types/wordpress';
import type { ResurgamSEOConfig } from '../types/config';
import type { NextMetadata } from '../types/seo';

/**
 * Maps WordPress Twitter card data to Next.js Metadata['twitter'].
 * Strictly uses actual values provided by WordPress without inventing defaults.
 */
export function mapTwitter(
  data: WordPressSEOData | null | undefined,
  _config: ResurgamSEOConfig
): NextMetadata['twitter'] {
  const tw = data?.twitter;
  const og = data?.open_graph;

  if (!tw && !og && !data?.title) {
    return undefined;
  }

  const title = tw?.title || og?.title || data?.title || undefined;
  const description = tw?.description || og?.description || data?.description || undefined;

  const images: string[] = [];
  if (tw?.image && tw.image.trim()) {
    images.push(tw.image.trim());
  } else if (og?.image?.url) {
    images.push(og.image.url);
  }

  const card = tw?.card || 'summary_large_image';

  return {
    card,
    title,
    description,
    images: images.length > 0 ? images : undefined,
    creator: tw?.creator || undefined,
    site: tw?.site || undefined,
  };
}
