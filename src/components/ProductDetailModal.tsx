import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Product } from "@/data/products";
import ThreeDViewer from "./ThreeDViewer";
import { Button } from "@/components/ui/button";
import { Heart, CalendarCheck, Share2, Lock, UserCheck } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useERPStore } from "@/hooks/use-erp-store";
import { useAuthStore } from "@/hooks/use-auth-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProductDetailModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

const ProductDetailModal = ({ product, isOpen, onClose }: ProductDetailModalProps) => {
    const { toggleFavorite, isFavorite, reserveProduct, isReserved } = useStore();
    const erp = useERPStore();
    const { currentUser } = useAuthStore();
    const navigate = useNavigate();

    if (!product) return null;

    const favorited = isFavorite(product.id);
    const reserved = isReserved(product.id);

    const handleFavorite = () => {
        toggleFavorite(product.id);
        toast.success(favorited ? "Removed from favorites" : "Added to favorites");
    };

    const handleReserve = () => {
        // Must be logged in
        if (!currentUser) {
            toast.error("Please sign in to reserve a fitting.", {
                action: {
                    label: "Sign In",
                    onClick: () => { onClose(); navigate("/auth"); }
                }
            });
            return;
        }

        // Try to find a variant ID — use product.id as fallback
        const variant = erp.variants.find(v => v.product_id === product.id);
        const variantId = variant?.id ?? product.id;

        try {
            console.log("Submitting reservation to ERP:", {
                customer_name: currentUser.name,
                customer_phone: currentUser.phone,
                product_variant_id: variantId,
                notes: `Requested: ${product.name}`
            });

            erp.requestReservation({
                customer_name: currentUser.name,
                customer_phone: currentUser.phone,
                product_variant_id: variantId,
                notes: `Requested: ${product.name}`
            });

            reserveProduct(product.id);
            toast.success("Fitting reserved! We'll be in touch shortly.");
        } catch (err: any) {
            console.error("Reservation Error:", err);
            toast.error(err?.message || "Could not reserve — item may be out of stock.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">

                    <div className="space-y-4">
                        <ThreeDViewer
                            image={product.image}
                            color={product.name.includes("Emerald") ? "#047857" : product.name.includes("Rose") ? "#E11D48" : "#D4AF37"}
                        />
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="aspect-square bg-muted rounded-md overflow-hidden border border-primary/5">
                                    <img src={product.image} alt="" className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-6">
                        <div>
                            <span className="text-primary font-body text-[10px] tracking-[0.3em] uppercase mb-2 block">
                                {product.category}
                            </span>
                            <DialogTitle className="font-display text-4xl md:text-5xl font-light tracking-tight mb-2">
                                {product.name}
                            </DialogTitle>
                            <p className="text-2xl font-body text-primary/80">${product.price}.00</p>
                        </div>

                        <DialogDescription className="text-muted-foreground leading-relaxed font-body text-base">
                            {product.description}
                        </DialogDescription>

                        <div className="space-y-4 pt-4">
                            <div className="flex flex-col gap-3">

                                {/* Logged-in user badge */}
                                {currentUser && (
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
                                        <UserCheck size={13} />
                                        Booking as <span className="font-black">{currentUser.name}</span>
                                    </div>
                                )}

                                <Button
                                    onClick={handleReserve}
                                    disabled={reserved}
                                    className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none tracking-[0.2em] text-xs uppercase"
                                >
                                    {reserved ? (
                                        <><CalendarCheck className="mr-2 h-4 w-4" /> ALREADY RESERVED</>
                                    ) : currentUser ? (
                                        <><CalendarCheck className="mr-2 h-4 w-4" /> RESERVE FOR FITTING</>
                                    ) : (
                                        <><Lock className="mr-2 h-4 w-4" /> SIGN IN TO RESERVE</>
                                    )}
                                </Button>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleFavorite}
                                        className={`flex-1 h-12 rounded-none border-primary/20 hover:border-primary transition-all duration-300 ${favorited ? "bg-primary/5 text-primary border-primary" : ""}`}
                                    >
                                        <Heart className={`mr-2 h-4 w-4 ${favorited ? "fill-primary" : ""}`} />
                                        {favorited ? "FAVORITED" : "ADD TO FAVORITES"}
                                    </Button>

                                    <Button variant="outline" className="w-12 h-12 p-0 rounded-none border-primary/20 hover:border-primary">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest pt-4 border-t border-primary/10">
                                <p>Complimentary alterations included</p>
                                <p className="mt-1">Free boutique pickup available</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
};

export default ProductDetailModal;
