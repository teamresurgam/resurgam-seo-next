import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seo } from '../../lib/seo';
import { ResurgamJSONLD } from '@resurgam/seo-next';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const meta = await seo.generateMetadata({
    slug: params.slug,
    type: 'page',
  });

  return meta;
}

export default async function DynamicPage({ params }: PageProps) {
  // Query metadata and schema
  const seoData = await seo.getMetadata({ slug: params.slug, type: 'page' });

  if (!seoData) {
    notFound();
  }

  return (
    <>
      <ResurgamJSONLD schema={seoData.schema} id={`resurgam-${params.slug}-schema`} />
      <article className="page-content">
        <header>
          <h1>{seoData.title}</h1>
          <p className="description">{seoData.description}</p>
        </header>
        <div className="meta">
          <span>Slug: {seoData.slug}</span>
          <span>Canonical: {seoData.canonical}</span>
        </div>
      </article>
    </>
  );
}

