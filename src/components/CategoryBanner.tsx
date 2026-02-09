import dress2 from "@/assets/dress2.jpg";
import dress5 from "@/assets/dress5.jpg";
import dress7 from "@/assets/dress7.jpg";

const categories = [
  { name: "Evening Wear", count: 24, image: dress5, subtitle: "Glamour redefined" },
  { name: "Casual", count: 18, image: dress2, subtitle: "Effortless chic" },
  { name: "Bridal", count: 12, image: dress7, subtitle: "Your perfect day" },
];

const CategoryBanner = () => (
  <section className="py-20 bg-secondary/50">
    <div className="container">
      <div className="text-center mb-14">
        <p className="font-display italic text-2xl text-primary mb-1">shop by</p>
        <h2 className="font-display text-5xl md:text-6xl font-light text-foreground tracking-[0.06em]">
          CATEGORY
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <div
            key={cat.name}
            className="group cursor-pointer relative overflow-hidden h-[400px] md:h-[480px] animate-fade-in-up"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent group-hover:from-foreground/90 transition-all duration-700" />

            <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
              <p className="font-body text-[10px] tracking-[0.25em] uppercase text-background/60 mb-2">
                {cat.subtitle}
              </p>
              <h3 className="font-display text-3xl text-background mb-2 group-hover:tracking-wider transition-all duration-500">
                {cat.name}
              </h3>
              <p className="font-body text-xs tracking-[0.15em] uppercase text-background/50 mb-4">
                {cat.count} pieces
              </p>
              <span className="inline-block w-8 h-px bg-primary group-hover:w-16 transition-all duration-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default CategoryBanner;
