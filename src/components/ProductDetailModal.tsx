
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
import { Heart, CalendarCheck, Share2 } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { toast } from "sonner";

interface ProductDetailModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

const ProductDetailModal = ({ product, isOpen, onClose }: ProductDetailModalProps) => {
    const { toggleFavorite, isFavorite, reserveProduct, isReserved } = useStore();

    if (!product) return null;

    const favorited = isFavorite(product.id);
    const reserved = isReserved(product.id);

    const handleFavorite = () => {
        toggleFavorite(product.id);
        toast.success(favorited ? "Removed from favorites" : "Added to favorites");
    };

    const handleReserve = () => {
        reserveProduct(product.id);
        toast.success("Product reserved successfully!");
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
                                <Button
                                    onClick={handleReserve}
                                    disabled={reserved}
                                    className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none tracking-[0.2em] text-xs uppercase"
                                >
                                    <CalendarCheck className="mr-2 h-4 w-4" />
                                    {reserved ? "ALREADY RESERVED" : "RESERVE FOR FITTING"}
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
