/**
 * Type definitions matching the Resurgam SEO WordPress REST API response schemas.
 *
 * Sourced directly from wp-content/plugins/resurgam-seo/includes/class-headless-rest.php
 */

export interface WordPressRobotsDirectives {
  index: boolean;
  follow: boolean;
  max_snippet?: number;
  max_image_preview?: 'none' | 'standard' | 'large';
  max_video_preview?: number;
  noarchive?: boolean;
  nosnippet?: boolean;
}

export interface WordPressSocialImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface WordPressOpenGraphData {
  title: string;
  description: string;
  url: string;
  type: string; // 'website' | 'article' | 'product' | string
  site_name: string;
  locale: string; // e.g. 'en_US'
  image?: WordPressSocialImage | null;
}

export interface WordPressTwitterData {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  title: string;
  description: string;
  image: string;
  creator?: string;
  site?: string;
}

export interface WordPressBreadcrumb {
  name: string;
  url: string;
}

export interface WordPressSchemaGraph {
  '@context': 'https://schema.org' | string;
  '@graph': Array<Record<string, unknown>>;
}

export interface WordPressSEOData {
  object_id: number;
  content_type: string;
  slug: string;
  status: string;
  canonical_url: string;
  title: string;
  description: string;
  canonical: string;
  robots: WordPressRobotsDirectives;
  open_graph: WordPressOpenGraphData;
  twitter: WordPressTwitterData;
  schema: WordPressSchemaGraph | Record<string, unknown>;
  breadcrumbs: WordPressBreadcrumb[];
  timestamps: {
    published_at: string;
    modified_at: string;
  };
  preview: {
    is_preview: boolean;
    status: string;
  };
  focus_keyword?: string;
}

export interface WordPressSEOResponse {
  success: boolean;
  data: WordPressSEOData;
}

export interface WordPressSitemapItem {
  id: number;
  type: string;
  slug: string;
  url: string;
  modified_at: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

export interface WordPressSitemapResponse {
  success: boolean;
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  items: WordPressSitemapItem[];
}

export interface WordPressConnectionTestResponse {
  success: boolean;
  data?: {
    connected: boolean;
    status: string;
    version?: string;
    error?: string;
  };
  error?: string;
}

