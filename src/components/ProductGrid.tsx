import dress1 from "@/assets/dress1.jpg";
import dress2 from "@/assets/dress2.jpg";
import dress3 from "@/assets/dress3.jpg";
import dress4 from "@/assets/dress4.jpg";
import dress5 from "@/assets/dress5.jpg";
import dress6 from "@/assets/dress6.jpg";
import dress7 from "@/assets/dress7.jpg";
import dress8 from "@/assets/dress8.jpg";

const products = [
  { name: "Blush Evening Gown", price: 289, image: dress1, tag: "New" },
  { name: "Ivory Satin Dress", price: 199, image: dress2 },
  { name: "Gold Champagne Maxi", price: 349, image: dress3, tag: "Best Seller" },
  { name: "Dusty Rose Midi", price: 179, image: dress4 },
  { name: "Noir Velvet Gown", price: 399, image: dress5, tag: "Exclusive" },
  { name: "Lavender Floral", price: 159, image: dress6 },
  { name: "Emerald Silk Gown", price: 329, image: dress7 },
  { name: "Coral Wrap Dress", price: 189, image: dress8 },
];

const ProductGrid = () => {
  return (
    <section id="shop" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-3">
            Our Collection
          </h2>
          <p className="font-body text-muted-foreground text-sm tracking-[0.15em] uppercase">
            Curated elegance for every occasion
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <div
              key={product.name}
              className="group cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="relative overflow-hidden bg-card mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                {product.tag && (
                  <span className="absolute top-3 left-3 bg-accent text-accent-foreground font-body text-[10px] tracking-[0.15em] uppercase px-3 py-1">
                    {product.tag}
                  </span>
                )}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100">
                  <button className="bg-background text-foreground font-body text-xs tracking-[0.15em] uppercase px-6 py-3 hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                    Quick View
                  </button>
                </div>
              </div>
              <h3 className="font-display text-lg text-foreground">{product.name}</h3>
              <p className="font-body text-sm text-muted-foreground">${product.price}.00</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="#"
            className="inline-block border border-foreground text-foreground font-body text-xs tracking-[0.2em] uppercase px-10 py-3 hover:bg-foreground hover:text-background transition-colors duration-300"
          >
            View All
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
