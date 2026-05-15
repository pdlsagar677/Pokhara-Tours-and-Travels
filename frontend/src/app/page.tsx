import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Services from "@/components/home/Services";
import Destinations from "@/components/home/Destinations";
import ContactCTA from "@/components/home/ContactCTA";
import AIRecommendations from "@/components/ai/AIRecommendations";
import type { Package } from "@/types";

export const revalidate = 300;

async function getFeaturedPackages(): Promise<Package[]> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  try {
    const res = await fetch(`${baseURL}/api/packages`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Package[] };
    const list = json.data ?? [];
    return [...list]
      .sort(
        (a, b) =>
          Number(b.isOffer) - Number(a.isOffer) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt)
      )
      .slice(0, 3);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedPackages();
  return (
    <>
      <Hero />
      <About />
      <AIRecommendations />
      <Services />
      <Destinations initialPackages={featured} />
      <ContactCTA />
    </>
  );
}
