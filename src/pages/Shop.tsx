
import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products, Product } from "@/data/products";
import { useStore } from "@/hooks/use-store";
import { Search, Filter, SlidersHorizontal, Grid2X2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ProductDetailModal from "@/components/ProductDetailModal";
import { toast } from "sonner";
import { Heart, Eye } from "lucide-react";

import { useERPStore } from "@/hooks/use-erp-store";

const Shop = () => {
    const erp = useERPStore();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [sortBy, setSortBy] = useState("featured");
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const { toggleFavorite, isFavorite } = useStore();

    const collection = useMemo(() => {
        const erpMapped = erp.products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.selling_price,
            image: p.images?.[0] || "/placeholder.svg",
            images: p.images || ["/placeholder.svg"],
            category: p.category_id,
            description: p.description,
            featured: false,
            sizes: p.sizes,
            colors: p.colors
        }));
        return [...products, ...erpMapped];
    }, [erp.products]);

    const categories = useMemo(() => {
        return ["all", ...new Set(collection.map((p) => p.category.toLowerCase()))];
    }, [collection]);

    const filteredProducts = useMemo(() => {
        let result = collection.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = category === "all" || p.category.toLowerCase() === category;

            // Stock Check: Only show if there is physical stock available
            // 1. Find all variants for this product
            const variants = erp.variants.filter(v => v.product_id === p.id);
            const variantIds = variants.map(v => v.id);

            // 2. Add product.id itself if it's being used as a variant ID fallback (common in this app)
            if (!variantIds.includes(p.id)) variantIds.push(p.id);

            // 3. Check if any batch for these variants has quantity > 0
            const hasStock = erp.batches.some(b =>
                variantIds.includes(b.product_variant_id) &&
                (b.quantity_remaining - (b.quantity_reserved || 0)) > 0
            );

            return matchesSearch && matchesCategory && hasStock;
        });

        if (sortBy === "price-low") {
            result.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-high") {
            result.sort((a, b) => b.price - a.price);
        } else if (sortBy === "featured") {
            result.sort((a, b) => ((b as any).featured ? 1 : 0) - ((a as any).featured ? 1 : 0));
        }

        return result;
    }, [collection, search, category, sortBy, erp.batches, erp.variants]);

    const handleFavorite = (e: React.MouseEvent, productId: string) => {
        e.stopPropagation();
        toggleFavorite(productId);
        toast.success(isFavorite(productId) ? "Removed from favorites" : "Added to favorites");
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-grow container py-10">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <h1 className="font-display text-5xl md:text-6xl font-light tracking-tight mb-4 uppercase">The Collection</h1>
                        <div className="w-16 h-px bg-primary mx-auto mb-6" />
                        <p className="font-body text-muted-foreground italic max-w-2xl mx-auto">
                            Exquisite designs, handcrafted for your most memorable moments. Explore our full range of luxury evening wear and accessories.
                        </p>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between bg-muted/20 p-4 border border-primary/5 rounded-sm">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search collection..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-11 bg-background border-primary/10 rounded-none focus-visible:ring-primary/20"
                            />
                        </div>

                        <div className="flex flex-wrap gap-4 w-full md:w-auto">
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full md:w-40 h-11 rounded-none border-primary/10 bg-background flex gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="capitalize">
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full md:w-48 h-11 rounded-none border-primary/10 bg-background">
                                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-2" />
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="featured">Featured First</SelectItem>
                                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Results Info */}
                    <div className="mb-6 flex items-center justify-between">
                        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                            Showing {filteredProducts.length} results
                        </p>
                    </div>

                    {/* Grid */}
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredProducts.map((product, i) => {
                                const favorited = isFavorite(product.id);
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        className="group cursor-pointer relative overflow-hidden animate-fade-in-up border border-primary/5 bg-background"
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                    >
                                        <div className="aspect-[3/4] overflow-hidden relative">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />

                                            {(product as any).tag && (
                                                <span className="absolute top-3 left-3 bg-primary/90 text-primary-foreground font-body text-[8px] tracking-[0.2em] uppercase px-3 py-1.5">
                                                    {(product as any).tag}
                                                </span>
                                            )}

                                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                                                <button
                                                    onClick={(e) => handleFavorite(e, product.id)}
                                                    className={`bg-background/90 backdrop-blur-sm p-2 hover:bg-primary hover:text-primary-foreground transition-colors duration-300 ${favorited ? "text-primary border border-primary/50" : "text-foreground"}`}
                                                >
                                                    <Heart size={14} strokeWidth={1.5} className={favorited ? "fill-primary" : ""} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 text-center">
                                            <span className="text-[9px] tracking-[0.25em] text-primary/60 uppercase font-body block mb-1">
                                                {product.category}
                                            </span>
                                            <h3 className="font-display text-lg font-medium leading-tight mb-1 group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            <p className="font-body text-sm text-muted-foreground">${product.price}.00</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-muted/20 border border-dashed border-primary/10">
                            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="font-body text-muted-foreground uppercase tracking-widest text-sm">
                                No products found matching your filters.
                            </p>
                            <Button
                                variant="ghost"
                                onClick={() => { setSearch(""); setCategory("all"); }}
                                className="mt-4 text-primary hover:bg-primary/5 underline underline-offset-4 rounded-none h-auto p-0"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            <ProductDetailModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
            <Footer />
        </div>
    );
};

export default Shop;
