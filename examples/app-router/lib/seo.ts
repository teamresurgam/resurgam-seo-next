import { createResurgamSEO } from '@resurgam/seo-next';

if (!process.env.WORDPRESS_API_URL) {
  throw new Error('WORDPRESS_API_URL environment variable is required.');
}

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required.');
}

/**
 * Shared Resurgam SEO Client singleton for the Next.js App Router application.
 */
export const seo = createResurgamSEO({
  wordpressUrl: process.env.WORDPRESS_API_URL,
  apiUrl: process.env.RESURGAM_SEO_API_URL,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  apiKey: process.env.RESURGAM_SEO_API_KEY,
  defaultRevalidate: 3600, // Revalidate every hour via Next.js ISR
  trailingSlash: false,
});
