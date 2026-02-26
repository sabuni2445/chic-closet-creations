
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products } from "@/data/products";
import { useStore } from "@/hooks/use-store";
import { Calendar, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import { useERPStore } from "@/hooks/use-erp-store";
import { useMemo } from "react";

const Reservations = () => {
    const { reservations } = useStore();
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

    const reservedProducts = collection.filter((p) => reservations.includes(p.id));

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-grow container py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12 text-center">
                        <h1 className="font-display text-5xl font-light tracking-tight mb-4 uppercase">Your Reservations</h1>
                        <div className="w-12 h-px bg-primary mx-auto" />
                        <p className="mt-4 font-body text-muted-foreground italic text-sm">Please visit our boutique for your scheduled fitting within 48 hours.</p>
                    </div>

                    {reservedProducts.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 border border-dashed border-primary/20">
                            <p className="font-body text-muted-foreground mb-6 uppercase tracking-widest text-sm">You haven't reserved any items yet.</p>
                            <Link to="/">
                                <Button variant="outline" className="rounded-none border-primary/40 hover:bg-primary hover:text-white transition-all">
                                    BROWSE COLLECTION
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {reservedProducts.map((product) => (
                                <div key={product.id} className="p-6 bg-background border border-primary/10 flex flex-col md:flex-row gap-6 items-center shadow-sm">
                                    <div className="w-32 h-32 flex-shrink-0">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-sm" />
                                    </div>
                                    <div className="flex-grow text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span className="text-[10px] tracking-widest text-green-600 font-bold uppercase">Reserved</span>
                                        </div>
                                        <h3 className="font-display text-xl font-medium mb-1">{product.name}</h3>
                                        <div className="flex flex-col md:flex-row gap-4 mt-3 text-xs text-muted-foreground font-body">
                                            <div className="flex items-center justify-center md:justify-start gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>Expires in 47 hours</span>
                                            </div>
                                            <div className="flex items-center justify-center md:justify-start gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span>Central Boutique, Room 402</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Button variant="outline" className="rounded-none border-primary/20 hover:border-primary text-[10px] tracking-widest uppercase h-10">
                                            VIEW TICKET
                                        </Button>
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

export default Reservations;
