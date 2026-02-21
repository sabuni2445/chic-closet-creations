
import { useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryBanner from "@/components/CategoryBanner";
import ProductGrid from "@/components/ProductGrid";
import SpecialOffer from "@/components/SpecialOffer";
import Footer from "@/components/Footer";
import { useLocation } from "react-router-dom";

const Index = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <CategoryBanner />
        <ProductGrid />
        <SpecialOffer />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
