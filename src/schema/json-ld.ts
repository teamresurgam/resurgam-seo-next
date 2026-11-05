import type { WordPressSchemaGraph } from '../types/wordpress';

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
 * Formats a valid JSON-LD `<script type="application/ld+json">` HTML string.
 */
export function renderJsonLdString(
  schema: unknown,
  options?: { id?: string; nonce?: string }
): string {
  if (!schema) return '';
  const cleaned = deduplicateSchema(schema);
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
   * Optional custom id attribute for the script tag.
   * Default: "resurgam-jsonld"
   */
  id?: string;

  /**
   * Optional nonce for strict Content Security Policies.
   */
  nonce?: string;
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
  id = 'resurgam-jsonld',
  nonce,
}: ResurgamJSONLDProps): Promise<any> {
  if (!schema) {
    return null;
  }

  if (typeof schema === 'object' && Object.keys(schema).length === 0) {
    return null;
  }

  const cleaned = deduplicateSchema(schema);
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
