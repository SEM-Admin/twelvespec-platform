import type { Metadata } from 'next';
import './globals.css';
import './quote.css';
import '../../../packages/website-ui/src/website.css';
export const metadata: Metadata = { title: 'TwelveSpec — Make it yours', description: 'Explore, configure, and request a quote for your next branded project. Synthetic local preview.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>; }
