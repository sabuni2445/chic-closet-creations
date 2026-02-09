import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="bg-foreground text-background py-16">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <img src={logo} alt="Rina's Closet" className="h-12 w-auto mb-4 brightness-200" />
          <p className="font-body text-sm text-background/60 leading-relaxed">
            Curated elegance for the modern woman. Every piece tells a story of grace and sophistication.
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg mb-4">Shop</h4>
          {["New Arrivals", "Best Sellers", "Evening Wear", "Casual", "Sale"].map((l) => (
            <a key={l} href="#" className="block font-body text-sm text-background/60 hover:text-background transition-colors mb-2">
              {l}
            </a>
          ))}
        </div>
        <div>
          <h4 className="font-display text-lg mb-4">Help</h4>
          {["Shipping & Returns", "Size Guide", "Contact Us", "FAQ"].map((l) => (
            <a key={l} href="#" className="block font-body text-sm text-background/60 hover:text-background transition-colors mb-2">
              {l}
            </a>
          ))}
        </div>
        <div>
          <h4 className="font-display text-lg mb-4">Follow Us</h4>
          {["Instagram", "Facebook", "Pinterest", "TikTok"].map((l) => (
            <a key={l} href="#" className="block font-body text-sm text-background/60 hover:text-background transition-colors mb-2">
              {l}
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-background/20 mt-12 pt-6 text-center">
        <p className="font-body text-xs text-background/40 tracking-wide">
          © 2026 Rina's Closet. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
