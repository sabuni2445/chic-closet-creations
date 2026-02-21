
import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye } from "lucide-react";
import { products } from "@/data/products";
import ProductDetailModal from "./ProductDetailModal";
import { useStore } from "@/hooks/use-store";
import { toast } from "sonner";

const ProductGrid = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { toggleFavorite, isFavorite } = useStore();

  const handleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    toggleFavorite(productId);
    toast.success(isFavorite(productId) ? "Removed from favorites" : "Added to favorites");
  };

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
            const favorited = isFavorite(product.id);

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`group cursor-pointer relative overflow-hidden animate-fade-in-up ${isLarge ? "row-span-2 md:row-span-2" : ""
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
                  <button
                    onClick={(e) => handleFavorite(e, product.id)}
                    className={`bg-background/80 backdrop-blur-sm p-2 hover:bg-primary hover:text-primary-foreground transition-colors duration-300 ${favorited ? "text-primary" : "text-foreground"}`}
                  >
                    <Heart size={14} strokeWidth={1.5} className={favorited ? "fill-primary" : ""} />
                  </button>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="bg-background/80 backdrop-blur-sm text-foreground p-2 hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
                  >
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
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        <div className="text-center mt-14">
          <Link
            to="/shop"
            className="inline-block border border-foreground/30 text-foreground font-body text-[11px] tracking-[0.25em] uppercase px-12 py-4 hover:bg-foreground hover:text-background transition-all duration-500 relative group"
          >
            <span className="relative z-10">View All Pieces</span>
          </Link>
        </div>
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
};


export default ProductGrid;
