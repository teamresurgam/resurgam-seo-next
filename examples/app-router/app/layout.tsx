import type { Metadata } from 'next';
import { seo } from '../lib/seo';
import { ResurgamJSONLD } from '@resurgam/seo-next';

export async function generateMetadata(): Promise<Metadata> {
  // Retrieve global/homepage metadata
  return seo.generateMetadata({ url: '/' });
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Retrieve global WebSite & Organization JSON-LD
  const siteSchema = await seo.getSchema({ url: '/' });

  return (
    <html lang="en">
      <head>
        <ResurgamJSONLD schema={siteSchema} id="resurgam-global-schema" />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}

