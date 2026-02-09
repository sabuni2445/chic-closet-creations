import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const navLinks = ["Home", "New Arrivals", "Shop", "Collections", "Contact"];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Top banner */}
      <div className="bg-primary py-2 text-center">
        <p className="font-body text-xs tracking-[0.2em] uppercase text-primary-foreground">
          Free Shipping on orders over $200
        </p>
      </div>

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between py-4">
          {/* Mobile menu button */}
          <button
            className="lg:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <div className="flex items-center justify-center flex-1 lg:flex-none">
            <img src={logo} alt="Rina's Closet" className="h-14 w-auto object-contain" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="font-body text-sm tracking-[0.15em] uppercase text-foreground hover:text-primary transition-colors duration-300"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <button aria-label="Search" className="text-foreground hover:text-primary transition-colors">
              <Search size={20} />
            </button>
            <button aria-label="Account" className="hidden sm:block text-foreground hover:text-primary transition-colors">
              <User size={20} />
            </button>
            <button aria-label="Cart" className="relative text-foreground hover:text-primary transition-colors">
              <ShoppingBag size={20} />
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-body">
                0
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-border bg-background animate-fade-in">
            <div className="container py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="font-body text-sm tracking-[0.15em] uppercase text-foreground hover:text-primary transition-colors"
                >
                  {link}
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
