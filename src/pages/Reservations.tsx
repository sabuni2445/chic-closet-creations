import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products } from "@/data/products";
import { useStore } from "@/hooks/use-store";
import { Calendar, CheckCircle2, MapPin, Ticket, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { useERPStore } from "@/hooks/use-erp-store";
import { useAuthStore } from "@/hooks/use-auth-store";

const Reservations = () => {
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const erp = useERPStore();
    const { currentUser } = useAuthStore();

    const userReservations = useMemo(() => {
        if (!currentUser) return [];
        return erp.reservations.filter(r =>
            r.customer_phone === currentUser.phone ||
            r.customer_name === currentUser.name
        );
    }, [erp.reservations, currentUser]);

    const reservedItems = useMemo(() => {
        return userReservations.map(res => {
            const variant = erp.variants.find(v => v.id === res.product_variant_id);
            const product = erp.products.find(p => p.id === (variant?.product_id || res.product_variant_id));

            // Fallback to hardcoded products if not in ERP products
            const fallbackProd = products.find(p => p.id === res.product_variant_id);

            return {
                ...res,
                productName: product?.name || fallbackProd?.name || "Boutique Fitting",
                productImage: product?.images?.[0] || fallbackProd?.image || "/placeholder.svg",
                price: product?.selling_price || fallbackProd?.price || 0
            };
        });
    }, [userReservations, erp.variants, erp.products]);

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

                    {reservedItems.length === 0 ? (
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
                            {reservedItems.map((item) => (
                                <div key={item.id} className="p-6 bg-background border border-primary/10 flex flex-col md:flex-row gap-6 items-center shadow-sm">
                                    <div className="w-32 h-32 flex-shrink-0">
                                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover rounded-sm" />
                                    </div>
                                    <div className="flex-grow text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                            <CheckCircle2 className={`h-4 w-4 ${item.status === 'cancelled' ? 'text-rose-500' : 'text-green-500'}`} />
                                            <span className={`text-[10px] tracking-widest font-bold uppercase ${item.status === 'cancelled' ? 'text-rose-600' : 'text-green-600'}`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h3 className="font-display text-xl font-medium mb-1">{item.productName}</h3>
                                        <div className="flex flex-col md:flex-row gap-4 mt-3 text-xs text-muted-foreground font-body">
                                            <div className="flex items-center justify-center md:justify-start gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center justify-center md:justify-start gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span>Central Boutique (Active)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedTicket(item)}
                                            className="rounded-none border-primary/20 hover:border-primary text-[10px] tracking-widest uppercase h-10"
                                        >
                                            VIEW TICKET
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-none shadow-2xl rounded-none">
                    <div className="bg-primary p-8 text-primary-foreground text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                        <Ticket size={40} className="mx-auto mb-4 opacity-50" />
                        <DialogTitle className="font-display text-3xl tracking-tight uppercase mb-1">Fitting Ticket</DialogTitle>
                        <p className="text-[10px] tracking-[0.3em] font-body opacity-70 uppercase">Reference: {selectedTicket?.id?.slice(0, 8)}</p>
                    </div>

                    <div className="p-8 space-y-6 bg-background">
                        <div className="flex justify-between items-start border-b border-primary/5 pb-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Customer Details</p>
                                <h4 className="font-display text-xl">{selectedTicket?.customer_name}</h4>
                                <p className="text-xs text-muted-foreground">{selectedTicket?.customer_phone}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Item Info</p>
                                <h4 className="font-display text-lg">{selectedTicket?.productName}</h4>
                                <p className="text-xs text-muted-foreground">Status: {selectedTicket?.status}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-muted/30 border border-primary/5">
                                <QrCode size={60} className="opacity-20" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest">Central Boutique Protocol</p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">Present this ticket to our boutique stylist at Central Boutique, Room 402 for your scheduled fitting.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-dashed border-primary/20 text-center">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-4 italic">Expires 48h after booking date</p>
                            <Button className="w-full rounded-none" onClick={() => window.print()}>
                                DOWNLOAD PDF
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
};

export default Reservations;
