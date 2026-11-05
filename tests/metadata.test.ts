import { describe, it, expect } from 'vitest';
import { mapToNextMetadata } from '../src/metadata/generate-seo-metadata';
import { mapOpenGraph } from '../src/metadata/open-graph';
import { mapTwitter } from '../src/metadata/twitter';
import type { WordPressSEOData } from '../src/types/wordpress';
import type { ResurgamSEOConfig } from '../src/types/config';

const mockConfig: ResurgamSEOConfig = {
  wordpressUrl: 'https://cms.example.com',
  apiUrl: 'https://cms.example.com/wp-json/resurgam-seo/v1',
  siteUrl: 'https://www.example.com',
  trailingSlash: false,
};

const mockWpData: WordPressSEOData = {
  object_id: 112859,
  content_type: 'page',
  slug: 'about-us',
  status: 'publish',
  canonical_url: 'https://cms.example.com/about-us/',
  title: 'About Us – Resurgam Technologies',
  description: 'Learn more about the Resurgam commerce team.',
  canonical: 'https://cms.example.com/about-us/',
  robots: {
    index: true,
    follow: true,
    max_snippet: -1,
    max_image_preview: 'large',
    max_video_preview: -1,
    noarchive: false,
    nosnippet: false,
  },
  open_graph: {
    title: 'About Us – Resurgam Technologies',
    description: 'Learn more about the Resurgam commerce team.',
    url: 'https://cms.example.com/about-us/',
    type: 'website',
    site_name: 'Resurgam Technologies',
    locale: 'en_US',
    image: {
      url: 'https://cms.example.com/uploads/about-hero.jpg',
      width: 1200,
      height: 630,
      alt: 'About Resurgam',
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us – Resurgam Technologies',
    description: 'Learn more about the Resurgam commerce team.',
    image: 'https://cms.example.com/uploads/about-hero.jpg',
  },
  schema: {
    '@context': 'https://schema.org',
    '@graph': [],
  },
  breadcrumbs: [],
  timestamps: {
    published_at: '2026-09-30T21:19:36+05:30',
    modified_at: '2026-10-20T13:27:05+05:30',
  },
  preview: {
    is_preview: false,
    status: 'publish',
  },
};

describe('Metadata Mapping', () => {
  it('maps WordPress SEO data to Next.js Metadata', () => {
    const meta = mapToNextMetadata(mockWpData, mockConfig);

    expect(meta.title).toBe('About Us – Resurgam Technologies');
    expect(meta.description).toBe('Learn more about the Resurgam commerce team.');
    expect(meta.alternates?.canonical).toBe('https://www.example.com/about-us');
    expect(meta.robots?.index).toBe(true);
    expect(meta.robots?.follow).toBe(true);
    expect(meta.metadataBase?.toString()).toBe('https://www.example.com/');
  });

  it('never invents fallback title or description when data is missing or null', () => {
    const meta = mapToNextMetadata(null, mockConfig);

    expect(meta.title).toBeUndefined();
    expect(meta.description).toBeUndefined();
    expect(meta.alternates).toBeUndefined();
    expect(meta.openGraph).toBeUndefined();
    expect(meta.twitter).toBeUndefined();
  });

  it('correctly maps Open Graph parameters from actual WordPress data', () => {
    const og = mapOpenGraph(mockWpData, mockConfig);

    expect(og?.title).toBe('About Us – Resurgam Technologies');
    expect(og?.url).toBe('https://www.example.com/about-us');
    expect(og?.locale).toBe('en-US');
    expect(og?.images?.[0]?.url).toBe('https://cms.example.com/uploads/about-hero.jpg');
    expect(og?.images?.[0]?.width).toBe(1200);
    expect(og?.images?.[0]?.height).toBe(630);
  });

  it('returns undefined for Open Graph when no open_graph object is provided', () => {
    const dataWithoutOg: WordPressSEOData = {
      ...mockWpData,
      open_graph: undefined as any,
    };

    const og = mapOpenGraph(dataWithoutOg, mockConfig);
    expect(og).toBeUndefined();
  });

  it('correctly maps Twitter card parameters from actual WordPress data', () => {
    const tw = mapTwitter(mockWpData, mockConfig);

    expect(tw?.card).toBe('summary_large_image');
    expect(tw?.title).toBe('About Us – Resurgam Technologies');
    expect(tw?.images?.[0]).toBe('https://cms.example.com/uploads/about-hero.jpg');
  });

  it('correctly reflects noindex when set in WordPress', () => {
    const noindexData: WordPressSEOData = {
      ...mockWpData,
      robots: {
        ...mockWpData.robots,
        index: false,
        follow: false,
      },
    };

    const meta = mapToNextMetadata(noindexData, mockConfig);
    expect(meta.robots?.index).toBe(false);
    expect(meta.robots?.follow).toBe(false);
  });
});
