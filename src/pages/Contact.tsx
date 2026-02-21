
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Phone, MapPin, Mail, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-grow container py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="font-display text-5xl md:text-6xl font-light tracking-tight mb-4 uppercase">Visit Our Boutique</h1>
                        <div className="w-16 h-px bg-primary mx-auto mb-6" />
                        <p className="font-body text-muted-foreground italic text-lg">
                            Experience the luxury in person. Our atelier is open for consultations and fittings.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-10">
                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="text-primary h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-display text-xl mb-2 uppercase tracking-widest">Our Location</h3>
                                    <p className="font-body text-muted-foreground leading-relaxed">
                                        Bole Welo Sefer<br />
                                        Garad City Center, Ground Floor<br />
                                        Addis Ababa, Ethiopia
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Phone className="text-primary h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-display text-xl mb-2 uppercase tracking-widest">Phone</h3>
                                    <p className="font-body text-muted-foreground text-lg">
                                        +251 98 487 0000
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 uppercase tracking-widest mt-1">Available on WhatsApp & Telegram</p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Mail className="text-primary h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-display text-xl mb-2 uppercase tracking-widest">Email</h3>
                                    <p className="font-body text-muted-foreground">
                                        contact@rinascloset.com
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-primary/10">
                                <h3 className="font-display text-sm mb-4 uppercase tracking-[0.3em] text-primary/70">Connect with us</h3>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="rounded-none border-primary/20 hover:bg-primary hover:text-white transition-all size-10 p-0">
                                        <Instagram className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" className="rounded-none border-primary/20 hover:bg-primary hover:text-white transition-all size-10 p-0">
                                        <MessageCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-muted/30 p-8 border border-primary/5 rounded-sm">
                            <h3 className="font-display text-2xl mb-6 font-light uppercase tracking-widest">Send a Message</h3>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest mb-1.5 font-bold">Full Name</label>
                                    <input type="text" className="w-full h-11 bg-background border border-primary/10 px-4 focus:outline-none focus:border-primary transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest mb-1.5 font-bold">Email Address</label>
                                    <input type="email" className="w-full h-11 bg-background border border-primary/10 px-4 focus:outline-none focus:border-primary transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest mb-1.5 font-bold">Message</label>
                                    <textarea rows={4} className="w-full bg-background border border-primary/10 p-4 focus:outline-none focus:border-primary transition-colors text-sm resize-none"></textarea>
                                </div>
                                <Button className="w-full h-12 rounded-none bg-primary text-white tracking-[0.3em] uppercase text-[11px] hover:bg-primary/90">
                                    Submit Inquiry
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;
