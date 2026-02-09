import { Heart, Eye } from "lucide-react";
import dress1 from "@/assets/dress1.jpg";
import dress2 from "@/assets/dress2.jpg";
import dress3 from "@/assets/dress3.jpg";
import dress4 from "@/assets/dress4.jpg";
import dress5 from "@/assets/dress5.jpg";
import dress6 from "@/assets/dress6.jpg";
import dress7 from "@/assets/dress7.jpg";
import dress8 from "@/assets/dress8.jpg";

const products = [
  { name: "Blush Evening Gown", price: 289, image: dress1, tag: "New", featured: true },
  { name: "Ivory Satin Dress", price: 199, image: dress2 },
  { name: "Gold Champagne Maxi", price: 349, image: dress3, tag: "Best Seller" },
  { name: "Dusty Rose Midi", price: 179, image: dress4 },
  { name: "Noir Velvet Gown", price: 399, image: dress5, tag: "Exclusive", featured: true },
  { name: "Lavender Floral", price: 159, image: dress6 },
  { name: "Emerald Silk Gown", price: 329, image: dress7 },
  { name: "Coral Wrap Dress", price: 189, image: dress8 },
];

const ProductGrid = () => {
  return (
    <section id="shop" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <p className="font-display italic text-2xl text-primary mb-1 animate-fade-in">discover</p>
          <h2 className="font-display text-5xl md:text-6xl font-light text-foreground tracking-[0.06em] mb-4 animate-fade-in-up">
            OUR COLLECTION
          </h2>
          <div className="w-16 h-px bg-primary mx-auto" />
        </div>

        {/* Creative masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[280px] md:auto-rows-[320px]">
          {products.map((product, i) => {
            const isLarge = product.featured;
            return (
              <div
                key={product.name}
                className={`group cursor-pointer relative overflow-hidden animate-fade-in-up ${
                  isLarge ? "row-span-2 md:row-span-2" : ""
                }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  loading="lazy"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Tag */}
                {product.tag && (
                  <span className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-primary-foreground font-body text-[9px] tracking-[0.2em] uppercase px-3 py-1.5">
                    {product.tag}
                  </span>
                )}

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                  <button className="bg-background/80 backdrop-blur-sm text-foreground p-2 hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                    <Heart size={14} strokeWidth={1.5} />
                  </button>
                  <button className="bg-background/80 backdrop-blur-sm text-foreground p-2 hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                    <Eye size={14} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Product info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-display text-lg text-background drop-shadow-sm">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-body text-sm text-background/80">${product.price}.00</p>
                    <button className="font-body text-[10px] tracking-[0.15em] uppercase text-background/80 border-b border-background/40 hover:text-background hover:border-background transition-colors pb-0.5 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                      Add to bag
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-14">
          <a
            href="#"
            className="inline-block border border-foreground/30 text-foreground font-body text-[11px] tracking-[0.25em] uppercase px-12 py-4 hover:bg-foreground hover:text-background transition-all duration-500 relative group"
          >
            <span className="relative z-10">View All Pieces</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
