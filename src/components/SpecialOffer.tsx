import { useState } from "react";
import floralRight from "@/assets/floral-right.png";
import floralLeft from "@/assets/floral-left.png";

const SpecialOffer = () => {
  const [email, setEmail] = useState("");

  return (
    <section className="relative overflow-hidden bg-blush/30 py-24 md:py-32">
      {/* Decorative floral images */}
      <img
        src={floralLeft}
        alt=""
        aria-hidden="true"
        className="absolute left-0 bottom-0 w-32 md:w-48 opacity-60 -rotate-12 translate-y-4 -translate-x-4 pointer-events-none select-none"
      />
      <img
        src={floralRight}
        alt=""
        aria-hidden="true"
        className="absolute right-0 top-0 w-40 md:w-56 opacity-50 rotate-6 -translate-y-6 translate-x-6 pointer-events-none select-none"
      />

      {/* Soft paint-stroke-style decorative blobs */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 w-40 h-20 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-12 bottom-8 w-28 h-28 bg-blush/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container text-center">
        <p className="font-display italic text-3xl md:text-4xl text-accent mb-1 animate-fade-in">
          showcase a
        </p>
        <h2 className="font-display text-5xl md:text-7xl font-light text-foreground tracking-[0.08em] mb-8 animate-fade-in-up">
          SPECIAL OFFER
        </h2>
        <p className="font-body text-muted-foreground text-sm max-w-md mx-auto mb-10 leading-relaxed">
          Join the list to be the first to hear about new arrivals, sales and special offers!
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex max-w-xs mx-auto border border-foreground/30 bg-background/60 backdrop-blur-sm"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent font-body text-sm py-3 px-4 outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="text-foreground hover:text-primary transition-colors px-4 border-l border-foreground/30 text-lg"
            aria-label="Subscribe"
          >
            →
          </button>
        </form>
      </div>
    </section>
  );
};

export default SpecialOffer;
