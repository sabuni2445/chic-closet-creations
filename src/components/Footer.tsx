import { Instagram, Facebook, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="bg-foreground text-background">
    {/* Main footer */}
    <div className="container py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Brand */}
        <div className="md:col-span-4">
          <img src={logo} alt="Rina's Closet" className="h-16 w-auto mb-5 brightness-[2] contrast-[0.9]" />
          <p className="font-body text-sm text-background/50 leading-relaxed max-w-xs">
            Curated elegance for the modern woman. Every piece tells a story of grace and sophistication.
          </p>
          <div className="flex items-center gap-4 mt-6">
            {[Instagram, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 border border-background/20 flex items-center justify-center text-background/50 hover:text-primary hover:border-primary transition-all duration-300"
              >
                <Icon size={16} strokeWidth={1.5} />
              </a>
            ))}
            <a href="#" className="w-9 h-9 border border-background/20 flex items-center justify-center text-background/50 hover:text-primary hover:border-primary transition-all duration-300">
              <span className="font-body text-xs font-medium">P</span>
            </a>
            <a href="#" className="w-9 h-9 border border-background/20 flex items-center justify-center text-background/50 hover:text-primary hover:border-primary transition-all duration-300">
              <span className="font-body text-xs font-medium">T</span>
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="md:col-span-2">
          <h4 className="font-display text-lg mb-5 text-background/90">Shop</h4>
          {["New Arrivals", "Best Sellers", "Evening Wear", "Casual", "Sale"].map((l) => (
            <a key={l} href="#" className="block font-body text-[13px] text-background/40 hover:text-primary transition-colors mb-2.5">
              {l}
            </a>
          ))}
        </div>
        <div className="md:col-span-2">
          <h4 className="font-display text-lg mb-5 text-background/90">Help</h4>
          {["Shipping & Returns", "Size Guide", "Contact Us", "FAQ"].map((l) => (
            <a key={l} href="#" className="block font-body text-[13px] text-background/40 hover:text-primary transition-colors mb-2.5">
              {l}
            </a>
          ))}
        </div>

        {/* Newsletter mini */}
        <div className="md:col-span-4">
          <h4 className="font-display text-lg mb-5 text-background/90">Stay in touch</h4>
          <p className="font-body text-[13px] text-background/40 mb-4 leading-relaxed">
            Be the first to know about new arrivals and exclusive offers.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex border border-background/20">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 bg-transparent font-body text-sm py-3 px-4 outline-none text-background/80 placeholder:text-background/30"
            />
            <button className="px-5 text-background/60 hover:text-primary transition-colors border-l border-background/20 text-sm">
              →
            </button>
          </form>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-background/10">
      <div className="container py-5 flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="font-body text-[11px] text-background/30 tracking-wide">
          © 2026 Rina's Closet. All rights reserved.
        </p>
        <p className="font-body text-[11px] text-background/30 tracking-wide flex items-center gap-1">
          Made with <Heart size={10} className="text-primary" fill="currentColor" /> for dreamers
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
