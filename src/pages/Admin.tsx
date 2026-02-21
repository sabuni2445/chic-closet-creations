
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useERPStore } from "@/hooks/use-erp-store";
import {
    BarChart3, Box, ShoppingCart, Receipt,
    Plus, History, Wallet, TrendingUp,
    ArrowDownCircle, ArrowUpCircle, Users,
    Settings, LogOut, Package, Image as ImageIcon,
    CheckCircle2, XCircle, Mail, Phone, Briefcase,
    ChevronRight, Search, Bell, Layers, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { products as initialProducts } from "@/data/products";
import logo from "@/assets/logo.png";

const Admin = () => {
    const erp = useERPStore();
    const [activeView, setActiveView] = useState("overview");

    // Mock initial setup if empty
    useMemo(() => {
        if (erp.products.length === 0) {
            initialProducts.forEach(p => {
                erp.addProduct({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    category_id: p.category,
                    brand_id: "Rina's Boutique",
                    selling_price: p.price,
                    images: [p.image],
                    sizes: ["S", "M", "L", "XL"],
                    colors: ["Original"],
                    is_active: true,
                    created_at: new Date().toISOString()
                });
            });
        }

        if (erp.employees.length === 0) {
            erp.addEmployee({
                id: "1",
                name: "Sebrina K.",
                role: "Founder & Creative Director",
                email: "sebrina@rinascloset.com",
                phone: "+251 911 223 344",
                salary: 5000,
                status: "active",
                joined_date: "2024-01-10"
            });
            erp.addEmployee({
                id: "2",
                name: "Hanna T.",
                role: "Store Manager",
                email: "hanna@rinascloset.com",
                phone: "+251 922 334 455",
                salary: 2500,
                status: "active",
                joined_date: "2024-02-15"
            });
        }
    }, []);

    const totalRevenue = erp.getTotalRevenue();
    const totalCOGS = erp.getTotalCOGS();
    const inventoryValue = erp.getInventoryValue();
    const netProfit = totalRevenue - totalCOGS;

    const handleAddStock = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        erp.addBatch({
            product_variant_id: formData.get("variantId") as string,
            quantity_remaining: Number(formData.get("quantity")),
            unit_cost: Number(formData.get("cost")),
            purchase_date: new Date().toISOString()
        });
        toast.success("Stock batch added successfully");
        (e.target as HTMLFormElement).reset();
    };

    const handleMockSale = () => {
        if (erp.products.length === 0) {
            toast.error("No products available to sell");
            return;
        }
        const randomProduct = erp.products[Math.floor(Math.random() * erp.products.length)];
        const orderId = erp.processSale("Walk-in Customer", [
            { variantId: randomProduct.id, quantity: 1, price: randomProduct.selling_price }
        ]);

        if (orderId) {
            toast.success(`Mock Sale recorded: Order #${orderId.slice(0, 8)}`);
        } else {
            toast.error("Process failed: Likely out of stock");
        }
    };

    const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const imagesRaw = (formData.get("images") as string) || "";
        const images = imagesRaw.split(",").map(i => i.trim()).filter(i => i !== "");

        const sizesRaw = (formData.get("sizes") as string) || "";
        const sizes = sizesRaw.split(",").map(s => s.trim().toUpperCase()).filter(s => s !== "");

        const colorsRaw = (formData.get("colors") as string) || "";
        const colors = colorsRaw.split(",").map(c => c.trim()).filter(c => c !== "");

        erp.addProduct({
            id: crypto.randomUUID(),
            name: (formData.get("name") as string) || "New Item",
            description: (formData.get("description") as string) || "",
            category_id: (formData.get("category") as string) || "General",
            brand_id: "Rina's Boutique",
            selling_price: Number(formData.get("price")) || 0,
            images: images.length > 0 ? images : ["/placeholder.svg"],
            sizes: sizes.length > 0 ? sizes : ["OS"],
            colors: colors.length > 0 ? colors : ["Default"],
            is_active: true,
            created_at: new Date().toISOString()
        });

        toast.success("New product added to catalog");
        (e.target as HTMLFormElement).reset();
    };

    const menuItems = [
        { id: "overview", label: "Dashboard", icon: BarChart3 },
        { id: "products", label: "Product Catalog", icon: Tag },
        { id: "inventory", label: "Inventory", icon: Package },
        { id: "sales", label: "Sales & Orders", icon: ShoppingCart },
        { id: "employees", label: "Employees", icon: Users },
        { id: "accounting", label: "Financials", icon: Receipt },
    ];

    return (
        <div className="flex h-screen bg-[#F8F9FA] overflow-hidden font-sans">
            {/* PROFESSIONAL SIDEBAR */}
            <aside className="w-64 bg-[#1A1C1E] text-white flex flex-col shadow-2xl z-50">
                <div className="p-8 flex flex-col items-center">
                    <img src={logo} className="h-16 w-16 rounded-full mb-4 border-2 border-primary/20 p-1 mix-blend-screen" />
                    <h2 className="text-sm font-display tracking-[0.3em] uppercase text-primary font-bold">Rina's Atelier</h2>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Management Suite</span>
                </div>

                <nav className="flex-1 mt-4 px-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm transition-all duration-200 group ${activeView === item.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <item.icon size={18} className={activeView === item.id ? "text-white" : "text-white/40 group-hover:text-white"} />
                            <span className="font-medium">{item.label}</span>
                            {activeView === item.id && <ChevronRight size={14} className="ml-auto opacity-60" />}
                        </button>
                    ))}
                </nav>

                <div className="p-6 mt-auto border-t border-white/5">
                    <Link to="/" className="flex items-center gap-3 text-white/40 hover:text-white text-sm transition-colors group">
                        <LogOut size={16} />
                        <span>Return to Boutique</span>
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* TOP BAR */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-40">
                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 w-96">
                        <Search size={16} className="text-gray-400" />
                        <input type="text" placeholder="Search transactions, products, or employees..." className="bg-transparent text-sm focus:outline-none w-full text-gray-600" />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative text-gray-500 hover:text-primary transition-colors">
                            <Bell size={20} />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">3</span>
                        </button>
                        <div className="h-8 w-px bg-gray-200" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-800">Admin User</p>
                                <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">System Administrator</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                                AU
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
                    {/* DASHBOARD VIEW */}
                    {activeView === "overview" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Executive Summary</h1>
                                    <p className="text-gray-500 text-sm mt-1">Real-time performance metrics and business health.</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="rounded-lg border-gray-200" onClick={() => erp.setCostMethod(erp.costMethod === 'FIFO' ? 'LIFO' : 'FIFO')}>
                                        Valuation: {erp.costMethod}
                                    </Button>
                                    <Button onClick={handleMockSale} className="rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                                        Simulate Sale
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: "Inventory Value", value: inventoryValue, icon: Box, color: "text-blue-600", bg: "bg-blue-50" },
                                    { label: "Total Revenue", value: totalRevenue, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                                    { label: "Cost (COGS)", value: totalCOGS, icon: ArrowDownCircle, color: "text-rose-600", bg: "bg-rose-50" },
                                    { label: "Net Profit", value: netProfit, icon: Wallet, color: "text-primary", bg: "bg-primary/5" },
                                ].map((stat, i) => (
                                    <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                                <stat.icon size={18} />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-3xl font-bold text-gray-900">${stat.value.toLocaleString()}</p>
                                            <div className="mt-2 text-[10px] text-gray-400 font-medium">Updated 2 minutes ago</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold text-gray-800">Recent Movements</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 px-6 pb-6">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-gray-50 border-none">
                                                    <TableHead className="text-[10px] uppercase text-gray-400">Date</TableHead>
                                                    <TableHead className="text-[10px] uppercase text-gray-400">Type</TableHead>
                                                    <TableHead className="text-[10px] uppercase text-gray-400">Variant</TableHead>
                                                    <TableHead className="text-[10px] uppercase text-gray-400 text-right">Qty</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {erp.transactions.slice(-6).reverse().map((t) => (
                                                    <TableRow key={t.id} className="border-gray-50">
                                                        <TableCell className="text-xs text-gray-600">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${t.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                {t.type}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-xs font-semibold text-gray-700 capitalize">
                                                            {erp.products.find(p => p.id === t.product_variant_id)?.name || "Variant Item"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-gray-900 text-xs">
                                                            {t.quantity}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {erp.transactions.length === 0 && (
                                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-gray-400 text-sm">No recent movements</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                <div className="space-y-6">
                                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-primary text-white">
                                        <CardHeader>
                                            <CardDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Growth Metric</CardDescription>
                                            <CardTitle className="text-3xl font-bold mt-1">+12.5%</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-white/80">Profit margin currently performing above industry average for boutique luxury retail.</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                                        <CardHeader>
                                            <CardTitle className="text-base font-bold text-gray-800">Operational Alerts</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {erp.products.filter(p => erp.batches.filter(b => b.product_variant_id === p.id).reduce((s, b) => s + b.quantity_remaining, 0) < 5).slice(0, 3).map(p => (
                                                <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100/50">
                                                    <div className="p-2 bg-rose-200/50 text-rose-600 rounded-lg"><Package size={16} /></div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-rose-700">{p.name}</p>
                                                        <p className="text-[10px] text-rose-500 font-medium italic">Critical low stock: Only {erp.batches.filter(b => b.product_variant_id === p.id).reduce((s, b) => s + b.quantity_remaining, 0)} items remaining</p>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="text-rose-700 hover:bg-rose-100">Restock</Button>
                                                </div>
                                            ))}
                                            {erp.products.filter(p => erp.batches.filter(b => b.product_variant_id === p.id).reduce((s, b) => s + b.quantity_remaining, 0) < 5).length === 0 && (
                                                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <CheckCircle2 size={16} />
                                                    <p className="text-xs font-bold">All stock levels healthy</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRODUCTS VIEW */}
                    {activeView === "products" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
                                    <p className="text-gray-500 text-sm mt-1">Add and manage your luxury collection details.</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                                            <Plus size={18} className="mr-2" /> Add New Item
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                                        <div className="bg-primary p-6 text-white">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold">Catalog New Collection</DialogTitle>
                                                <DialogDescription className="text-white/60 text-xs text-left">Enter full details for the new product listing.</DialogDescription>
                                            </DialogHeader>
                                        </div>
                                        <form onSubmit={handleAddProduct} className="p-8 space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Product Name</Label>
                                                    <Input name="name" required placeholder="e.g. Silk Evening Dress" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Category</Label>
                                                    <select name="category" className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                                        <option>Evening</option>
                                                        <option>Cocktail</option>
                                                        <option>Bridal</option>
                                                        <option>Casual</option>
                                                        <option>Summer</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Description</Label>
                                                <Textarea name="description" required placeholder="Describe the materials, style, and fit..." className="rounded-xl border-gray-100 bg-gray-50 px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Selling Price ($)</Label>
                                                    <Input name="price" type="number" step="0.01" required placeholder="299.99" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 focus:ring-2 focus:ring-primary/20 transition-all font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Sizes (Comma separated)</Label>
                                                    <Input name="sizes" required placeholder="S, M, L, XL" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 focus:ring-2 focus:ring-primary/20 transition-all" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Image URLs (Comma separated)</Label>
                                                <Input name="images" required placeholder="https://image1.jpg, https://image2.jpg" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Material/Colors (Comma separated)</Label>
                                                <Input name="colors" required placeholder="Satin Pink, Emerald Silk" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 focus:ring-2 focus:ring-primary/20 transition-all" />
                                            </div>
                                            <Button type="submit" className="w-full h-14 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 text-lg">Save to Product Registry</Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {erp.products.map(product => (
                                    <Card key={product.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow group">
                                        <div className="relative h-64 overflow-hidden bg-gray-100">
                                            <img src={product.images?.[0] || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                                                <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full text-gray-800 shadow-sm border border-gray-200/50 uppercase tracking-widest">{product.category_id}</span>
                                            </div>
                                        </div>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-800 text-lg leading-tight">{product.name}</h3>
                                                <p className="text-primary font-bold text-xl">${product.selling_price}</p>
                                            </div>
                                            <p className="text-gray-500 text-xs line-clamp-2 mb-4 leading-relaxed">{product.description}</p>

                                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Available Sizes</span>
                                                    <div className="flex gap-1.5 flex-wrap justify-end">
                                                        {(product.sizes || []).map(s => <span key={s} className="w-6 h-6 flex items-center justify-center text-[10px] font-bold border border-gray-100 rounded bg-gray-50 text-gray-600">{s}</span>)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Stock Control</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-xs font-bold text-gray-700 capitalize">Active Listing</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {erp.products.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                        <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-gray-400 font-medium">No products in your digital atelier yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* INVENTORY VIEW */}
                    {activeView === "inventory" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                                    <p className="text-gray-500 text-sm mt-1">Track stock batches, unit costs, and warehouse movements.</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                                            <Plus size={18} className="mr-2" /> Purchase New Batch
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-2xl border-none shadow-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold">New Inventory Inbound</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddStock} className="space-y-6 pt-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 px-1">Select Product SKU</Label>
                                                <select name="variantId" className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                                                    {erp.products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 px-1">Total Quantity</Label>
                                                    <Input name="quantity" type="number" required placeholder="0" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 focus:ring-2 focus:ring-primary/20 transition-all" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 px-1">Unit Cost ($)</Label>
                                                    <Input name="cost" type="number" step="0.01" required placeholder="0.00" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 focus:ring-2 focus:ring-primary/20 transition-all" />
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20">Record Inbound Batch</Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total Active Batches</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{erp.batches.filter(b => b.quantity_remaining > 0).length}</p>
                                </Card>
                                <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Low Stock SKUs</p>
                                    <p className="text-2xl font-bold text-rose-500 mt-2">{erp.products.filter(p => erp.batches.filter(b => b.product_variant_id === p.id).reduce((s, b) => s + b.quantity_remaining, 0) < 5).length}</p>
                                </Card>
                                <Card className="border-none shadow-sm rounded-2xl bg-white p-6 md:col-span-2">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Global Asset Value</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">${inventoryValue.toLocaleString()}</p>
                                </Card>
                            </div>

                            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white px-6 py-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-50 border-none">
                                            <TableHead className="text-[10px] uppercase text-gray-400">Batch ID</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Product</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Purchased</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 px-6">Cost</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-center">Remaining</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-right">Valuation</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {erp.batches.slice().reverse().map((b) => {
                                            const product = erp.products.find(p => p.id === b.product_variant_id);
                                            return (
                                                <TableRow key={b.id} className="border-gray-50 h-16">
                                                    <TableCell className="font-mono text-[10px] text-gray-400">#{b.id.slice(0, 8)}</TableCell>
                                                    <TableCell className="font-bold text-gray-800 text-sm">{product?.name || "Unknown SKU"}</TableCell>
                                                    <TableCell className="text-xs text-gray-500">{new Date(b.purchase_date).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-xs font-semibold text-gray-600 px-6">${b.unit_cost.toFixed(2)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className={`h-1.5 w-1.5 rounded-full ${b.quantity_remaining > 5 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                            <span className="font-bold text-gray-900 text-sm">{b.quantity_remaining}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-gray-900 text-sm">
                                                        ${(b.quantity_remaining * b.unit_cost).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {erp.batches.length === 0 && (
                                            <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">No inventory batches recorded</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}

                    {/* SALES VIEW */}
                    {activeView === "sales" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Sales & Orders</h1>
                                    <p className="text-gray-500 text-sm mt-1">Monitor order history and revenue realization.</p>
                                </div>
                                <div className="flex gap-3">
                                    <Card className="border-none shadow-sm rounded-lg flex items-center gap-4 px-6 py-2 bg-white">
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase font-bold text-gray-400">Total Orders</p>
                                            <p className="text-lg font-bold text-gray-900">{erp.orders.length}</p>
                                        </div>
                                        <div className="h-8 w-px bg-gray-100" />
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase font-bold text-gray-400">Cash In</p>
                                            <p className="text-lg font-bold text-emerald-600">${totalRevenue.toLocaleString()}</p>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white px-6 py-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-50 border-none">
                                            <TableHead className="text-[10px] uppercase text-gray-400">Order ID</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Customer</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Date</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-center">Payment Status</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-right">Order Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {erp.orders.slice().reverse().map((o) => {
                                            const invoice = erp.invoices.find(inv => inv.order_id === o.id);
                                            return (
                                                <TableRow key={o.id} className="border-gray-50 h-16">
                                                    <TableCell className="font-mono text-[10px] text-gray-400">OD-{o.id.slice(0, 8)}</TableCell>
                                                    <TableCell className="text-sm font-semibold text-gray-700">{o.customer_id}</TableCell>
                                                    <TableCell className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${invoice?.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                            }`}>
                                                            {invoice?.status || 'unpaid'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-gray-900 text-sm">
                                                        ${o.total_amount.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {erp.orders.length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">No sales recorded yet</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}

                    {/* EMPLOYEES VIEW */}
                    {activeView === "employees" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                                    <p className="text-gray-500 text-sm mt-1">Manage staff roles, payroll, and performance.</p>
                                </div>
                                <Button className="rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                                    <Plus size={18} className="mr-2" /> Hire New Staff
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: "Headcount", value: erp.employees.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                                    { label: "Active Roles", value: "3", icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
                                    { label: "Monthly Payroll", value: `$${erp.employees.reduce((sum, e) => sum + e.salary, 0).toLocaleString()}`, icon: Receipt, color: "text-primary", bg: "bg-primary/5" },
                                ].map((stat, i) => (
                                    <Card key={i} className="border-none shadow-sm rounded-2xl bg-white">
                                        <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                            </div>
                                            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                                <stat.icon size={20} />
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>

                            <Card className="border-none shadow-sm rounded-2xl overflow-hidden p-6 bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-50 border-none">
                                            <TableHead className="text-[10px] uppercase text-gray-400">Employee</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Role</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Contact</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-center">Status</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {erp.employees.map((emp) => (
                                            <TableRow key={emp.id} className="border-gray-50 group h-16">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 text-xs shadow-inner uppercase">
                                                            {(emp.name || "U").split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800">{emp.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium">Joined {new Date(emp.joined_date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold text-gray-600 capitalize">
                                                    {emp.role}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-primary cursor-pointer transition-colors">
                                                            <Mail size={10} className="text-gray-400" /> {emp.email}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                            <Phone size={10} className="text-gray-400" /> {emp.phone}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {emp.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-500" onClick={() => erp.updateEmployeeStatus(emp.id, emp.status === 'active' ? 'inactive' : 'active')}>
                                                            {emp.status === 'active' ? <XCircle size={14} /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400">
                                                            <Settings size={14} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}

                    {/* ACCOUNTING VIEW */}
                    {activeView === "accounting" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Financial Ledger</h1>
                                    <p className="text-gray-500 text-sm mt-1">Audit-ready double-entry logic for full financial transparency.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="rounded-lg h-9 bg-white border-gray-100 shadow-sm text-xs px-4">Ledger Export</Button>
                                    <Button variant="outline" className="rounded-lg h-9 bg-white border-gray-100 shadow-sm text-xs px-4 font-bold text-primary">Trial Balance</Button>
                                </div>
                            </div>

                            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white p-8">
                                <div className="space-y-10">
                                    {erp.journalEntries.slice().reverse().map((entry) => (
                                        <div key={entry.id} className="relative pl-8 border-l-2 border-gray-50 last:pb-0 pb-10">
                                            <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-white border-4 border-gray-100 group-hover:border-primary transition-colors" />
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded uppercase tracking-widest">{new Date(entry.date).toLocaleDateString()}</span>
                                                    <h4 className="text-base font-bold text-gray-800 leading-none">{entry.description}</h4>
                                                </div>
                                                <span className="text-[9px] bg-gray-50 text-gray-400 px-3 py-1 rounded-full border border-gray-200 uppercase tracking-tighter font-bold font-mono">#{entry.id.slice(0, 6)}</span>
                                            </div>
                                            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="border-none hover:bg-transparent h-8">
                                                            <TableHead className="text-[9px] uppercase font-bold text-gray-400 italic">Account Title</TableHead>
                                                            <TableHead className="text-[9px] uppercase font-bold text-gray-400 text-right">Debit</TableHead>
                                                            <TableHead className="text-[9px] uppercase font-bold text-gray-400 text-right">Credit</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {entry.items.map((item, idx) => (
                                                            <TableRow key={idx} className="border-none hover:bg-transparent h-10">
                                                                <TableCell className={`py-1 text-sm ${item.credit > 0 ? 'pl-8 text-gray-500' : 'font-bold text-gray-700'}`}>{item.account_name}</TableCell>
                                                                <TableCell className="py-1 text-right text-xs font-mono font-bold text-emerald-600">{item.debit > 0 ? `$${item.debit.toLocaleString()}` : '-'}</TableCell>
                                                                <TableCell className="py-1 text-right text-xs font-mono font-bold text-rose-500">{item.credit > 0 ? `$${item.credit.toLocaleString()}` : '-'}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))}
                                    {erp.journalEntries.length === 0 && (
                                        <div className="py-20 text-center text-gray-400 font-medium">Your general ledger is empty. Start transactions to see entries.</div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* SETTINGS VIEW */}
                    {activeView === "settings" && (
                        <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
                            <div className="p-8 bg-white rounded-[40px] shadow-2xl shadow-primary/5 max-w-lg">
                                <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-8 mx-auto rotate-3">
                                    <Settings size={40} className="animate-spin-slow" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">System Atelier</h2>
                                <p className="text-sm text-gray-500 mt-4 leading-relaxed font-medium">Your boutique ERP core is fully operational and syncing in real-time. System settings and workstation configurations are restricted during active fiscal periods.</p>
                                <div className="mt-10 grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Last Sync</p>
                                        <p className="text-xs font-bold text-gray-700">12 SEC AGO</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Server Latency</p>
                                        <p className="text-xs font-bold text-emerald-500">OPTIMAL (1ms)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Admin;
