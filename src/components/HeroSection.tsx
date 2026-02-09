import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-foreground/20" />
      
      <div className="relative z-10 container h-full flex flex-col justify-center items-start">
        <div className="max-w-lg animate-fade-in-up">
          <p className="font-display italic text-2xl text-cream mb-2" style={{ animationDelay: "0.2s" }}>
            She's a
          </p>
          <h1
            className="font-display text-6xl md:text-8xl font-light tracking-wide text-cream mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            DREAM
          </h1>
          <p
            className="font-body text-sm tracking-[0.2em] uppercase text-cream/80 mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            New Collection 2026
          </p>
          <a
            href="#shop"
            className="inline-block bg-accent text-accent-foreground font-body text-sm tracking-[0.2em] uppercase px-10 py-4 hover:bg-accent/90 transition-colors duration-300 animate-fade-in-up"
            style={{ animationDelay: "0.8s" }}
          >
            Shop Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
