import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brainnote — Commercial AI-Powered Multi-Source Note-Taking SaaS',
  description:
    'Brainnote transforms meetings, presentations, YouTube videos, PDFs, and audio into structured AI summaries, action items, study guides, and actionable knowledge.',
  keywords: ['AI notes', 'meeting minutes', 'YouTube summary', 'PDF AI', 'study flashcards', 'SaaS knowledge base'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
