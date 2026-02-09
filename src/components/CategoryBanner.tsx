const categories = [
  { name: "Evening Wear", count: 24 },
  { name: "Casual", count: 18 },
  { name: "Bridal", count: 12 },
];

const CategoryBanner = () => (
  <section className="py-16 bg-secondary">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="group cursor-pointer bg-background p-10 text-center hover:bg-primary transition-colors duration-500"
          >
            <h3 className="font-display text-2xl text-foreground group-hover:text-primary-foreground transition-colors duration-500 mb-1">
              {cat.name}
            </h3>
            <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary-foreground/70 transition-colors duration-500">
              {cat.count} pieces
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default CategoryBanner;
