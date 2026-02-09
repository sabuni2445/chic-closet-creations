import { useState } from "react";

const SpecialOffer = () => {
  const [email, setEmail] = useState("");

  return (
    <section className="py-20 bg-blush/40">
      <div className="container text-center">
        <p className="font-display italic text-2xl text-accent mb-2">showcase a</p>
        <h2 className="font-display text-5xl md:text-6xl font-light text-foreground tracking-wide mb-6">
          SPECIAL OFFER
        </h2>
        <p className="font-body text-muted-foreground text-sm max-w-md mx-auto mb-8">
          Join the list to be the first to hear about new arrivals, sales and special offers!
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex max-w-sm mx-auto border-b border-foreground"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent font-body text-sm py-3 outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="text-foreground hover:text-primary transition-colors px-3"
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
