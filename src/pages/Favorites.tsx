
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products } from "@/data/products";
import { useStore } from "@/hooks/use-store";
import { Heart, Trash2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import { useERPStore } from "@/hooks/use-erp-store";
import { useMemo } from "react";

const Favorites = () => {
    const { favorites, toggleFavorite, reserveProduct } = useStore();
    const erp = useERPStore();

    const collection = useMemo(() => {
        const erpMapped = erp.products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.selling_price,
            image: p.images?.[0] || "/placeholder.svg",
            category: p.category_id,
        }));
        return [...products, ...erpMapped];
    }, [erp.products]);

    const favoriteProducts = collection.filter((p) => favorites.includes(p.id));

    const handleReserve = (productId: string) => {
        reserveProduct(productId);
        toast.success("Product reserved for fitting!");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-grow container py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12 text-center">
                        <h1 className="font-display text-5xl font-light tracking-tight mb-4 uppercase">Your Favorites</h1>
                        <div className="w-12 h-px bg-primary mx-auto" />
                    </div>

                    {favoriteProducts.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 border border-dashed border-primary/20">
                            <p className="font-body text-muted-foreground mb-6 uppercase tracking-widest text-sm">You haven't added anything to your favorites yet.</p>
                            <Link to="/">
                                <Button variant="outline" className="rounded-none border-primary/40 hover:bg-primary hover:text-white transition-all">
                                    DISCOVER COLLECTION
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-8">
                            {favoriteProducts.map((product) => (
                                <div key={product.id} className="flex flex-col md:flex-row gap-6 p-6 bg-background border border-primary/10 hover:border-primary/30 transition-all duration-500 group">
                                    <div className="w-full md:w-48 h-64 md:h-48 overflow-hidden">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="flex-grow flex flex-col justify-between py-2">
                                        <div>
                                            <span className="text-primary font-body text-[10px] tracking-widest uppercase mb-1 block">{product.category}</span>
                                            <h3 className="font-display text-2xl font-light mb-1">{product.name}</h3>
                                            <p className="text-lg font-body text-primary/70">${product.price}.00</p>
                                        </div>
                                        <div className="flex flex-wrap gap-4 mt-6">
                                            <Button
                                                onClick={() => handleReserve(product.id)}
                                                className="bg-primary hover:bg-primary/90 rounded-none h-10 px-8 text-[10px] tracking-[0.2em] uppercase"
                                            >
                                                <CalendarCheck className="mr-2 h-3.3 w-3.2" />
                                                RESERVE FOR FITTING
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => toggleFavorite(product.id)}
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-none"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                REMOVE
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Favorites;
