/**
 * @resurgam/seo-next
 *
 * Production-ready Next.js App Router integration package for Resurgam SEO WordPress plugin.
 */

// Core clients & factories
export {
  createResurgamSEO,
  ResurgamSEOClient,
  generateSEOMetadata,
} from './client/seo-client';

export {
  WordPressClient,
  WordPressAPIError,
} from './client/wordpress-client';

// Structured data & JSON-LD component
export {
  ResurgamJSONLD,
  serializeJsonLd,
  deduplicateSchema,
  rewriteSchemaOrigins,
  createFaqSchema,
  appendFaqSchema,
  renderJsonLdString,
  type ResurgamJSONLDProps,
} from './schema/json-ld';

// Metadata mappers
export { mapToNextMetadata } from './metadata/generate-seo-metadata';
export { resolveCanonicalUrl, type CanonicalOptions } from './metadata/canonical';
export { mapOpenGraph } from './metadata/open-graph';
export { mapTwitter } from './metadata/twitter';

// Sitemap & Robots
export { generateSitemap, type GenerateSitemapOptions } from './sitemap/sitemap';
export { generateRobots, type GenerateRobotsOptions } from './robots/robots';

// Cache helpers
export {
  resurgamSeoTag,
  resurgamPostTag,
  resurgamSlugTag,
  resurgamSitemapTag,
  resolveFetchCacheOptions,
  type NextFetchOptions,
} from './cache/cache';

// Configuration types
export {
  ResurgamConfigurationError,
  validateConfig,
  type ResurgamSEOConfig,
} from './types/config';

// SEO & Next.js types
export type {
  SEOQueryParams,
  FetchOptions,
  NextMetadata,
  NextSitemapEntry,
  NextRobotsConfig,
} from './types/seo';

// WordPress REST response types
export type {
  WordPressRobotsDirectives,
  WordPressSocialImage,
  WordPressOpenGraphData,
  WordPressTwitterData,
  WordPressBreadcrumb,
  WordPressSchemaGraph,
  WordPressSEOData,
  WordPressSEOResponse,
  WordPressSitemapItem,
  WordPressSitemapResponse,
  WordPressConnectionTestResponse,
} from './types/wordpress';

// Schema.org structural types
export type {
  SchemaThing,
  SchemaWebSite,
  SchemaOrganization,
  SchemaWebPage,
  SchemaArticle,
  SchemaBreadcrumbList,
  SchemaProduct,
  SchemaFAQPage,
} from './schema/schema-types';

