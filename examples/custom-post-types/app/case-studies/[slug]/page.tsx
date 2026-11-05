import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seo } from '../../../app-router/lib/seo';
import { ResurgamJSONLD } from '@resurgam/seo-next';

interface CaseStudyProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CaseStudyProps): Promise<Metadata> {
  return seo.generateMetadata({
    slug: params.slug,
    type: 'case_study',
    url: `/case-studies/${params.slug}`,
  });
}

export default async function CaseStudyPage({ params }: CaseStudyProps) {
  const seoData = await seo.getMetadata({
    slug: params.slug,
    type: 'case_study',
    url: `/case-studies/${params.slug}`,
  });

  if (!seoData) {
    notFound();
  }

  return (
    <>
      <ResurgamJSONLD schema={seoData.schema} id={`resurgam-case-study-${params.slug}`} />
      <article className="case-study-entry">
        <header>
          <span className="eyebrow">Case Study</span>
          <h1>{seoData.title}</h1>
          <p className="intro">{seoData.description}</p>
        </header>
        <section className="results-summary">
          <h2>Impact & Performance</h2>
          <p>Read the complete architectural and conversion analysis.</p>
        </section>
      </article>
    </>
  );
}

