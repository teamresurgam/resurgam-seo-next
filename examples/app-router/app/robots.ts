import type { MetadataRoute } from 'next';
import { seo } from '../lib/seo';

/**
 * Dynamic Next.js App Router robots.txt generation.
 */
export default function robots(): MetadataRoute.Robots {
  return seo.generateRobots({
    disallow: ['/api/', '/admin/', '/_next/', '/preview/'],
  });
}

