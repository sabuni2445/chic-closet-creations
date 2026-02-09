import { Search, ShoppingBag, User, Menu, X, Heart } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "Home", href: "#" },
  { label: "New Arrivals", href: "#" },
  { label: "Shop", href: "#shop" },
  { label: "Collections", href: "#" },
  { label: "Contact", href: "#" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Top banner with shimmer */}
      <div className="bg-foreground py-2.5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[slide-in-right_3s_ease-in-out_infinite]" />
        <p className="relative font-body text-[11px] tracking-[0.25em] uppercase text-background/90">
          ✦ Free Shipping on orders over $200 ✦
        </p>
      </div>

      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        {/* Main header row */}
        <div className="container flex items-center justify-between py-3">
          {/* Left: mobile menu + desktop nav */}
          <div className="flex items-center gap-6 flex-1">
            <button
              className="lg:hidden text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.slice(0, 3).map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-body text-[11px] tracking-[0.2em] uppercase text-foreground/80 hover:text-primary transition-colors duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <div className="flex items-center justify-center">
            <img
              src={logo}
              alt="Rina's Closet"
              className="h-16 md:h-20 w-auto object-contain drop-shadow-sm"
            />
          </div>

          {/* Right: nav + icons */}
          <div className="flex items-center gap-6 flex-1 justify-end">
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.slice(3).map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-body text-[11px] tracking-[0.2em] uppercase text-foreground/80 hover:text-primary transition-colors duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3.5">
              <button aria-label="Search" className="text-foreground/70 hover:text-primary transition-colors p-1.5">
                <Search size={18} strokeWidth={1.5} />
              </button>
              <button aria-label="Wishlist" className="hidden sm:block text-foreground/70 hover:text-primary transition-colors p-1.5">
                <Heart size={18} strokeWidth={1.5} />
              </button>
              <button aria-label="Account" className="hidden sm:block text-foreground/70 hover:text-primary transition-colors p-1.5">
                <User size={18} strokeWidth={1.5} />
              </button>
              <button aria-label="Cart" className="relative text-foreground/70 hover:text-primary transition-colors p-1.5">
                <ShoppingBag size={18} strokeWidth={1.5} />
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-body font-medium">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-md animate-fade-in">
            <div className="container py-6 flex flex-col gap-5">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-body text-sm tracking-[0.2em] uppercase text-foreground/80 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>
    </>
  );
};

export default Header;
