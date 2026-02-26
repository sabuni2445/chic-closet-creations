import React, { useState, useMemo } from "react";
import { useERPStore } from "@/hooks/use-erp-store";
import {
    Briefcase, Calendar, CheckCircle2, Clock,
    Layout, LogOut, MoreVertical, AlertCircle,
    ChevronRight, CheckCircle, XCircle, Wallet, Package,
    BarChart3, Box, ArrowDownCircle, Eye, Tag, Search,
    ShoppingBag, Receipt, User, Shield, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { EmployeeDepartment } from "@/types/erp";

// ─── Permission map ───────────────────────────────────────────────────────────
const DEPT_TABS: Record<EmployeeDepartment, string[]> = {
    sales: ["reservations", "tasks"],
    warehouse: ["stock", "tasks"],
    management: ["tasks", "reservations", "stock"],
};

const DEPT_CONFIG: Record<EmployeeDepartment, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    sales: { label: "Sales", color: "bg-blue-500", icon: <ShoppingBag size={14} />, description: "Reservations · Order confirmation · Payment marking" },
    warehouse: { label: "Warehouse", color: "bg-emerald-500", icon: <Package size={14} />, description: "Stock management · Arrivals · Dispatch" },
    management: { label: "Management", color: "bg-primary", icon: <Shield size={14} />, description: "Full access to all departments" },
};

const TAB_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
    tasks: { label: "My Tasks", icon: <Layout size={16} /> },
    reservations: { label: "Reservations", icon: <Calendar size={16} /> },
    stock: { label: "Stock & Inventory", icon: <Box size={16} /> },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        pending: "bg-amber-50 text-amber-600",
        confirmed_prepaid: "bg-emerald-50 text-emerald-600",
        confirmed_paid_fully: "bg-emerald-100 text-emerald-700",
        confirmed_no_prepayment: "bg-blue-50 text-blue-600",
        cancelled: "bg-rose-50 text-rose-500",
        completed: "bg-gray-100 text-gray-500",
        expired: "bg-gray-100 text-gray-400",
    };
    return map[status] || "bg-gray-100 text-gray-500";
};

// ─── Sub-views ────────────────────────────────────────────────────────────────

const TasksView = ({ employeeId }: { employeeId: string }) => {
    const erp = useERPStore();
    const tasks = useMemo(() => erp.tasks.filter(t => t.employee_id === employeeId), [erp.tasks, employeeId]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
                    <Briefcase size={36} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No tasks assigned yet.</p>
                    <p className="text-gray-300 text-[10px] mt-2 italic">You are all caught up!</p>
                </div>
            ) : tasks.map(task => (
                <Card key={task.id} className={`border-none shadow-sm rounded-[28px] overflow-hidden transition-all hover:shadow-lg ${task.status === "done" ? "opacity-60 grayscale" : "bg-white"}`}>
                    <div className={`h-1.5 ${task.priority === "high" ? "bg-rose-500" : task.priority === "medium" ? "bg-amber-400" : "bg-emerald-400"}`} />
                    <CardHeader className="p-7 pb-0">
                        <div className="flex justify-between items-start mb-3">
                            <Badge className={`uppercase text-[8px] tracking-widest rounded-full px-3 py-1 border-none ${task.priority === "high" ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-500"}`}>
                                {task.priority} Priority
                            </Badge>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${task.status === "done" ? "bg-emerald-50 text-emerald-600" : task.status === "in_progress" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                                {task.status.replace("_", " ")}
                            </span>
                        </div>
                        <CardTitle className="text-lg font-bold text-gray-900 leading-snug">{task.title}</CardTitle>
                        <CardDescription className="text-gray-400 text-xs mt-2 leading-relaxed">{task.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-7 space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-4 py-3 rounded-2xl">
                            <span>Deadline</span>
                            <span className="text-gray-800">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "No deadline"}</span>
                        </div>
                        <div className="flex gap-2">
                            {task.status !== "done" ? (
                                <>
                                    <Button
                                        onClick={() => erp.updateTaskStatus(task.id, "done")}
                                        className="flex-1 bg-primary text-white h-11 rounded-2xl font-bold text-xs shadow-lg shadow-primary/20"
                                    >
                                        <CheckCircle2 size={14} className="mr-2" /> Mark Done
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => erp.updateTaskStatus(task.id, task.status === "in_progress" ? "todo" : "in_progress")}
                                        className="h-11 w-11 rounded-2xl bg-gray-50 text-gray-500 hover:bg-gray-100"
                                    >
                                        {task.status === "in_progress" ? <Clock size={15} /> : <AlertCircle size={15} />}
                                    </Button>
                                </>
                            ) : (
                                <Button disabled className="w-full bg-emerald-50 text-emerald-600 h-11 rounded-2xl font-bold text-xs border border-emerald-100">
                                    <CheckCircle size={14} className="mr-2" /> Task Completed
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const ReservationsView = () => {
    const erp = useERPStore();
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const list = erp.reservations.slice().reverse();
        if (!search) return list;
        return list.filter(r =>
            r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
            r.customer_phone.includes(search)
        );
    }, [erp.reservations, search]);

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                    placeholder="Search by name or phone..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
            </div>

            <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-gray-50/70">
                        <TableRow className="border-none">
                            <TableHead className="pl-8 h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Customer</TableHead>
                            <TableHead className="h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Product</TableHead>
                            <TableHead className="h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Date</TableHead>
                            <TableHead className="h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Status</TableHead>
                            <TableHead className="pr-8 h-14 text-right text-[10px] uppercase font-bold text-gray-400 tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(res => {
                            const variant = erp.variants.find(v => v.id === res.product_variant_id);
                            const product = erp.products.find(p => p.id === (variant?.product_id || res.product_variant_id));
                            return (
                                <TableRow key={res.id} className="border-gray-50 h-20 hover:bg-gray-50/40">
                                    <TableCell className="pl-8">
                                        <p className="text-sm font-bold text-gray-900">{res.customer_name}</p>
                                        <p className="text-[10px] text-gray-400">{res.customer_phone}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                                                <img src={product?.images?.[0] || "/placeholder.svg"} className="h-full w-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{product?.name || "Unknown"}</p>
                                                <p className="text-[10px] text-gray-400">Size: {variant?.size || "?"}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs font-medium text-gray-500">
                                        {new Date(res.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`uppercase text-[8px] tracking-widest rounded-full px-3 py-1 border-none ${statusBadge(res.status)}`}>
                                            {res.status.replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pr-8 text-right">
                                        {res.status === "pending" ? (
                                            <div className="flex justify-end gap-1.5">
                                                <Button size="sm"
                                                    className="h-9 px-3 rounded-xl bg-emerald-600 text-white font-bold text-[9px] uppercase"
                                                    onClick={() => {
                                                        const amount = prompt("Total amount paid (ETB):");
                                                        if (amount) erp.updateReservationStatus(res.id, "confirmed_paid_fully", Number(amount));
                                                    }}>
                                                    <CheckCircle2 size={13} className="mr-1" /> Paid
                                                </Button>
                                                <Button size="sm"
                                                    className="h-9 px-3 rounded-xl bg-emerald-400 text-white font-bold text-[9px] uppercase"
                                                    onClick={() => {
                                                        const amount = prompt("Pre-payment amount (ETB):");
                                                        if (amount) erp.updateReservationStatus(res.id, "confirmed_prepaid", Number(amount));
                                                    }}>
                                                    <Wallet size={13} className="mr-1" /> Pre-paid
                                                </Button>
                                                <Button size="sm" variant="outline"
                                                    className="h-9 px-3 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 font-bold text-[9px] uppercase"
                                                    onClick={() => erp.updateReservationStatus(res.id, "cancelled")}>
                                                    <XCircle size={13} className="mr-1" /> Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 font-black uppercase italic">Actioned</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {erp.reservations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-16 text-center text-gray-300 italic text-sm">
                                    No reservations yet — the queue is clear.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};

const StockView = () => {
    const erp = useERPStore();
    const [search, setSearch] = useState("");

    const items = useMemo(() => {
        return erp.products
            .map(product => {
                const variants = erp.variants.filter(v => v.product_id === product.id);
                const batches = erp.batches.filter(b => variants.some(v => v.id === b.product_variant_id));
                const totalPhysical = batches.reduce((s, b) => s + b.quantity_remaining, 0);
                const totalReserved = batches.reduce((s, b) => s + (b.quantity_reserved || 0), 0);
                const totalAvailable = totalPhysical - totalReserved;
                return { product, variants, totalPhysical, totalReserved, totalAvailable };
            })
            .filter(item =>
                !search || item.product.name.toLowerCase().includes(search.toLowerCase())
            );
    }, [erp.products, erp.variants, erp.batches, search]);

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                    placeholder="Search products..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Products", value: erp.products.length, color: "text-gray-800" },
                    { label: "Low Stock Items", value: items.filter(i => i.totalAvailable > 0 && i.totalAvailable < 5).length, color: "text-amber-600" },
                    { label: "Out of Stock", value: items.filter(i => i.totalAvailable === 0).length, color: "text-rose-500" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Stock Table */}
            <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-gray-50/70">
                        <TableRow className="border-none">
                            <TableHead className="pl-8 h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Product</TableHead>
                            <TableHead className="h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Variants</TableHead>
                            <TableHead className="h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Physical</TableHead>
                            <TableHead className="h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Reserved</TableHead>
                            <TableHead className="pr-8 h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Available</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="py-16 text-center text-gray-300 italic">No products found.</TableCell></TableRow>
                        ) : items.map(({ product, variants, totalPhysical, totalReserved, totalAvailable }) => (
                            <TableRow key={product.id} className="border-gray-50 hover:bg-gray-50/40 h-20">
                                <TableCell className="pl-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                            <img src={product.images?.[0] || "/placeholder.svg"} className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{product.name}</p>
                                            <p className="text-[10px] text-gray-400">{product.category_id}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {variants.slice(0, 4).map(v => (
                                            <span key={v.id} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{v.size}</span>
                                        ))}
                                        {variants.length > 4 && <span className="text-[9px] text-gray-400 font-bold">+{variants.length - 4}</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm font-bold text-gray-700">{totalPhysical}</TableCell>
                                <TableCell>
                                    <span className={`text-sm font-bold ${totalReserved > 0 ? "text-amber-600" : "text-gray-300"}`}>{totalReserved}</span>
                                </TableCell>
                                <TableCell className="pr-8">
                                    <span className={`inline-flex items-center gap-1.5 text-sm font-black px-3 py-1 rounded-full ${totalAvailable === 0 ? "bg-rose-50 text-rose-500" :
                                            totalAvailable < 5 ? "bg-amber-50 text-amber-600" :
                                                "bg-emerald-50 text-emerald-600"
                                        }`}>
                                        {totalAvailable === 0 ? <XCircle size={11} /> : <CheckCircle size={11} />}
                                        {totalAvailable}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};

// ─── Main Portal ──────────────────────────────────────────────────────────────
const EmployeeDashboard = () => {
    const erp = useERPStore();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("tasks");

    const currentEmployee = useMemo(() =>
        erp.employees.find(e => e.id === selectedEmployeeId), [erp.employees, selectedEmployeeId]);

    const department: EmployeeDepartment = currentEmployee?.department ?? "sales";
    const allowedTabs = DEPT_TABS[department];
    const deptConfig = DEPT_CONFIG[department];

    const pendingReservations = useMemo(() =>
        erp.reservations.filter(r => r.status === "pending"), [erp.reservations]);

    const myTasks = useMemo(() =>
        erp.tasks.filter(t => t.employee_id === selectedEmployeeId), [erp.tasks, selectedEmployeeId]);

    // ── Login screen ──────────────────────────────────────────────────────────
    if (!selectedEmployeeId) {
        return (
            <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#111214] rounded-3xl mb-5">
                            <Shield size={28} className="text-primary" />
                        </div>
                        <h1 className="text-3xl font-display font-light text-gray-900 uppercase tracking-[0.2em] leading-tight">Staff Portal</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Rina's Atelier · Choose Your Profile</p>
                    </div>

                    <div className="space-y-3">
                        {erp.employees.filter(e => e.status === "active").map(emp => {
                            const dept = emp.department ?? "sales";
                            const dc = DEPT_CONFIG[dept];
                            return (
                                <button
                                    key={emp.id}
                                    onClick={() => { setSelectedEmployeeId(emp.id); setActiveTab(DEPT_TABS[dept][0]); }}
                                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-gray-700 uppercase text-sm group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-all">
                                        {emp.name.split(" ").map(n => n[0]).join("")}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-bold text-gray-900">{emp.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{emp.role}</p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${dc.color} text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl`}>
                                        {dc.icon} {dc.label}
                                    </div>
                                    <ChevronRight size={15} className="text-gray-300 group-hover:text-primary transition-colors" />
                                </button>
                            );
                        })}
                        {erp.employees.filter(e => e.status === "active").length === 0 && (
                            <div className="text-center py-12 text-gray-300 text-sm italic">No active staff profiles found.</div>
                        )}
                    </div>

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-[10px] uppercase font-black text-gray-300 tracking-widest hover:text-primary transition-colors">
                            ← Return to Boutique
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F8F7F4] flex">
            {/* Sidebar */}
            <aside className="w-72 bg-[#111214] text-white flex flex-col sticky top-0 h-screen">
                <div className="p-8 border-b border-white/5">
                    <h2 className="text-lg font-display font-light uppercase tracking-[0.3em] text-white leading-none">Rina's</h2>
                    <p className="text-[8px] font-bold text-primary uppercase tracking-[0.4em] mt-1.5">Staff Portal</p>
                </div>

                {/* Dept badge */}
                <div className="mx-4 mt-4 mb-2">
                    <div className={`flex items-center gap-2 ${deptConfig.color} text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl`}>
                        {deptConfig.icon} {deptConfig.label} Department
                    </div>
                    <p className="text-white/25 text-[9px] mt-2 px-1 leading-relaxed">{deptConfig.description}</p>
                </div>

                {/* Nav tabs */}
                <nav className="flex-1 px-4 mt-4 space-y-1">
                    {allowedTabs.map(tabId => {
                        const tab = TAB_CONFIG[tabId];
                        const isActive = activeTab === tabId;
                        const badge = tabId === "reservations" ? pendingReservations.length : tabId === "tasks" ? myTasks.filter(t => t.status !== "done").length : 0;
                        return (
                            <button
                                key={tabId}
                                onClick={() => setActiveTab(tabId)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                            >
                                {tab.icon} {tab.label}
                                {badge > 0 && (
                                    <span className={`ml-auto h-5 w-5 flex items-center justify-center rounded-full text-[9px] font-black ${tabId === "reservations" ? "bg-rose-500 text-white" : "bg-white/10 text-white"}`}>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Employee card + sign out */}
                <div className="p-5 border-t border-white/5">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl mb-3">
                        <div className="h-9 w-9 bg-primary/20 rounded-full flex items-center justify-center font-black text-primary text-xs uppercase">
                            {currentEmployee?.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white leading-none">{currentEmployee?.name}</p>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-tighter mt-0.5">{currentEmployee?.role}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedEmployeeId(null)}
                        className="w-full justify-start text-white/30 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl uppercase text-[9px] font-black tracking-widest h-9"
                    >
                        <LogOut size={14} className="mr-2" /> Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">
                <header className="sticky top-0 z-10 bg-[#F8F7F4]/80 backdrop-blur-sm border-b border-gray-200 px-10 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-light uppercase tracking-tight text-gray-900">
                            {TAB_CONFIG[activeTab]?.label}
                        </h1>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                            {activeTab === "tasks" ? `Assigned to ${currentEmployee?.name}` :
                                activeTab === "reservations" ? `${pendingReservations.length} pending` :
                                    `${erp.products.length} total products`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Shift Active</span>
                        </div>
                    </div>
                </header>

                <div className="p-10">
                    {activeTab === "tasks" && <TasksView employeeId={selectedEmployeeId} />}
                    {activeTab === "reservations" && <ReservationsView />}
                    {activeTab === "stock" && <StockView />}
                </div>
            </main>
        </div>
    );
};

export default EmployeeDashboard;
