import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryBanner from "@/components/CategoryBanner";
import ProductGrid from "@/components/ProductGrid";
import SpecialOffer from "@/components/SpecialOffer";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
