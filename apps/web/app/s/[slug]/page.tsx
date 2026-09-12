// Song4Her 🦋 — Public Recipient Page
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PublicDelivery } from '@song4her/types';
import { RecipientView } from './RecipientView';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getDelivery(slug: string): Promise<PublicDelivery | null> {
  try {
    const res = await fetch(`${API_URL}/api/public/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicDelivery;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const delivery = await getDelivery(slug);

  if (!delivery) {
    return {
      title: 'Song4Her 🦋',
      description: 'A little song, just for you.',
    };
  }

  return {
    title: `${delivery.title} — Song4Her 🦋`,
    description: `A little song for you: "${delivery.title}" by ${delivery.artist}`,
    openGraph: {
      title: `${delivery.title} — for you 🦋`,
      description: `A little song, just for you. Listen & download now.`,
      images: [
        {
          url: `${API_URL}/api/artwork/${slug}`,
          width: 600,
          height: 600,
          alt: delivery.title,
        },
      ],
    },
  };
}

export default async function RecipientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const delivery = await getDelivery(slug);

  if (!delivery) {
    notFound();
    return null;
  }

  return <RecipientView delivery={delivery} />;
}
