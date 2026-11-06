import type { WordPressSchemaGraph } from '../types/wordpress';
import type { SchemaFAQPage } from './schema-types';

/**
 * Safely serializes a JSON-LD data structure into a string for injection into HTML.
 * Escapes HTML opening/closing tags and special Unicode separators to prevent XSS.
 */
export function serializeJsonLd(schema: unknown): string {
  if (!schema) {
    return '';
  }

  const rawJson =
    typeof schema === 'string'
      ? schema
      : JSON.stringify(schema, null, process.env.NODE_ENV === 'development' ? 2 : 0);

  return rawJson
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Deduplicates and normalizes schema nodes in a graph.
 * Preserves nodes with unique `@id` or `@type` signatures.
 */
export function deduplicateSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const obj = schema as Record<string, unknown>;

  if (Array.isArray(obj['@graph'])) {
    const seenIds = new Set<string>();
    const seenSignatures = new Set<string>();
    const uniqueGraph: Array<Record<string, unknown>> = [];

    for (const node of obj['@graph']) {
      if (!node || typeof node !== 'object') continue;
      const item = node as Record<string, unknown>;

      const id = typeof item['@id'] === 'string' ? item['@id'] : null;
      const type = typeof item['@type'] === 'string' ? item['@type'] : null;
      const signature = id || `${type}:${item['name'] || ''}:${item['url'] || ''}`;

      if (id && seenIds.has(id)) {
        continue;
      }
      if (signature && seenSignatures.has(signature)) {
        continue;
      }

      if (id) seenIds.add(id);
      if (signature) seenSignatures.add(signature);
      uniqueGraph.push(item);
    }

    return {
      ...obj,
      '@graph': uniqueGraph,
    };
  }

  return schema;
}

/**
 * Rewrites WordPress backend and staging URLs across a Schema graph to the public storefront siteUrl.
 * Keeps media upload URLs (images, uploads) intact.
 */
export function rewriteSchemaOrigins(
  schema: unknown,
  options: {
    siteUrl: string;
    wordpressUrl?: string;
    urlMappings?: Record<string, string>;
  }
): unknown {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const { siteUrl, wordpressUrl } = options;
  const cleanSiteBase = siteUrl.replace(/\/+$/, '');
  const cleanWpBase = (wordpressUrl || '').replace(/\/+$/, '');

  const knownBackends = [
    cleanWpBase,
    'https://api.resurgam.digital',
    'http://api.resurgam.digital',
    'https://staging.resurgam.digital',
    'http://staging.resurgam.digital',
  ].filter(Boolean);

  function rewriteString(val: string): string {
    if (!val || typeof val !== 'string') return val;

    // Check if it's a media / upload file (should remain untouched)
    const isMedia = /\.(?:png|jpe?g|webp|gif|svg|pdf|mp4|webm)(?:\?.*)?$/i.test(val) || val.includes('/wp-content/uploads/');
    if (isMedia) {
      return val;
    }

    let modified = val;
    for (const backend of knownBackends) {
      if (modified.startsWith(backend)) {
        modified = `${cleanSiteBase}${modified.slice(backend.length)}`;
      }
    }

    // Fix query permalinks in schema e.g. /?project=pet-essentials -> /case-studies/pet-essentials/
    if (modified.includes('/?project=')) {
      modified = modified.replace(/\/\?project=([a-zA-Z0-9_-]+)/, '/case-studies/$1/');
    }

    return modified;
  }

  function walk(node: any): any {
    if (Array.isArray(node)) {
      return node.map(walk);
    }
    if (node && typeof node === 'object') {
      const copy: Record<string, any> = {};
      for (const [key, val] of Object.entries(node)) {
        if (typeof val === 'string') {
          copy[key] = (key === '@id' || key === 'url' || key === 'item') ? rewriteString(val) : val;
        } else {
          copy[key] = walk(val);
        }
      }
      return copy;
    }
    return node;
  }

  return walk(schema);
}

/**
 * Creates a valid Schema.org FAQPage data structure.
 */
export function createFaqSchema(faqs: Array<{ question: string; answer: string }>): SchemaFAQPage {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

/**
 * Appends FAQ items to an existing schema or schema graph.
 */
export function appendFaqSchema(
  schema: unknown,
  faqs?: Array<{ question: string; answer: string }> | null
): unknown {
  if (!faqs || faqs.length === 0) {
    return schema;
  }

  const faqNode = createFaqSchema(faqs);

  if (!schema || typeof schema !== 'object') {
    return {
      '@context': 'https://schema.org',
      '@graph': [faqNode],
    };
  }

  const obj = schema as Record<string, any>;
  if (Array.isArray(obj['@graph'])) {
    return {
      ...obj,
      '@graph': [...obj['@graph'], faqNode],
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [obj, faqNode],
  };
}

/**
 * Formats a valid JSON-LD `<script type="application/ld+json">` HTML string.
 */
export function renderJsonLdString(
  schema: unknown,
  options?: { id?: string; nonce?: string; faqs?: Array<{ question: string; answer: string }> }
): string {
  if (!schema && !options?.faqs) return '';
  const withFaqs = options?.faqs ? appendFaqSchema(schema, options.faqs) : schema;
  const cleaned = deduplicateSchema(withFaqs);
  const serialized = serializeJsonLd(cleaned);
  if (!serialized || serialized === '{}' || serialized === '""') return '';

  const idAttr = options?.id ? ` id="${options.id}"` : '';
  const nonceAttr = options?.nonce ? ` nonce="${options.nonce}"` : '';

  return `<script type="application/ld+json"${idAttr}${nonceAttr}>${serialized}</script>`;
}

export interface ResurgamJSONLDProps {
  /**
   * The schema object or graph returned by WordPress or getSeoMetadata.
   */
  schema?: WordPressSchemaGraph | Record<string, unknown> | null;

  /**
   * Optional FAQ items to append as Schema.org FAQPage.
   */
  faqs?: Array<{ question: string; answer: string }> | null;

  /**
   * Optional custom id attribute for the script tag.
   * Default: "resurgam-jsonld"
   */
  id?: string;

  /**
   * Optional nonce for strict Content Security Policies.
   */
  nonce?: string;

  /**
   * Optional fallback options if schema is missing or empty.
   */
  fallback?: {
    title?: string;
    description?: string;
    url?: string;
    siteUrl?: string;
    siteName?: string;
  };
}

/**
 * Next.js Server Component for rendering structured JSON-LD data.
 *
 * Usage:
 * ```tsx
 * const seoData = await seo.getMetadata({ slug: 'about-us' });
 * return <ResurgamJSONLD schema={seoData?.schema} />;
 * ```
 */
export async function ResurgamJSONLD({
  schema,
  faqs,
  fallback,
  id = 'resurgam-jsonld',
  nonce,
}: ResurgamJSONLDProps): Promise<any> {
  let targetSchema = schema;

  if (!targetSchema && fallback) {
    const siteUrl = (fallback.siteUrl || 'https://resurgam.digital').replace(/\/+$/, '');
    const siteName = fallback.siteName || 'Resurgam Digital';
    const pageUrl = fallback.url || `${siteUrl}/`;
    targetSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: siteName,
          publisher: { '@id': `${siteUrl}/#organization` },
        },
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: siteName,
          url: `${siteUrl}/`,
        },
        {
          '@type': 'WebPage',
          '@id': `${pageUrl}#webpage`,
          url: pageUrl,
          name: fallback.title || siteName,
          description: fallback.description || '',
          isPartOf: { '@id': `${siteUrl}/#website` },
          breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${pageUrl}#breadcrumb`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${siteUrl}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: fallback.title || siteName,
              item: pageUrl,
            },
          ],
        },
      ],
    };
  }

  if (!targetSchema && !faqs) {
    return null;
  }

  const withFaqs = faqs ? appendFaqSchema(targetSchema, faqs) : targetSchema;
  if (!withFaqs || (typeof withFaqs === 'object' && Object.keys(withFaqs).length === 0)) {
    return null;
  }

  const cleaned = deduplicateSchema(withFaqs);
  const serialized = serializeJsonLd(cleaned);

  if (!serialized || serialized === '{}' || serialized === '""') {
    return null;
  }

  try {
    const ReactModule: any = await import('react');
    const React = ReactModule.default || ReactModule;
    if (!React || !React.createElement) return null;

    return React.createElement('script', {
      type: 'application/ld+json',
      id,
      nonce,
      dangerouslySetInnerHTML: { __html: serialized },
    });
  } catch {
    return null;
  }
}
