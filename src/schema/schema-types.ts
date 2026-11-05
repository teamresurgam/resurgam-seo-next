/**
 * Schema.org JSON-LD structural types for Resurgam SEO.
 */

export interface SchemaThing {
  '@type': string;
  '@id'?: string;
  name?: string;
  description?: string;
  url?: string;
  [key: string]: unknown;
}

export interface SchemaWebSite extends SchemaThing {
  '@type': 'WebSite';
  name: string;
  url: string;
  inLanguage?: string;
  publisher?: {
    '@id': string;
  };
}

export interface SchemaOrganization extends SchemaThing {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: {
    '@type': 'ImageObject';
    url: string;
  };
  sameAs?: string[];
}

export interface SchemaWebPage extends SchemaThing {
  '@type': 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';
  name: string;
  description?: string;
  url: string;
  inLanguage?: string;
  isPartOf?: {
    '@id': string;
  };
  image?: string[];
}

export interface SchemaArticle extends SchemaThing {
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  author?: {
    '@type': 'Person' | 'Organization';
    name: string;
    url?: string;
  };
  publisher?: {
    '@id': string;
  };
}

export interface SchemaBreadcrumbList extends SchemaThing {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface SchemaProduct extends SchemaThing {
  '@type': 'Product';
  name: string;
  description?: string;
  image?: string[];
  sku?: string;
  offers?: {
    '@type': 'Offer';
    price: string | number;
    priceCurrency: string;
    availability: string;
    url?: string;
  };
}

export interface SchemaFAQPage extends SchemaThing {
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

