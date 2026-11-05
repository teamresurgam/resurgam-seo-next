import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seo } from '../../../app-router/lib/seo';
import { ResurgamJSONLD } from '@resurgam/seo-next';

interface CapabilityProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CapabilityProps): Promise<Metadata> {
  return seo.generateMetadata({
    slug: params.slug,
    type: 'capability',
    url: `/capabilities/${params.slug}`,
  });
}

export default async function CapabilityPage({ params }: CapabilityProps) {
  const seoData = await seo.getMetadata({
    slug: params.slug,
    type: 'capability',
    url: `/capabilities/${params.slug}`,
  });

  if (!seoData) {
    notFound();
  }

  return (
    <>
      <ResurgamJSONLD schema={seoData.schema} id={`resurgam-capability-${params.slug}`} />
      <article className="capability-entry">
        <header>
          <span className="eyebrow">Studio Capability</span>
          <h1>{seoData.title}</h1>
          <p className="intro">{seoData.description}</p>
        </header>
        <section className="service-details">
          <h2>Engineering & Strategy</h2>
          <p>Delivered by the Resurgam cross-functional commerce team.</p>
        </section>
      </article>
    </>
  );
}

