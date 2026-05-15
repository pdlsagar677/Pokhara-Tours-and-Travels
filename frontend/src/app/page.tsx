import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Services from "@/components/home/Services";
import Destinations from "@/components/home/Destinations";
import ContactCTA from "@/components/home/ContactCTA";
import AIRecommendations from "@/components/ai/AIRecommendations";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <AIRecommendations />
      <Services />
      <Destinations />
      <ContactCTA />
    </>
  );
}
