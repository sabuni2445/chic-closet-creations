import { Search, User, Menu, X, Heart, Calendar, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useStore } from "@/hooks/use-store";


const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
  { label: "Favorites", href: "/favorites" },
  { label: "Reservations", href: "/reservations" },
  { label: "Contact", href: "/contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { favorites, reservations } = useStore();

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
                <Link
                  key={link.label}
                  to={link.href}
                  className={`font-body text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 relative group ${location.pathname === link.href ? "text-primary" : "text-foreground/80 hover:text-primary"}`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300 ${location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"}`} />
                </Link>
              ))}
            </nav>
          </div>



          <Link to="/" className="flex items-center justify-center">
            <img
              src={logo}
              alt="Rina's Closet"
              className="h-24 md:h-28 w-auto object-contain rounded-full transition-transform hover:scale-105 duration-500 mix-blend-multiply"
            />
          </Link>

          {/* Right: nav + icons */}
          <div className="flex items-center gap-6 flex-1 justify-end">
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.slice(3).map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`font-body text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 relative group ${location.pathname === link.href ? "text-primary" : "text-foreground/80 hover:text-primary"}`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300 ${location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"}`} />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 md:gap-3.5">
              <button aria-label="Search" className="text-foreground/70 hover:text-primary transition-colors p-1.5">
                <Search size={18} strokeWidth={1.5} />
              </button>
              <Link to="/favorites" aria-label="Wishlist" className="relative text-foreground/70 hover:text-primary transition-colors p-1.5">
                <Heart size={18} strokeWidth={1.5} />
                {favorites.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <Link to="/reservations" aria-label="Reservations" className="relative text-foreground/70 hover:text-primary transition-colors p-1.5">
                <Calendar size={18} strokeWidth={1.5} />
                {reservations.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                    {reservations.length}
                  </span>
                )}
              </Link>
              <button aria-label="Account" className="hidden sm:block text-foreground/70 hover:text-primary transition-colors p-1.5">
                <User size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-md animate-fade-in">
            <div className="container py-6 flex flex-col gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`font-body text-sm tracking-[0.2em] uppercase transition-colors ${location.pathname === link.href ? "text-primary" : "text-foreground/80 hover:text-primary"}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
    </>
  );
};


export default Header;
