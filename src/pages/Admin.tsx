
import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useERPStore } from "@/hooks/use-erp-store";
import { useAuthStore } from "@/hooks/use-auth-store";
import {
    BarChart3, Box, ShoppingCart, Receipt,
    Plus, History, Wallet, TrendingUp,
    ArrowDownCircle, ArrowUpCircle, Users,
    Settings, LogOut, Package, Image as ImageIcon,
    CheckCircle2, XCircle, Mail, Phone, Briefcase,
    ChevronRight, Search, Bell, Layers, Tag, Trash2, Edit2, Lock, FileText, Calendar, ShieldCheck, RefreshCw
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { products as initialProducts } from "@/data/products";
import logo from "@/assets/logo.png";

const Admin = () => {
    const erp = useERPStore();
    const auth = useAuthStore();
    const [activeView, setActiveView] = useState("overview");
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedInventoryProduct, setSelectedInventoryProduct] = useState<string>("");
    const [editingProduct, setEditingProduct] = useState<any>(null);

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
                    brand_id: "Rinas Closet",
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
                department: "management",
                email: "sebrina@rinascloset.com",
                phone: "+251 911 223 344",
                salary: 5000,
                status: "active",
                joined_date: "2024-01-10",
                username: "sebrina.k",
                password: "password123"
            });
            erp.addEmployee({
                id: "2",
                name: "Hanna T.",
                role: "Store Manager",
                department: "sales",
                email: "hanna@rinascloset.com",
                phone: "+251 922 334 455",
                salary: 2500,
                status: "active",
                joined_date: "2024-02-15",
                username: "hanna.t",
                password: "password123"
            });
        }
    }, [erp.employees.length]);

    // Automatic Migration: Ensure all legacy employees have credentials & exist in Auth Store
    useEffect(() => {
        erp.employees.forEach(emp => {
            const username = emp.username || emp.name.toLowerCase().split(' ').join('.');
            const password = emp.password || "password123";

            // If missing credentials in ERP, update them
            if (!emp.username || !emp.password) {
                erp.updateEmployee(emp.id, {
                    username,
                    password
                });
            }

            // Always sync to Auth Store "users table"
            auth.addUser({
                id: emp.id,
                name: emp.name,
                email: emp.email,
                phone: emp.phone,
                username: username,
                password: password,
                role: emp.role,
                created_at: emp.joined_date
            });
        });
    }, [erp.employees]);


    const accrualRevenue = erp.getTotalRevenue();
    const cashRevenue = erp.getCashReceived();
    const totalCOGS = erp.getTotalCOGS();
    const inventoryValue = erp.getInventoryValue();
    const netProfit = accrualRevenue - totalCOGS;

    const handleAddStock = (e: React.FormEvent<HTMLFormElement>) => {
        if (erp.isPeriodLocked) {
            toast.error("Fiscal Period is Locked. Adjustments restricted.");
            return;
        }
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const variantId = formData.get("variantId") as string;
        const sellingPrice = Number(formData.get("sellingPrice"));

        // Update product selling price
        const variant = erp.variants.find(v => v.id === variantId);
        if (variant) {
            erp.updateProduct(variant.product_id, { selling_price: sellingPrice });
        }

        erp.addBatch({
            product_variant_id: variantId,
            location_id: (formData.get("locationId") as string) || "main",
            quantity_remaining: Number(formData.get("quantity")),
            unit_cost: Number(formData.get("cost")),
            purchase_date: new Date().toISOString()
        });
        toast.success("Stock batch added and selling price updated");
        setSelectedInventoryProduct("");
        (e.target as HTMLFormElement).reset();
    };

    const [selectedQuickSaleVariant, setSelectedQuickSaleVariant] = useState<string>("");

    const handleQuickCheckout = (e: React.FormEvent<HTMLFormElement>) => {
        if (erp.isPeriodLocked) {
            toast.error("Fiscal Period is Locked. Sales suspended.");
            return;
        }
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const variantId = fd.get("variantId") as string;
        const qty = Number(fd.get("quantity") || 1);
        const customerName = (fd.get("customerName") as string) || "Walk-in Customer";

        const variant = erp.variants.find(v => v.id === variantId);
        const product = erp.products.find(p => p.id === variant?.product_id);

        if (!variant || !product) {
            toast.error("Selection error. Please check product details.");
            return;
        }

        const successId = erp.processSale(customerName, [
            { variantId, quantity: qty, price: product.selling_price }
        ]);

        if (successId) {
            toast.success(`Checkout Complete: ${product.name} handed to ${customerName}.`);
            setSelectedQuickSaleVariant("");
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error("Checkout Failed: Insufficient stock for this size/color.");
        }
    };

    const handleMockSale = () => {
        // Keep as a fallback or remove, but let's keep it for compatibility if referenced elsewhere
        if (erp.isPeriodLocked) return;
        const variantsWithStock = erp.variants.filter(v =>
            erp.batches.filter(b => b.product_variant_id === v.id).reduce((s, b) => s + (b.quantity_remaining - (b.quantity_reserved || 0)), 0) > 0
        );
        if (variantsWithStock.length === 0) return;
        const rv = variantsWithStock[Math.floor(Math.random() * variantsWithStock.length)];
        const p = erp.products.find(prod => prod.id === rv.product_id);
        if (p) erp.processSale("Walk-in", [{ variantId: rv.id, quantity: 1, price: p.selling_price }]);
    };

    const handleAssignTask = (e: React.FormEvent<HTMLFormElement>, employeeId: string) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        erp.addTask({
            employee_id: employeeId,
            title: fd.get("title") as string,
            description: fd.get("description") as string,
            priority: fd.get("priority") as any,
            status: "todo",
            due_date: fd.get("due_date") as string
        });
        toast.success("Task assigned successfully to staff");
        (e.target as HTMLFormElement).reset();
    };
    const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        if (erp.isPeriodLocked) {
            toast.error("Fiscal Period is Locked. Catalog changes restricted.");
            e.preventDefault();
            return;
        }
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

        const sizes = selectedSizes.length > 0 ? selectedSizes : ["OS"];
        const colors = selectedColors.length > 0 ? selectedColors : ["Default"];

        const productId = crypto.randomUUID();
        const productName = (formData.get("name") as string) || "New Item";

        erp.addProduct({
            id: productId,
            name: productName,
            description: (formData.get("description") as string) || "",
            category_id: (formData.get("category") as string) || "General",
            brand_id: (formData.get("brand") as string) || "Rinas Closet",
            selling_price: 0,
            images: images.length > 0 ? images : ["/placeholder.svg"],
            sizes: sizes,
            colors: colors,
            is_active: true,
            created_at: new Date().toISOString()
        });

        // Generate Variants
        sizes.forEach(size => {
            colors.forEach(color => {
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
        setSelectedSizes([]);
        setSelectedColors([]);
        (e.target as HTMLFormElement).reset();
    };


    const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const productId = editingProduct.id;

        let images = editingProduct.images;
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
        }

        erp.updateProduct(productId, {
            name: (formData.get("name") as string) || editingProduct.name,
            description: (formData.get("description") as string) || editingProduct.description,
            category_id: (formData.get("category") as string) || editingProduct.category_id,
            brand_id: (formData.get("brand") as string) || editingProduct.brand_id,
            images,
            sizes: selectedSizes.length > 0 ? selectedSizes : editingProduct.sizes,
            colors: selectedColors.length > 0 ? selectedColors : editingProduct.colors,
        });

        toast.success("Product details updated successfully");
        setEditingProduct(null);
        setSelectedSizes([]);
        setSelectedColors([]);
    };

    const handleHireEmployee = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const id = crypto.randomUUID();
        const name = (formData.get("name") as string) || "New Staff";
        const role = (formData.get("role") as string) || "Staff";
        const email = (formData.get("email") as string) || "";
        const phone = (formData.get("phone") as string) || "";
        const username = (formData.get("username") as string) || "";
        const password = (formData.get("password") as string) || "123456";
        const joined_date = new Date().toISOString();

        const employeeData = {
            id,
            name,
            role,
            department: ((formData.get("department") as string) || "sales") as any,
            email,
            phone,
            salary: Number(formData.get("salary")) || 0,
            status: "active" as const,
            joined_date,
            address: (formData.get("address") as string) || "",
            national_id: (formData.get("national_id") as string) || "",
            emergency_contact_name: (formData.get("emergency_name") as string) || "",
            emergency_contact_phone: (formData.get("emergency_phone") as string) || "",
            guarantor_name: (formData.get("guarantor_name") as string) || "",
            guarantor_phone: (formData.get("guarantor_phone") as string) || "",
            username,
            password,
        };

        erp.addEmployee(employeeData);

        // Also save to the main "users table" in Auth Store
        auth.addUser({
            id,
            name,
            email,
            phone,
            username,
            password,
            role,
            address: employeeData.address,
            created_at: joined_date
        });

        toast.success("New employee registered with login credentials");
        (e.target as HTMLFormElement).reset();
    };

    const menuItems = [
        { id: "overview", label: "Dashboard", icon: BarChart3 },
        { id: "products", label: "Catalog", icon: Tag },
        { id: "categories", label: "Taxonomy", icon: Layers },
        { id: "locations", label: "Warehouses", icon: Box },
        { id: "inventory", label: "Inventory", icon: Package },
        { id: "sales", label: "Orders", icon: ShoppingCart },
        { id: "reservations", label: "Reservations", icon: Calendar },
        { id: "tasks", label: "Operations", icon: Briefcase },
        { id: "employees", label: "Staff", icon: Users },
        { id: "users", label: "User Accounts", icon: ShieldCheck },
        { id: "accounting", label: "Financials", icon: Receipt },
        { id: "audit", label: "Audit Logs", icon: FileText },
        { id: "workstation", label: "Staff Workspace", icon: Briefcase },
        { id: "settings", label: "Settings", icon: Settings },
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
                    <h2 className="text-sm font-display tracking-[0.3em] uppercase text-primary font-bold">Rinas Closet</h2>
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
                                    { label: "Total Revenue", value: accrualRevenue, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
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
                                                const totalStock = erp.batches.filter(b => pVars.some(v => v.id === b.product_variant_id)).reduce((s, b) => s + (b.quantity_remaining - (b.quantity_reserved || 0)), 0);
                                                return totalStock < 10 && totalStock > 0;
                                            }).slice(0, 3).map(p => {
                                                const pVars = erp.variants.filter(v => v.product_id === p.id);
                                                const totalStock = erp.batches.filter(b => pVars.some(v => v.id === b.product_variant_id)).reduce((s, b) => s + (b.quantity_remaining - (b.quantity_reserved || 0)), 0);
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
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-4">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Available Sizes</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {["XXS", "XS", "S", "M", "L", "XL", "XXL", "OS"].map(size => (
                                                            <Button
                                                                type="button"
                                                                key={size}
                                                                variant={selectedSizes.includes(size) ? "default" : "outline"}
                                                                className={`h-10 px-3 rounded-lg text-xs font-bold transition-all ${selectedSizes.includes(size) ? 'bg-primary text-white' : 'text-gray-500'}`}
                                                                onClick={() => {
                                                                    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
                                                                }}
                                                            >
                                                                {size}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Available Colors</Label>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {["Black", "White", "Gold", "Silver", "Pink", "Red", "Blue", "Emerald", "Nude"].map(color => (
                                                        <Button
                                                            type="button"
                                                            key={color}
                                                            variant={selectedColors.includes(color) ? "default" : "outline"}
                                                            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all ${selectedColors.includes(color) ? 'bg-primary text-white' : 'text-gray-500'}`}
                                                            onClick={() => {
                                                                setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
                                                            }}
                                                        >
                                                            {color}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="custom-color-input"
                                                        placeholder="Add custom color (e.g. Royal Blue)"
                                                        className="h-11 rounded-xl bg-gray-50 border-gray-100 text-xs"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const val = e.currentTarget.value.trim();
                                                                if (val && !selectedColors.includes(val)) {
                                                                    setSelectedColors([...selectedColors, val]);
                                                                    e.currentTarget.value = "";
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        className="h-11 px-4 rounded-xl"
                                                        onClick={() => {
                                                            const input = document.getElementById('custom-color-input') as HTMLInputElement;
                                                            const val = input.value.trim();
                                                            if (val && !selectedColors.includes(val)) {
                                                                setSelectedColors([...selectedColors, val]);
                                                                input.value = "";
                                                            }
                                                        }}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                                {selectedColors.length > 9 && (
                                                    <div className="flex flex-wrap gap-1 pt-1">
                                                        {selectedColors.filter(c => !["Black", "White", "Gold", "Silver", "Pink", "Red", "Blue", "Emerald", "Nude"].includes(c)).map(c => (
                                                            <Badge key={c} variant="secondary" className="px-2 py-0.5 text-[10px] bg-gray-100">
                                                                {c} <button type="button" onClick={() => setSelectedColors(prev => prev.filter(col => col !== c))} className="ml-1 text-gray-400">×</button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Images (Upload)</Label>
                                                <Input name="images" type="file" multiple accept="image/*" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer" />
                                            </div>
                                            <Button type="submit" className="w-full h-14 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 text-lg">Save to Product Registry</Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                                <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                                    <div className="bg-primary p-6 text-white">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold">Edit Product Listing</DialogTitle>
                                            <DialogDescription className="text-white/60 text-xs text-left">Modify the collection details for "{editingProduct?.name}".</DialogDescription>
                                        </DialogHeader>
                                    </div>
                                    <form onSubmit={handleEditProduct} className="p-8 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400">Product Name</Label>
                                                <Input name="name" defaultValue={editingProduct?.name} required className="h-12 rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400">Category</Label>
                                                <select name="category" defaultValue={editingProduct?.category_id} className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm">
                                                    {erp.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Description</Label>
                                            <Textarea name="description" defaultValue={editingProduct?.description} required className="rounded-xl min-h-[80px]" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400">Update Sizes (Selecting will override existing)</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {["XXS", "XS", "S", "M", "L", "XL", "XXL", "OS"].map(size => (
                                                        <Button
                                                            type="button"
                                                            key={size}
                                                            variant={selectedSizes.includes(size) ? "default" : "outline"}
                                                            className={`h-9 px-3 rounded-lg text-[10px] font-bold ${selectedSizes.includes(size) ? 'bg-primary text-white' : ''}`}
                                                            onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                                                        >
                                                            {size}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Product Images</Label>
                                            <Input name="images" type="file" multiple className="h-12 rounded-xl border-gray-100 bg-gray-50" />
                                            <p className="text-[9px] text-gray-400 italic">Leave empty to keep existing images.</p>
                                        </div>
                                        <Button type="submit" className="w-full h-14 rounded-xl bg-black text-white font-bold text-md">Update Registry Listing</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>


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
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-primary font-bold text-xl">${product.selling_price}</p>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-primary/10"
                                                            onClick={() => {
                                                                setEditingProduct(product);
                                                                setSelectedSizes([]);
                                                                setSelectedColors([]);
                                                            }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-gray-300 hover:text-rose-500 hover:bg-rose-50"
                                                            onClick={() => {
                                                                if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                                                                    erp.deleteProduct(product.id);
                                                                    toast.success("Product removed from catalog");
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
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
                    {/* LOCATIONS VIEW */}
                    {activeView === "locations" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 px-4 pb-20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Physical Locations</h1>
                                    <p className="text-gray-500 text-sm mt-1">Manage warehouses, showrooms, and boutique branches.</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="rounded-lg bg-[#111214] text-white shadow-lg shadow-black/10">
                                            <Plus size={18} className="mr-2" /> Register New Location
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                                        <div className="bg-[#111214] p-6 text-white">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold">New Location Profile</DialogTitle>
                                                <DialogDescription className="text-white/40 text-xs">Define a new physical spot for stock management.</DialogDescription>
                                            </DialogHeader>
                                        </div>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.currentTarget);
                                            erp.addLocation({
                                                id: crypto.randomUUID(),
                                                name: fd.get("name") as string,
                                                type: fd.get("type") as any,
                                                address: fd.get("address") as string,
                                                contact_phone: fd.get("phone") as string,
                                            });
                                            toast.success("Location registered successfully");
                                            (e.target as HTMLFormElement).reset();
                                        }} className="p-8 space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Location Name</Label>
                                                <Input name="name" required placeholder="e.g. Merkato Warehouse" className="h-12 rounded-xl border-gray-100 bg-gray-50 text-sm font-bold" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Type</Label>
                                                    <select name="type" className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20">
                                                        <option value="warehouse">📦 Warehouse</option>
                                                        <option value="store">🛍 Retail Store / Boutique</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Contact Phone</Label>
                                                    <Input name="phone" placeholder="+251 ..." className="h-12 rounded-xl border-gray-100 bg-gray-50 text-sm font-bold" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Physical Address</Label>
                                                <Input name="address" required placeholder="Subcity, District, Building..." className="h-12 rounded-xl border-gray-100 bg-gray-50 text-sm font-bold" />
                                            </div>
                                            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 mt-4 transition-transform active:scale-95">Save Location & Initialize ERP Node</Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {erp.locations.map(loc => {
                                    const locBatches = erp.batches.filter(b => b.location_id === loc.id);
                                    const totalUnits = locBatches.reduce((sum, b) => sum + b.quantity_remaining, 0);
                                    const totalValue = locBatches.reduce((sum, b) => sum + (b.quantity_remaining * b.unit_cost), 0);

                                    return (
                                        <Card key={loc.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-xl transition-all duration-300">
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className={`p-3 rounded-2xl ${loc.type === 'warehouse' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {loc.type === 'warehouse' ? <Box size={24} /> : <ShoppingCart size={24} />}
                                                    </div>
                                                    <Badge variant="outline" className="rounded-full text-[9px] uppercase font-black tracking-tighter border-gray-100 bg-gray-50/50">
                                                        {loc.type}
                                                    </Badge>
                                                </div>
                                                <div className="mt-4">
                                                    <CardTitle className="text-xl font-bold text-gray-900 leading-none">{loc.name}</CardTitle>
                                                    <CardDescription className="text-xs mt-2 font-medium flex items-center gap-1.5 opacity-60">
                                                        <Search size={12} /> {loc.address}
                                                    </CardDescription>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">In Stock</p>
                                                        <p className="text-lg font-bold text-gray-900 mt-1">{totalUnits} <span className="text-[10px] text-gray-400">units</span></p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Inventory Value</p>
                                                        <p className="text-lg font-bold text-primary mt-1">${totalValue.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                                        <Phone size={10} /> {loc.contact_phone || "No contact"}
                                                    </div>
                                                    <Button variant="ghost" className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50">View Details</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
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
                                <div className="flex items-center gap-3">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50">
                                                <RefreshCw size={16} className="mr-2" /> Stock Transfer
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-2xl border-none shadow-2xl max-w-md p-0 overflow-hidden">
                                            <div className="bg-blue-600 p-6 text-white font-display">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-bold">Internal Stock Transfer</DialogTitle>
                                                    <DialogDescription className="text-blue-100 text-xs">Move inventory between warehouses and stores.</DialogDescription>
                                                </DialogHeader>
                                            </div>
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                const fd = new FormData(e.currentTarget);
                                                try {
                                                    erp.transferStock({
                                                        variantId: fd.get("variantId") as string,
                                                        fromLocationId: fd.get("from") as string,
                                                        toLocationId: fd.get("to") as string,
                                                        quantity: Number(fd.get("quantity"))
                                                    });
                                                    toast.success("Stock transfer completed successfully");
                                                    (e.target as HTMLFormElement).reset();
                                                } catch (err: any) { toast.error(err.message); }
                                            }} className="p-8 space-y-5">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Select Product SKU</Label>
                                                    <select name="variantId" className="w-full h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold focus:outline-none">
                                                        {erp.products.map(p =>
                                                            erp.variants.filter(v => v.product_id === p.id).map(v => (
                                                                <option key={v.id} value={v.id}>{p.name} — {v.size}/{v.color}</option>
                                                            ))
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">From Location</Label>
                                                        <select name="from" className="w-full h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold focus:outline-none">
                                                            {erp.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">To Location</Label>
                                                        <select name="to" className="w-full h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold focus:outline-none">
                                                            {erp.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Transfer Quantity</Label>
                                                    <Input name="quantity" type="number" min="1" required placeholder="0" className="h-11 rounded-xl border-gray-100 bg-gray-50 font-bold" />
                                                </div>
                                                <Button type="submit" className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg mt-4">Execute Transfer</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50">
                                                <Edit2 size={16} className="mr-2" /> Stock Adjustment
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-2xl border-none shadow-2xl max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold">Stock Adjustment</DialogTitle>
                                                <DialogDescription className="text-sm text-gray-400">Record damage, loss, correction, or return for a batch.</DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                const fd = new FormData(e.currentTarget);
                                                const batchId = fd.get("batchId") as string;
                                                const type = fd.get("type") as any;
                                                const qty = Number(fd.get("quantity"));
                                                const reason = fd.get("reason") as string;
                                                if (!batchId || !qty || !reason.trim()) { toast.error("All fields are required."); return; }
                                                try {
                                                    erp.adjustStock({ batchId, type, quantity: qty, reason });
                                                    toast.success(`Stock ${type} recorded — ${qty} units adjusted.`);
                                                    (e.target as HTMLFormElement).reset();
                                                } catch (err: any) { toast.error(err.message); }
                                            }} className="space-y-5 pt-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400">Adjustment Type</Label>
                                                    <select name="type" className="w-full h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                                                        <option value="damage">🔴 Damage — items physically damaged</option>
                                                        <option value="loss">🟠 Loss / Shrinkage — theft or missing stock</option>
                                                        <option value="correction">🔵 Correction — fix a data entry error</option>
                                                        <option value="return">🟢 Return — supplier or customer return</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400">Select Batch</Label>
                                                    <select name="batchId" className="w-full h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                                                        {erp.batches.filter(b => b.quantity_remaining > 0).map(b => {
                                                            const v = erp.variants.find(v => v.id === b.product_variant_id);
                                                            const p = erp.products.find(p => p.id === v?.product_id);
                                                            return <option key={b.id} value={b.id}>{p?.name} – {v?.size}/{v?.color} (Qty: {b.quantity_remaining})</option>;
                                                        })}
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Quantity (units)</Label>
                                                        <Input name="quantity" type="number" min="1" required placeholder="0" className="h-11 rounded-xl border-gray-100 bg-gray-50" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Date</Label>
                                                        <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-11 rounded-xl border-gray-100 bg-gray-50" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400">Reason / Notes</Label>
                                                    <Textarea name="reason" required placeholder="e.g. Item torn during steaming" className="rounded-xl border-gray-100 bg-gray-50 min-h-[80px]" />
                                                </div>
                                                <Button type="submit" className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg">Record Adjustment</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
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
                                                <div className="grid grid-cols-1 gap-6 pt-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400 px-1">1. Select Product</Label>
                                                        <select
                                                            className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                                            value={selectedInventoryProduct}
                                                            onChange={(e) => setSelectedInventoryProduct(e.target.value)}
                                                        >
                                                            <option value="">Choose a product...</option>
                                                            {erp.products.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400 px-1">2. Select Size / Color Variant</Label>
                                                        <select
                                                            name="variantId"
                                                            disabled={!selectedInventoryProduct}
                                                            className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-50"
                                                        >
                                                            <option value="">{selectedInventoryProduct ? "Select from this product's variants" : "Select a product first"}</option>
                                                            {erp.variants
                                                                .filter(v => v.product_id === selectedInventoryProduct)
                                                                .map(v => (
                                                                    <option key={v.id} value={v.id}>
                                                                        {v.size} / {v.color} (SKU: {v.sku})
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        {selectedInventoryProduct && erp.variants.filter(v => v.product_id === selectedInventoryProduct).length === 0 && (
                                                            <p className="text-[10px] text-rose-500 font-bold mt-1">⚠️ No variants found for this product. Check catalog setup.</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400 px-1">3. Destination Location</Label>
                                                        <select name="locationId" className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                                            {erp.locations.map(l => (
                                                                <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                                                            ))}
                                                        </select>
                                                    </div>
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
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400 px-1">New Selling Price ($)</Label>
                                                    <Input name="sellingPrice" type="number" step="0.01" required placeholder="0.00" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 focus:ring-2 focus:ring-primary/20 transition-all font-bold text-primary" />
                                                    <p className="text-[10px] text-gray-400 italic">This will update the customer price for all units of this product.</p>
                                                </div>
                                                <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20">Record Inbound Batch</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
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
                                            <TableHead className="text-[10px] uppercase text-gray-400">Location</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Purchased</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 px-6">Cost</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-center">Physical</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-center">Reserved</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-center">Available</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-right">Valuation</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {erp.batches.slice().reverse().map((b) => {
                                            const variant = erp.variants.find(v => v.id === b.product_variant_id);
                                            const product = erp.products.find(p => p.id === variant?.product_id);
                                            const location = erp.locations.find(l => l.id === b.location_id);
                                            return (
                                                <TableRow key={b.id} className="border-gray-50 h-16">
                                                    <TableCell className="font-mono text-[10px] text-gray-400">#{b.id.slice(0, 8)}</TableCell>
                                                    <TableCell className="text-sm">
                                                        <p className="font-bold text-gray-800">{product?.name || "Unknown Product"}</p>
                                                        <p className="text-[10px] text-gray-500">{variant?.size} / {variant?.color} - {variant?.sku}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`text-[9px] uppercase font-black tracking-tighter ${location?.type === 'warehouse' ? 'border-amber-200 text-amber-600 bg-amber-50/50' : 'border-blue-200 text-blue-600 bg-blue-50/50'}`}>
                                                            {location?.name || "Main Store"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-gray-500">{new Date(b.purchase_date).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-xs font-semibold text-gray-600 px-6">${b.unit_cost.toFixed(2)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`text-sm font-bold ${b.quantity_remaining > 5 ? 'text-emerald-600' : 'text-rose-500'}`}>{b.quantity_remaining}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`text-sm font-bold ${(b.quantity_reserved || 0) > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{b.quantity_reserved || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${(b.quantity_remaining - (b.quantity_reserved || 0)) <= 0 ? 'bg-rose-50 text-rose-500' : (b.quantity_remaining - (b.quantity_reserved || 0)) < 5 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {b.quantity_remaining - (b.quantity_reserved || 0)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-gray-900 text-sm">
                                                        ${(b.quantity_remaining * b.unit_cost).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {(b as any).status === 'void' ? (
                                                            <span className="text-[10px] font-bold text-rose-500 uppercase px-2 py-1 bg-rose-50 rounded">Voided</span>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-gray-300 hover:text-rose-500 hover:bg-rose-50"
                                                                onClick={() => {
                                                                    const reason = prompt("Reason for voiding this inventory record?");
                                                                    if (reason) {
                                                                        erp.voidBatch(b.id, reason);
                                                                        toast.success("Batch successfully voided");
                                                                    }
                                                                }}
                                                            >
                                                                <XCircle size={14} />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {erp.batches.length === 0 && (
                                            <TableRow><TableCell colSpan={9} className="text-center py-10 text-gray-400">No inventory batches recorded</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>

                            {/* ── Stock Movement History ── */}
                            {erp.transactions.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <History size={18} className="text-gray-400" /> Stock Movement History
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full ml-2">{erp.transactions.length} records</span>
                                    </h2>
                                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white px-6 py-2">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-gray-50">
                                                    <TableHead className="text-[10px] uppercase text-gray-400">Date</TableHead>
                                                    <TableHead className="text-[10px] uppercase text-gray-400">Product / Batch</TableHead>
                                                    <TableHead className="text-[10px] uppercase text-gray-400">Type</TableHead>
                                                    <TableHead className="text-[10px] uppercase text-gray-400">Location</TableHead>
                                                    <TableHead className="text-[10px] uppercase text-gray-400">Reference</TableHead>
                                                    <TableHead className="text-[10px] uppercase text-gray-400 text-right">Qty Change</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {erp.transactions.slice().reverse().slice(0, 60).map(txn => {
                                                    const variant = erp.variants.find(v => v.id === txn.product_variant_id);
                                                    const product = erp.products.find(p => p.id === variant?.product_id);
                                                    const refType = txn.reference_type || txn.type;
                                                    const typeColors: Record<string, string> = {
                                                        IN: "bg-emerald-50 text-emerald-600",
                                                        OUT: "bg-rose-50 text-rose-500",
                                                        SALE: "bg-rose-50 text-rose-500",
                                                        DAMAGE: "bg-orange-50 text-orange-500",
                                                        LOSS: "bg-amber-50 text-amber-600",
                                                        CORRECTION: "bg-blue-50 text-blue-600",
                                                        RETURN: "bg-teal-50 text-teal-600",
                                                        TRANSFER: "bg-indigo-50 text-indigo-600",
                                                    };
                                                    return (
                                                        <TableRow key={txn.id} className="border-gray-50 h-14">
                                                            <TableCell className="text-xs text-gray-500">
                                                                {new Date(txn.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                            </TableCell>
                                                            <TableCell>
                                                                <p className="font-bold text-sm text-gray-800">{product?.name || "Unknown"}</p>
                                                                <p className="text-[10px] text-gray-400 font-mono">#{txn.batch_id?.slice(0, 8)}</p>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${typeColors[refType] || "bg-gray-100 text-gray-500"}`}>
                                                                    {refType}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                                    {erp.locations.find(l => l.id === txn.location_id)?.name || "—"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-gray-400 font-mono">#{txn.reference_id?.slice(0, 8)}</TableCell>
                                                            <TableCell className={`text-right font-black text-sm ${txn.type === 'IN' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                                {txn.type === 'IN' ? '+' : '−'}{txn.quantity}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </div>
                            )}
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
                                            <p className="text-lg font-bold text-emerald-600">${cashRevenue.toLocaleString()}</p>
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

                    {/* RESERVATIONS VIEW */}
                    {activeView === "reservations" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Guest Reservations</h1>
                                    <p className="text-gray-500 text-sm mt-1">Review fitting requests and assign to boutique staff.</p>
                                </div>
                            </div>

                            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white px-6 py-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-50 border-none">
                                            <TableHead className="text-[10px] uppercase text-gray-400">Client</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Fitting Choice</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Status</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-right">Prepayment</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {erp.reservations.slice().reverse().map((res) => {
                                            const variant = erp.variants.find(v => v.id === res.product_variant_id);
                                            const product = erp.products.find(p => p.id === variant?.product_id);
                                            return (
                                                <TableRow key={res.id} className="border-gray-50 h-20">
                                                    <TableCell>
                                                        <p className="font-bold text-gray-800">{res.customer_name}</p>
                                                        <p className="text-[10px] text-gray-500">{res.customer_phone}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm font-medium">{product?.name || "Unknown Product"}</p>
                                                        <p className="text-[10px] text-gray-400">{res.notes}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`uppercase text-[9px] font-bold border-none px-2.5 py-1 ${res.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                            res.status === 'confirmed_prepaid' ? 'bg-emerald-50 text-emerald-600' :
                                                                res.status === 'confirmed_no_prepayment' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {res.status.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs font-bold text-gray-700">
                                                        {res.prepayment_amount ? `$${res.prepayment_amount.toFixed(2)}` : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {['pending', 'confirmed_prepaid', 'confirmed_no_prepayment', 'reserved'].includes(res.status) ? (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 text-[10px] uppercase font-black tracking-widest px-3 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                                        onClick={() => {
                                                                            const amt = prompt("Enter prepayment amount received:");
                                                                            if (amt) erp.recordPrepayment(res.id, Number(amt), "Cash/Transfer");
                                                                        }}
                                                                    >
                                                                        Record Payment
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 text-[10px] uppercase font-black tracking-widest px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                                                                        onClick={() => {
                                                                            if (confirm("Finalize this fitting into a Sale? This will record revenue and deduct stock.")) {
                                                                                erp.updateReservationStatus(res.id, 'completed');
                                                                                toast.success("Reservation finalized into a Sale");
                                                                            }
                                                                        }}
                                                                    >
                                                                        Finalize Sale
                                                                    </Button>
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-500" onClick={() => erp.updateReservationStatus(res.id, 'cancelled')} title="Cancel Reservation"><XCircle size={14} /></Button>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-gray-300 uppercase italic">Archived</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {erp.reservations.length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-400 italic">No fitting reservations found</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}

                    {/* OPERATIONS VIEW (TASKS) */}
                    {activeView === "tasks" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Operations & Workflow</h1>
                                    <p className="text-gray-500 text-sm mt-1">Monitor staff productivity and task completion status.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {['todo', 'in_progress', 'done'].map((status) => (
                                    <div key={status} className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{status.replace('_', ' ')}</h3>
                                            <Badge variant="outline" className="text-[9px] font-bold text-gray-400">{erp.tasks.filter(t => t.status === status).length}</Badge>
                                        </div>
                                        <div className="space-y-4">
                                            {erp.tasks.filter(t => t.status === status).map(task => {
                                                const emp = erp.employees.find(e => e.id === task.employee_id);
                                                return (
                                                    <Card key={task.id} className="border-none shadow-sm rounded-2xl bg-white p-5 group hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <Badge className={`text-[8px] tracking-widest uppercase border-none px-2 py-0.5 ${task.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-500'}`}>{task.priority}</Badge>
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary uppercase">
                                                                {(emp?.name || "?").split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-gray-800 mb-1">{task.title}</h4>
                                                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-4">{task.description}</p>
                                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase">{emp?.name}</span>
                                                            <span className="text-[9px] font-bold text-gray-400">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* USER ACCOUNTS VIEW */}
                    {activeView === "users" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between px-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">User Accounts</h1>
                                    <p className="text-gray-500 text-sm mt-1">Manage all registered customers and system users.</p>
                                </div>
                            </div>

                            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white px-6 py-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-50 border-none">
                                            <TableHead className="text-[10px] uppercase text-gray-400">User Profile</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Role</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Registered</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {auth.users.map((u) => (
                                            <TableRow key={u.id} className="border-gray-50 h-16">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
                                                            {u.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 text-sm">{u.name}</p>
                                                            <p className="text-[10px] text-gray-400">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`uppercase text-[9px] font-black border-none px-2.5 py-1 ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' :
                                                        u.role === 'staff' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {u.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500 font-medium">
                                                    {new Date(u.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-2">
                                                        {u.role !== 'admin' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 text-[10px] uppercase font-black px-3 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                                onClick={() => {
                                                                    if (confirm(`Promote ${u.name} to STAFF? This grants access to the Employee Portal.`)) {
                                                                        auth.updateUserRole(u.id, 'staff');
                                                                        erp.addEmployee({
                                                                            id: u.id,
                                                                            name: u.name,
                                                                            email: u.email,
                                                                            phone: u.phone || "",
                                                                            role: "Sales Stylist",
                                                                            department: "sales",
                                                                            salary: 0,
                                                                            status: "active",
                                                                            joined_date: new Date().toISOString(),
                                                                            username: u.username || u.email,
                                                                            password: "password123"
                                                                        });
                                                                        toast.success(`${u.name} promoted to Staff`);
                                                                    }
                                                                }}
                                                            >
                                                                Promote to Staff
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-gray-300 hover:text-rose-500 hover:bg-rose-50"
                                                            onClick={() => {
                                                                if (confirm("Permanently delete this user account?")) {
                                                                    auth.deleteUser(u.id);
                                                                    toast.success("User deleted");
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
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
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Job Title / Role</Label>
                                                        <select name="role" className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                                                            <option value="Sales Stylist">Sales Stylist (Boutique Floor)</option>
                                                            <option value="Inventory Manager">Inventory Manager (Stock &amp; Batches)</option>
                                                            <option value="Store Manager">Store Manager (Operations)</option>
                                                            <option value="Tailor">Master Tailor (Atelier/Fitting)</option>
                                                            <option value="Cashier">Cashier (Finance)</option>
                                                            <option value="Social Media">Social Media Specialist</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-gray-400">Department (controls portal access)</Label>
                                                    <select name="department" className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                                                        <option value="sales">🛍 Sales — View reservations, confirm orders, mark payment</option>
                                                        <option value="warehouse">📦 Warehouse — View &amp; update stock, process arrivals</option>
                                                        <option value="management">👑 Management — Full access (tasks + reservations + stock)</option>
                                                    </select>
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
                                                <h3 className="text-xs font-black uppercase text-blue-500 tracking-widest border-b pb-2">Login Credentials</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Username</Label>
                                                        <Input name="username" required placeholder="staff.name" className="rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Portal Password</Label>
                                                        <Input name="password" type="password" required defaultValue="123456" className="rounded-xl" />
                                                    </div>
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
                                            <TableHead className="text-[10px] uppercase text-gray-400">Credentials</TableHead>
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
                                                    <div>
                                                        <p className="text-gray-900 font-bold">@{emp.username}</p>
                                                        <p className="text-[9px] text-gray-400 font-medium">PWD: {emp.password}</p>
                                                        <p className="text-[8px] text-primary/60 font-black mt-0.5 uppercase tracking-tighter">{emp.role}</p>
                                                    </div>
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
                                                    <div className="flex justify-end gap-2 text-right">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 hover:text-primary">
                                                                    <Briefcase size={14} />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                                                                <div className="bg-primary p-6 text-white">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Assign Task to {emp.name}</DialogTitle>
                                                                        <DialogDescription className="text-white/60 text-xs">Define operational goal and priority for this member.</DialogDescription>
                                                                    </DialogHeader>
                                                                </div>
                                                                <form onSubmit={(e) => handleAssignTask(e, emp.id)} className="p-6 space-y-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Task Title</Label>
                                                                        <Input name="title" placeholder="e.g. Prepare Summer Collection Display" required className="rounded-xl border-gray-100" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Description</Label>
                                                                        <Textarea name="description" placeholder="Provide specific instructions..." className="rounded-xl border-gray-100 min-h-[100px]" />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Priority</Label>
                                                                            <select name="priority" className="w-full h-10 px-3 rounded-xl border border-gray-100 bg-white text-sm">
                                                                                <option value="low">Low</option>
                                                                                <option value="medium">Medium</option>
                                                                                <option value="high">High</option>
                                                                            </select>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Due Date</Label>
                                                                            <Input name="due_date" type="date" className="rounded-xl border-gray-100 h-10" />
                                                                        </div>
                                                                    </div>
                                                                    <Button type="submit" className="w-full bg-primary text-white rounded-xl h-12 font-bold shadow-lg shadow-primary/20 mt-4">Assign Task</Button>
                                                                </form>
                                                            </DialogContent>
                                                        </Dialog>

                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-500" onClick={() => erp.updateEmployee(emp.id, { status: emp.status === 'active' ? 'inactive' : 'active' })}>
                                                            {emp.status === 'active' ? <XCircle size={14} /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-rose-500 hover:bg-rose-50" onClick={() => {
                                                            if (confirm(`Remove ${emp.name} from records?`)) {
                                                                erp.deleteEmployee(emp.id);
                                                                toast.success("Employee removed");
                                                            }
                                                        }}>
                                                            <Trash2 size={14} />
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
                                    <h1 className="text-2xl font-black text-gray-900 uppercase italic">Financial Performance</h1>
                                    <p className="text-gray-500 text-sm mt-1">Real-time profit & loss summary and full journal ledger.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="rounded-xl border-gray-100"><History className="mr-2 h-4 w-4" /> Export Ledger</Button>
                                    <Button
                                        variant={erp.isPeriodLocked ? "destructive" : "outline"}
                                        className="rounded-xl"
                                        onClick={() => erp.isPeriodLocked ? erp.unlockPeriod() : erp.lockPeriod()}
                                    >
                                        {erp.isPeriodLocked ? <Lock className="mr-2 h-4 w-4" /> : <Settings className="mr-2 h-4 w-4" />}
                                        {erp.isPeriodLocked ? "Unlock Period" : "Lock Period"}
                                    </Button>
                                </div>
                            </div>

                            {/* Dashboard Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card className="border-none shadow-sm rounded-3xl bg-white p-6 border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none mb-3">Gross Sales</p>
                                    <p className="text-3xl font-black text-gray-900">${accrualRevenue.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">Accrual Basis</p>
                                </Card>
                                <Card className="border-none shadow-sm rounded-3xl bg-white p-6 border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none mb-3">Cash Collected</p>
                                    <p className="text-3xl font-black text-emerald-600">${cashRevenue.toLocaleString()}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase tracking-tight">Liquidity</p>
                                </Card>
                                <Card className="border-none shadow-sm rounded-3xl bg-white p-6 border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none mb-3">Recievables</p>
                                    <p className="text-3xl font-black text-amber-500">
                                        ${erp.invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">Pending Payments</p>
                                </Card>
                                <Card className="border-none shadow-sm rounded-3xl bg-primary/5 text-primary p-6 border border-primary/10">
                                    <p className="text-[10px] uppercase font-bold text-primary/60 tracking-widest leading-none mb-3">Net Operating Profit</p>
                                    <p className="text-3xl font-black">${erp.getNetProfit().toLocaleString()}</p>
                                    <p className="text-[10px] text-primary/60 font-bold mt-2 uppercase tracking-tight italic">EBITDA Estimated</p>
                                </Card>
                            </div>

                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border border-gray-100">
                                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                    <h3 className="font-black text-gray-900 uppercase italic tracking-tighter">Double-Entry Journal</h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Record #ERPL-2024</span>
                                </div>
                                <Table>
                                    <TableHeader className="bg-white">
                                        <TableRow className="border-none">
                                            <TableHead className="text-[10px] uppercase text-gray-400 pl-8">Entry Date</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Description</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400">Ledger Movements</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 text-right pr-8">Verification</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {erp.journalEntries.slice().reverse().map((entry) => (
                                            <TableRow key={entry.id} className="border-gray-50 h-24 hover:bg-gray-50/50 transition-all">
                                                <TableCell className="pl-8">
                                                    <p className="text-xs font-black text-gray-900">{new Date(entry.date).toLocaleDateString()}</p>
                                                    <p className="text-[9px] text-gray-400 font-mono mt-0.5 tracking-tighter uppercase">#{entry.id.slice(0, 6)}</p>
                                                </TableCell>
                                                <TableCell className="max-w-[220px]">
                                                    <p className="text-xs font-bold text-gray-800 leading-tight">{cleanDesc(entry.description)}</p>
                                                    <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-1 block">{entry.reference_type}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1.5 py-2">
                                                        {entry.items.map((item, idx) => (
                                                            <div key={idx} className="grid grid-cols-2 gap-8 text-[10px] w-full max-w-[200px]">
                                                                <span className={item.credit > 0 ? "pl-2 text-gray-400 font-medium" : "font-black text-gray-700 uppercase"}>
                                                                    {item.account_name}
                                                                </span>
                                                                <span className={`text-right font-mono ${item.debit > 0 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}`}>
                                                                    {item.debit > 0 ? `DR $${item.debit.toLocaleString()}` : `CR $${item.credit.toLocaleString()}`}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase border border-emerald-100">Validated</span>
                                                        <span className="text-[8px] font-mono text-gray-300 uppercase tracking-tighter">Block Hash: {entry.id.slice(-8)}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {erp.journalEntries.length === 0 && (
                                            <TableRow><TableCell colSpan={4} className="text-center py-20 text-gray-400 italic">No historical ledger entries found.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}

                    {/* SETTINGS VIEW */}
                    {activeView === "settings" && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 uppercase italic">Control Center</h1>
                                <p className="text-gray-500 text-sm mt-1">Configure business logic and system guardrails.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="border-none shadow-sm rounded-[40px] bg-white p-8 border border-gray-100">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                        <Lock size={28} />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase italic mb-2 tracking-tighter">Fiscal Integrity</h3>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">Locking the fiscal period prevents any new sales, stock movements, or journal entries. Required for end-of-month reporting.</p>

                                    <div className="flex items-center justify-between p-4 rounded-3xl bg-gray-50 border border-gray-100">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</p>
                                            <p className={`text-xs font-bold ${erp.isPeriodLocked ? "text-rose-500" : "text-emerald-500"}`}>
                                                {erp.isPeriodLocked ? "LOCKED (RESTRICTED)" : "OPEN (ACTIVE)"}
                                            </p>
                                        </div>
                                        <Button
                                            variant={erp.isPeriodLocked ? "destructive" : "default"}
                                            className="rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest"
                                            onClick={() => erp.isPeriodLocked ? erp.unlockPeriod() : erp.lockPeriod()}
                                        >
                                            {erp.isPeriodLocked ? "Unlock Period" : "Lock Now"}
                                        </Button>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-sm rounded-[40px] bg-white p-8 border border-gray-100">
                                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-6">
                                        <TrendingUp size={28} />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase italic mb-2 tracking-tighter">Costing Strategy</h3>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">Switch between FIFO (First-In, First-Out) or LIFO (Last-In, First-Out) for COGS calculation. </p>

                                    <div className="flex gap-2">
                                        {['FIFO', 'LIFO'].map((method) => (
                                            <Button
                                                key={method}
                                                variant={erp.costMethod === method ? "default" : "outline"}
                                                className="flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                                                onClick={() => erp.setCostMethod(method as any)}
                                            >
                                                {method}
                                            </Button>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <Card className="border-none shadow-sm rounded-[40px] bg-[#1A1C1E] text-white p-10 overflow-hidden relative">
                                <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-primary/20 rounded-full blur-[100px]" />
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6">
                                        <Settings className="text-primary animate-spin-slow" size={32} />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic italic">System Core Health</h2>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 mb-8 letter-spacing-widest">Rinas Atelier ERP v2.0.4-Stable</p>
                                    <div className="grid grid-cols-3 gap-12 w-full">
                                        <div className="text-center">
                                            <p className="text-[32px] font-black text-primary leading-none">99.9%</p>
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2">Uptime</p>
                                        </div>
                                        <div className="text-center border-x border-white/5">
                                            <p className="text-[32px] font-black text-white leading-none">1ms</p>
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2">Latency</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[32px] font-black text-emerald-500 leading-none">OK</p>
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2">Sync Status</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* AUDIT LOG VIEW */}
                    {activeView === "audit" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900 uppercase italic">System Audit Trail</h1>
                                    <p className="text-gray-500 text-sm mt-1">Immutable record of all business and administrative activities.</p>
                                </div>
                                <Button variant="outline" className="rounded-xl border-gray-100"><FileText className="mr-2 h-4 w-4" /> Download PDF Trail</Button>
                            </div>

                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow className="border-none">
                                            <TableHead className="text-[10px] uppercase text-gray-400 pl-8 h-12">Timestamp</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 h-12">Operator</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 h-12">Type/Action</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 h-12">Entity Relation</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 pr-8 h-12">Detail Logs</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {erp.logs?.map((log) => (
                                            <TableRow key={log.id} className="border-gray-50 h-16 hover:bg-gray-50/20">
                                                <TableCell className="pl-8 text-[10px] font-mono text-gray-400">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">A</div>
                                                        <span className="text-xs font-bold text-gray-700">{log.user}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${log.action === 'SALE' ? 'bg-emerald-50 text-emerald-600' :
                                                        log.action === 'VOID' ? 'bg-rose-50 text-rose-600' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {log.action}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-[10px] font-bold text-gray-500">
                                                    {log.entity} #{log.entity_id.slice(0, 8)}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-600 font-medium pr-8">
                                                    {log.details}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {erp.logs?.length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-400 italic font-medium">Clear audit trail. No logs generated.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
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
                                <div className="flex gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="h-12 px-6 rounded-2xl bg-[#111214] text-white font-bold shadow-lg shadow-black/10 hover:scale-[1.05] transition-transform">
                                                <ShoppingCart size={18} className="mr-2 text-primary" /> Boutique Checkout
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[40px] border-none shadow-2xl p-0 overflow-hidden max-w-lg">
                                            <div className="bg-[#111214] p-8 text-white relative">
                                                <div className="absolute top-0 right-0 h-32 w-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10" />
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Handover Item</DialogTitle>
                                                    <DialogDescription className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Direct Walk-in Customer Sale</DialogDescription>
                                                </DialogHeader>
                                            </div>
                                            <form onSubmit={handleQuickCheckout} className="p-10 space-y-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">1. Customer Name (Optional)</Label>
                                                        <Input name="customerName" placeholder="e.g. Guest Customer" className="h-12 rounded-2xl border-gray-100 bg-gray-50 font-bold" />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">2. Select Boutique Item & Size</Label>
                                                        <select
                                                            name="variantId"
                                                            required
                                                            className="w-full h-14 rounded-2xl border border-gray-100 bg-gray-50 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                        >
                                                            <option value="">Choose item from display...</option>
                                                            {erp.products.map(p => (
                                                                <optgroup key={p.id} label={p.name.toUpperCase()}>
                                                                    {erp.variants.filter(v => v.product_id === p.id).map(v => {
                                                                        const stock = erp.batches.filter(b => b.product_variant_id === v.id).reduce((s, b) => s + (b.quantity_remaining - (b.quantity_reserved || 0)), 0);
                                                                        return (
                                                                            <option key={v.id} value={v.id} disabled={stock <= 0}>
                                                                                {v.size} / {v.color} — {stock > 0 ? `${stock} available` : 'OUT OF STOCK'} — ${p.selling_price}
                                                                            </option>
                                                                        );
                                                                    })}
                                                                </optgroup>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">3. Quantity</Label>
                                                        <Input name="quantity" type="number" min="1" defaultValue="1" className="h-12 rounded-2xl border-gray-100 bg-gray-50 font-bold" />
                                                    </div>
                                                </div>

                                                <Button type="submit" className="w-full h-14 rounded-[24px] bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 hover:translate-y-[-2px] transition-all">
                                                    Process Handover & Mark Received
                                                </Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* Floor Collections */}
                                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {erp.products.slice(0, 6).map(product => {
                                        const pVars = erp.variants.filter(v => v.product_id === product.id);
                                        const totalStock = erp.batches.filter(b => pVars.some(v => v.id === b.product_variant_id)).reduce((s, b) => s + (b.quantity_remaining - (b.quantity_reserved || 0)), 0);
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
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Closet Core</h2>
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
