
import { Instagram, Facebook, Heart, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="bg-foreground text-background">
    {/* Main footer */}
    <div className="container py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">



        {/* Brand */}
        <div className="md:col-span-4">
          <img src={logo} alt="Rina's Closet" className="h-24 w-auto mb-5 rounded-full mix-blend-multiply" />
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-primary mt-1 flex-shrink-0" />
              <p className="font-body text-sm text-background/50 leading-relaxed">
                Bole Welo Sefer, Garad City Center ground floor, Addis Ababa
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-primary flex-shrink-0" />
              <p className="font-body text-sm text-background/50">
                +251 98 487 0000
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-8">
            {[Instagram, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 border border-background/20 flex items-center justify-center text-background/50 hover:text-primary hover:border-primary transition-all duration-300"
              >
                <Icon size={18} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="md:col-span-2">
          <h4 className="font-display text-lg mb-5 text-background/90 uppercase tracking-widest">Shop</h4>
          {["New Arrivals", "Best Sellers", "Evening Wear", "Casual"].map((l) => (
            <Link key={l} to="/shop" className="block font-body text-[13px] text-background/40 hover:text-primary transition-colors mb-2.5">
              {l}
            </Link>
          ))}
        </div>
        <div className="md:col-span-2">
          <h4 className="font-display text-lg mb-5 text-background/90 uppercase tracking-widest">Company</h4>
          <Link to="/contact" className="block font-body text-[13px] text-background/40 hover:text-primary transition-colors mb-2.5">
            Contact Us
          </Link>
          <Link to="/favorites" className="block font-body text-[13px] text-background/40 hover:text-primary transition-colors mb-2.5">
            Wishlist
          </Link>
          <Link to="/reservations" className="block font-body text-[13px] text-background/40 hover:text-primary transition-colors mb-2.5">
            Reservations
          </Link>
          <Link to="/admin" className="block font-body text-[13px] text-background/40 hover:text-primary transition-colors mb-2.5">
            Admin Dashboard
          </Link>
        </div>

        {/* Newsletter mini */}
        <div className="md:col-span-4">
          <h4 className="font-display text-lg mb-5 text-background/90 uppercase tracking-widest text-primary/80 italic">A Legacy of Elegance</h4>
          <p className="font-body text-[13px] text-background/40 mb-6 leading-relaxed italic">
            "Beauty begins the moment you decide to be yourself." — Coco Chanel
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex border border-background/20 group focus-within:border-primary transition-colors">
            <input
              type="email"
              placeholder="Join our private list"
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
      <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-body text-[11px] text-background/30 tracking-widest uppercase">
          © 2026 Rina's Closet • Ethiopia
        </p>
        <p className="font-body text-[11px] text-background/30 tracking-widest uppercase flex items-center gap-1.5 group">
          Curated with <Heart size={10} className="text-primary group-hover:scale-125 transition-transform" fill="currentColor" /> for the modern woman
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
