import type { Metadata } from 'next';
import { seo } from '../lib/seo';
import { ResurgamJSONLD } from '@resurgam/seo-next';

export async function generateMetadata(): Promise<Metadata> {
  return seo.generateMetadata({ url: '/' });
}

export default async function HomePage() {
  const pageSchema = await seo.getSchema({ url: '/' });

  return (
    <>
      <ResurgamJSONLD schema={pageSchema} id="resurgam-home-schema" />
      <section className="hero">
        <h1>High-Performance Headless Commerce</h1>
        <p>Optimized with the @resurgam/seo-next engine and WordPress headless SEO plugin.</p>
      </section>
    </>
  );
}

