
import heroBg from "@/assets/hero-bg.jpg";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative h-[90vh] min-h-[650px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/10 to-foreground/50" />

      <div className="relative z-10 container h-full flex flex-col justify-end pb-20 items-start">
        <div className="max-w-xl">
          <p
            className="font-display italic text-3xl md:text-4xl text-cream/90 mb-2 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            She's a
          </p>
          <h1
            className="font-display text-7xl md:text-[120px] font-light tracking-[0.08em] text-cream leading-[0.9] mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            DREAM
          </h1>
          <div className="flex items-center gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <span className="w-12 h-px bg-cream/50" />
            <p className="font-body text-[11px] tracking-[0.3em] uppercase text-cream/70">
              New Collection 2026
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-block bg-primary/90 backdrop-blur-sm text-primary-foreground font-body text-[11px] tracking-[0.25em] uppercase px-10 py-4 hover:bg-primary transition-all duration-500 animate-fade-in-up"
          >
            Explore Now
          </Link>
        </div>
      </div>

      {/* Decorative scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: "1.2s" }}>
        <span className="font-body text-[9px] tracking-[0.3em] uppercase text-cream/40">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-cream/40 to-transparent" />
      </div>
    </section>
  );
};

export default HeroSection;
