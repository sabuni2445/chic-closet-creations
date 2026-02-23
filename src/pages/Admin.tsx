
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
                const productId = p.id;
                erp.addProduct({
                    id: productId,
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

                // Add variants for initial products
                ["S", "M", "L", "XL"].forEach(size => {
                    erp.addVariant({
                        id: crypto.randomUUID(),
                        product_id: productId,
                        sku: `${p.name.slice(0, 3).toUpperCase()}-${size}`,
                        size: size,
                        color: "Original",
                        created_at: new Date().toISOString()
                    });
                });
            });
        }
        // ... rest of employee setup remains ...
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
        if (erp.variants.length === 0) {
            toast.error("No product variants available to sell");
            return;
        }

        // Pick a random variant that has stock if possible
        const variantsWithStock = erp.variants.filter(v =>
            erp.batches.filter(b => b.product_variant_id === v.id).reduce((s, b) => s + b.quantity_remaining, 0) > 0
        );

        const sourceList = variantsWithStock.length > 0 ? variantsWithStock : erp.variants;
        const randomVariant = sourceList[Math.floor(Math.random() * sourceList.length)];
        const product = erp.products.find(p => p.id === randomVariant.product_id);

        if (!product) {
            toast.error("Product not found for variant");
            return;
        }

        const orderId = erp.processSale("Walk-in Customer", [
            { variantId: randomVariant.id, quantity: 1, price: product.selling_price }
        ]);

        if (orderId) {
            toast.success(`Mock Sale: ${product.name} (${randomVariant.size}/${randomVariant.color}) - Order #${orderId.slice(0, 8)}`);
        } else {
            toast.error("Process failed: Likely out of stock for this variant");
        }
    };

    const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        let images: string[] = [];
        const files = formData.getAll("images") as File[];
        if (files.length > 0 && files[0].name) {
            images = await Promise.all(
                files.map((file) => {
                    return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                })
            );
        } else {
            images = ["/placeholder.svg"];
        }

        const sizes = formData.getAll("sizes") as string[];

        const colorsRaw = (formData.get("colors") as string) || "";
        const colors = colorsRaw.split(",").map(c => c.trim()).filter(c => c !== "");

        const productId = crypto.randomUUID();
        const productName = (formData.get("name") as string) || "New Item";

        erp.addProduct({
            id: productId,
            name: productName,
            description: (formData.get("description") as string) || "",
            category_id: (formData.get("category") as string) || "General",
            brand_id: (formData.get("brand") as string) || "Rina's Boutique",
            selling_price: Number(formData.get("price")) || 0,
            images: images.length > 0 ? images : ["/placeholder.svg"],
            sizes: sizes.length > 0 ? sizes : ["OS"],
            colors: colors.length > 0 ? colors : ["Default"],
            is_active: true,
            created_at: new Date().toISOString()
        });

        // Generate Variants
        const activeSizes = sizes.length > 0 ? sizes : ["OS"];
        const activeColors = colors.length > 0 ? colors : ["Default"];

        activeSizes.forEach(size => {
            activeColors.forEach(color => {
                erp.addVariant({
                    id: crypto.randomUUID(),
                    product_id: productId,
                    sku: `${productName.slice(0, 3).toUpperCase()}-${size}-${color.slice(0, 3).toUpperCase()}`,
                    size,
                    color,
                    created_at: new Date().toISOString()
                });
            });
        });

        toast.success("Product and variants created successfully");
        (e.target as HTMLFormElement).reset();
    };

    const handleHireEmployee = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        erp.addEmployee({
            id: crypto.randomUUID(),
            name: (formData.get("name") as string) || "New Staff",
            role: (formData.get("role") as string) || "Staff",
            email: (formData.get("email") as string) || "",
            phone: (formData.get("phone") as string) || "",
            salary: Number(formData.get("salary")) || 0,
            status: "active",
            joined_date: new Date().toISOString(),
            address: (formData.get("address") as string) || "",
            national_id: (formData.get("national_id") as string) || "",
            emergency_contact_name: (formData.get("emergency_name") as string) || "",
            emergency_contact_phone: (formData.get("emergency_phone") as string) || "",
            guarantor_name: (formData.get("guarantor_name") as string) || "",
            guarantor_phone: (formData.get("guarantor_phone") as string) || "",
        });

        toast.success("New employee registered with full documentation");
        (e.target as HTMLFormElement).reset();
    };

    const menuItems = [
        { id: "overview", label: "Dashboard", icon: BarChart3 },
        { id: "products", label: "Product Catalog", icon: Tag },
        { id: "categories", label: "Categories & Brands", icon: Layers },
        { id: "inventory", label: "Inventory", icon: Package },
        { id: "sales", label: "Sales & Orders", icon: ShoppingCart },
        { id: "employees", label: "Employees", icon: Users },
        { id: "accounting", label: "Financials", icon: Receipt },
        { id: "workstation", label: "Staff Workspace", icon: Briefcase },
    ];

    const cleanDesc = (desc: string) => {
        const cleaned = desc.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '').replace(/\s+/g, ' ').trim();
        if (!cleaned || cleaned.length < 5) return desc.slice(0, 30) + "..."; // Fallback if too much was stripped
        if (cleaned.endsWith("for Invoice") || cleaned.endsWith("Order")) return desc.slice(0, 40) + "...";
        return cleaned;
    };

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
                                                        <TableCell className="text-xs font-semibold text-gray-700">
                                                            {(() => {
                                                                const v = erp.variants.find(varnt => varnt.id === t.product_variant_id);
                                                                const p = erp.products.find(prod => prod.id === v?.product_id);
                                                                return p ? `${p.name} (${v?.size})` : "Unknown Item";
                                                            })()}
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
                                            {erp.products.filter(p => {
                                                const pVars = erp.variants.filter(v => v.product_id === p.id);
                                                const totalStock = erp.batches.filter(b => pVars.some(v => v.id === b.product_variant_id)).reduce((s, b) => s + b.quantity_remaining, 0);
                                                return totalStock < 10 && totalStock > 0;
                                            }).slice(0, 3).map(p => {
                                                const pVars = erp.variants.filter(v => v.product_id === p.id);
                                                const totalStock = erp.batches.filter(b => pVars.some(v => v.id === b.product_variant_id)).reduce((s, b) => s + b.quantity_remaining, 0);
                                                return (
                                                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100/50">
                                                        <div className="p-2 bg-rose-200/50 text-rose-600 rounded-lg"><Package size={16} /></div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-rose-700">{p.name}</p>
                                                            <p className="text-[10px] text-rose-500 font-medium italic">Low stock: Only {totalStock} items across all variants</p>
                                                        </div>
                                                        <Button size="sm" variant="ghost" className="text-rose-700 hover:bg-rose-100">Restock</Button>
                                                    </div>
                                                );
                                            })}
                                            {erp.products.filter(p => {
                                                const pVars = erp.variants.filter(v => v.product_id === p.id);
                                                return erp.batches.filter(b => pVars.some(v => v.id === b.product_variant_id)).reduce((s, b) => s + b.quantity_remaining, 0) < 10;
                                            }).length === 0 && (
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
                                                        {erp.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Brand</Label>
                                                    <select name="brand" className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                                        {erp.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Description</Label>
                                                    <Textarea name="description" required placeholder="Describe the materials, style, and fit..." className="rounded-xl border-gray-100 bg-gray-50 px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all min-h-[50px]" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Selling Price ($)</Label>
                                                    <Input name="price" type="number" step="0.01" required placeholder="299.99" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 focus:ring-2 focus:ring-primary/20 transition-all font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Sizes (Select multiple)</Label>
                                                    <select name="sizes" multiple className="w-full h-[80px] rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                                        <option value="XXS">XXS</option>
                                                        <option value="XS">XS</option>
                                                        <option value="S">S</option>
                                                        <option value="M">M</option>
                                                        <option value="L">L</option>
                                                        <option value="XL">XL</option>
                                                        <option value="XXL">XXL</option>
                                                        <option value="OS">One Size (OS)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Images (Upload)</Label>
                                                <Input name="images" type="file" multiple accept="image/*" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer" />
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
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 px-1">Select Variant (Size/Color)</Label>
                                                <select name="variantId" className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                                                    {erp.variants.map(v => {
                                                        const p = erp.products.find(prod => prod.id === v.product_id);
                                                        return (
                                                            <option key={v.id} value={v.id}>
                                                                {p?.name} - {v.size} / {v.color} ({v.sku})
                                                            </option>
                                                        );
                                                    })}
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
                                            const variant = erp.variants.find(v => v.id === b.product_variant_id);
                                            const product = erp.products.find(p => p.id === variant?.product_id);
                                            return (
                                                <TableRow key={b.id} className="border-gray-50 h-16">
                                                    <TableCell className="font-mono text-[10px] text-gray-400">#{b.id.slice(0, 8)}</TableCell>
                                                    <TableCell className="text-sm">
                                                        <p className="font-bold text-gray-800">{product?.name || "Unknown Product"}</p>
                                                        <p className="text-[10px] text-gray-500">{variant?.size} / {variant?.color} - {variant?.sku}</p>
                                                    </TableCell>
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
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${invoice?.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                                }`}>
                                                                {invoice?.status || 'unpaid'}
                                                            </span>
                                                            {invoice?.status !== 'paid' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-[10px] px-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                                                                    onClick={() => {
                                                                        erp.processPayment(invoice!.id, invoice!.total_amount, "Cash");
                                                                        toast.success("Payment received successfully");
                                                                    }}
                                                                >
                                                                    Received
                                                                </Button>
                                                            )}
                                                        </div>
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

                    {/* CATEGORIES & BRANDS VIEW */}
                    {activeView === "categories" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Categories & Brands</h1>
                                    <p className="text-gray-500 text-sm mt-1">Manage global product taxonomy dynamically.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Categories Section */}
                                <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-bold">Categories</h2>
                                        <form className="flex gap-2" onSubmit={(e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.currentTarget);
                                            const val = fd.get("catName") as string;
                                            if (val) { erp.addCategory({ id: val, name: val }); e.currentTarget.reset(); }
                                        }}>
                                            <Input name="catName" placeholder="New Category" className="h-9 w-40 text-sm" required />
                                            <Button type="submit" size="sm" className="bg-primary text-white h-9 shadow-sm">Add</Button>
                                        </form>
                                    </div>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {erp.categories.map(c => (
                                            <div key={c.id} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                                                <span className="font-bold text-gray-700 text-sm">{c.name}</span>
                                                <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-50 h-8 w-8 p-0" onClick={() => erp.deleteCategory(c.id)}>
                                                    <XCircle size={16} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                {/* Brands Section */}
                                <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-bold">Brands</h2>
                                        <form className="flex gap-2" onSubmit={(e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.currentTarget);
                                            const val = fd.get("brandName") as string;
                                            if (val) { erp.addBrand({ id: val, name: val }); e.currentTarget.reset(); }
                                        }}>
                                            <Input name="brandName" placeholder="New Brand" className="h-9 w-40 text-sm" required />
                                            <Button type="submit" size="sm" className="bg-primary text-white h-9 shadow-sm">Add</Button>
                                        </form>
                                    </div>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {erp.brands.map(b => (
                                            <div key={b.id} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                                                <span className="font-bold text-gray-700 text-sm">{b.name}</span>
                                                <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-50 h-8 w-8 p-0" onClick={() => erp.deleteBrand(b.id)}>
                                                    <XCircle size={16} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
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
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                                            <Plus size={18} className="mr-2" /> Hire New Staff
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                                        <div className="bg-primary p-6 text-white sticky top-0 z-10">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold">New Staff Registration</DialogTitle>
                                                <DialogDescription className="text-white/60 text-xs text-left">Record personal, contact, and legal guarantee information.</DialogDescription>
                                            </DialogHeader>
                                        </div>
                                        <form onSubmit={handleHireEmployee} className="p-8 space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2">Basic Information</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Full Name</Label>
                                                        <Input name="name" required placeholder="Employee Name" className="rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Role</Label>
                                                        <select name="role" className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                                                            <option value="Sales Stylist">Sales Stylist (Boutique Floor)</option>
                                                            <option value="Inventory Manager">Inventory Manager (Stock & Batches)</option>
                                                            <option value="Store Manager">Store Manager (Operations)</option>
                                                            <option value="Tailor">Master Tailor (Atelier/Fitting)</option>
                                                            <option value="Cashier">Cashier (Finance)</option>
                                                            <option value="Social Media">Social Media Specialist</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Email Address</Label>
                                                        <Input name="email" type="email" placeholder="staff@rinas.com" className="rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Phone Number</Label>
                                                        <Input name="phone" required placeholder="+251 ..." className="rounded-xl" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Monthly Salary ($)</Label>
                                                        <Input name="salary" type="number" required placeholder="0.00" className="rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">National ID / Kebele Card</Label>
                                                        <Input name="national_id" required placeholder="ID Number" className="rounded-xl" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400">Physical Home Address</Label>
                                                    <Input name="address" required placeholder="Sub-city, House Number, etc." className="rounded-xl" />
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4">
                                                <h3 className="text-xs font-black uppercase text-rose-500 tracking-widest border-b pb-2">Guarantee & Emergency</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Emergency Contact Name</Label>
                                                        <Input name="emergency_name" required placeholder="Name of Relative" className="rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Emergency Contact Phone</Label>
                                                        <Input name="emergency_phone" required placeholder="+251 ..." className="rounded-xl" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Guarantor Full Name</Label>
                                                        <Input name="guarantor_name" required placeholder="Person standing for them" className="rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Guarantor Phone</Label>
                                                        <Input name="guarantor_phone" required placeholder="+251 ..." className="rounded-xl" />
                                                    </div>
                                                </div>
                                            </div>

                                            <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 mt-4">Complete Hiring & Save Documents</Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
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
                                    <h1 className="text-2xl font-bold text-gray-900">Financial Performance</h1>
                                    <p className="text-gray-500 text-sm mt-1">Real-time profit & loss summary and full audit trail.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="rounded-lg h-9 bg-white border-gray-100 shadow-sm text-xs px-4">Export Report</Button>
                                    <Button variant="outline" className="rounded-lg h-9 bg-white border-gray-100 shadow-sm text-xs px-4 font-bold text-primary">Fiscal Settings</Button>
                                </div>
                            </div>

                            {/* Dashboard Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total Sales (Cash)</p>
                                    <p className="text-2xl font-bold text-emerald-600 mt-2">${totalRevenue.toLocaleString()}</p>
                                    <p className="text-[9px] text-gray-400 mt-1 italic">Money received in hand</p>
                                </Card>
                                <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Pending (Unpaid)</p>
                                    <p className="text-2xl font-bold text-amber-500 mt-2">
                                        ${erp.orders
                                            .filter(o => !erp.invoices.find(inv => inv.order_id === o.id && inv.status === 'paid'))
                                            .reduce((sum, o) => sum + o.total_amount, 0).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] text-gray-400 mt-1 italic">Sold but not yet received</p>
                                </Card>
                                <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total COGS</p>
                                    <p className="text-2xl font-bold text-rose-500 mt-2">
                                        ${erp.journalEntries
                                            .flatMap(e => e.items)
                                            .filter(i => i.account_name === 'Cost of Goods Sold')
                                            .reduce((sum, i) => sum + i.debit, 0).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] text-gray-400 mt-1 italic">What you paid for sold items</p>
                                </Card>
                                <Card className="border-none shadow-sm rounded-2xl bg-primary/5 border-primary/10 p-6">
                                    <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Net Profit</p>
                                    <p className="text-2xl font-black text-primary mt-2">
                                        ${(totalRevenue - erp.journalEntries
                                            .flatMap(e => e.items)
                                            .filter(i => i.account_name === 'Cost of Goods Sold')
                                            .reduce((sum, i) => sum + i.debit, 0)).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] text-primary/60 mt-1 italic">Actual money earned</p>
                                </Card>
                            </div>

                            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="border-b border-gray-50 px-8 py-6">
                                    <CardTitle className="text-lg font-bold text-gray-800">Complete Transaction History</CardTitle>
                                </CardHeader>
                                <div className="p-0 overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow className="border-none">
                                                <TableHead className="text-[10px] uppercase text-gray-400 pl-8">Entry Date</TableHead>
                                                <TableHead className="text-[10px] uppercase text-gray-400">Description</TableHead>
                                                <TableHead className="text-[10px] uppercase text-gray-400">Account Movements</TableHead>
                                                <TableHead className="text-[10px] uppercase text-gray-400 text-right pr-8">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {erp.journalEntries.slice().reverse().map((entry) => (
                                                <TableRow key={entry.id} className="border-gray-50 h-20 hover:bg-gray-50/30 transition-colors">
                                                    <TableCell className="pl-8">
                                                        <p className="text-xs font-bold text-gray-900">{new Date(entry.date).toLocaleDateString()}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">#{entry.id.slice(0, 6)}</p>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px]">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{cleanDesc(entry.description)}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            {entry.items.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-[10px] gap-8">
                                                                    <span className={item.credit > 0 ? "pl-4 text-gray-400" : "font-bold text-gray-600"}>
                                                                        {item.account_name}
                                                                    </span>
                                                                    <span className={item.debit > 0 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                                                                        {item.debit > 0 ? `+$${item.debit.toLocaleString()}` : `-$${item.credit.toLocaleString()}`}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-8">
                                                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase border border-emerald-100">Synchronized</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {erp.journalEntries.length === 0 && (
                                                <TableRow><TableCell colSpan={4} className="text-center py-20 text-gray-400 italic">No financial activity recorded yet</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* STAFF WORKSTATION VIEW */}
                    {activeView === "workstation" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Boutique floor</h1>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Active Station: Front Desk</p>
                                </div>
                                <div className="flex-1 max-w-md relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors" size={18} />
                                    <Input
                                        placeholder="Search catalog or SKU for a customer..."
                                        className="h-12 w-full pl-12 rounded-2xl bg-gray-50 border-none shadow-inner focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleMockSale} className="h-12 px-6 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.05] transition-transform">
                                        <ShoppingCart size={18} className="mr-2" /> Quick Sale
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* Floor Collections */}
                                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {erp.products.slice(0, 6).map(product => {
                                        const pVars = erp.variants.filter(v => v.product_id === product.id);
                                        const totalStock = erp.batches.filter(b => pVars.some(v => v.id === b.product_variant_id)).reduce((s, b) => s + b.quantity_remaining, 0);
                                        return (
                                            <Card key={product.id} className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white p-5 group hover:shadow-xl hover:shadow-primary/5 transition-all">
                                                <div className="flex gap-5">
                                                    <div className="h-28 w-28 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
                                                        <img src={product.images?.[0] || "/placeholder.svg"} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                    <div className="flex-1 py-1">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1 block">{product.category_id}</span>
                                                        <h3 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h3>
                                                        <p className="text-xs text-gray-400 font-medium mb-3">Price: <span className="text-gray-900 font-bold">${product.selling_price}</span></p>

                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-1.5 w-1.5 rounded-full ${totalStock > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                                                            <span className="text-[10px] font-black text-gray-700 uppercase">{totalStock > 0 ? `${totalStock} in stock` : 'Out of Stock'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-5 grid grid-cols-2 gap-3">
                                                    <Button variant="outline" className="rounded-xl h-10 text-[10px] font-bold border-gray-100 uppercase tracking-widest hover:bg-primary hover:text-white transition-colors">Details</Button>
                                                    <Button variant="outline" className="rounded-xl h-10 text-[10px] font-bold border-gray-100 uppercase tracking-widest hover:border-primary hover:text-primary">Sizes</Button>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {/* Staff Sidebar */}
                                <div className="space-y-6">
                                    <Card className="border-none shadow-sm rounded-3xl bg-[#1A1C1E] text-white p-6 relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/20 rounded-full blur-3xl" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Staff Feed</h4>
                                        <div className="space-y-4">
                                            {erp.orders.slice(-4).reverse().map(o => (
                                                <div key={o.id} className="flex flex-col gap-1 p-3 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-white/40">OD-{o.id.slice(0, 6)}</span>
                                                        <span className="text-[10px] font-black text-primary">${o.total_amount}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-white/80">{o.customer_id}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card className="border-none shadow-sm rounded-3xl bg-white p-6 border border-gray-100">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 text-center">System Tasks</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 text-emerald-700">
                                                <CheckCircle2 size={16} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Pricing Sync OK</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 text-amber-700">
                                                <Package size={16} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Inventory Check</span>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
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
