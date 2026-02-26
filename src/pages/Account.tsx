import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useERPStore } from "@/hooks/use-erp-store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    User, Calendar, LogOut, Settings, Package,
    Edit2, Save, Phone, Mail, MapPin, X, ChevronRight,
    Clock, CheckCircle2, XCircle, AlertCircle, Star, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

type Tab = "reservations" | "profile";

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    pending: { label: "Awaiting Confirmation", bg: "bg-amber-50", text: "text-amber-600", icon: <Clock size={12} /> },
    confirmed_prepaid: { label: "Pre-Paid", bg: "bg-emerald-50", text: "text-emerald-600", icon: <CheckCircle2 size={12} /> },
    confirmed_paid_fully: { label: "Paid in Full", bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 size={12} /> },
    confirmed_no_prepayment: { label: "Confirmed", bg: "bg-blue-50", text: "text-blue-600", icon: <CheckCircle2 size={12} /> },
    completed: { label: "Completed", bg: "bg-gray-100", text: "text-gray-600", icon: <Star size={12} /> },
    cancelled: { label: "Cancelled", bg: "bg-rose-50", text: "text-rose-500", icon: <XCircle size={12} /> },
    expired: { label: "Expired", bg: "bg-gray-100", text: "text-gray-400", icon: <AlertCircle size={12} /> },
};

const Account = () => {
    const navigate = useNavigate();
    const { currentUser, logout, updateProfile } = useAuthStore();
    const erp = useERPStore();
    const [activeTab, setActiveTab] = useState<Tab>("reservations");
    const [editMode, setEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: currentUser?.name || "",
        phone: currentUser?.phone || "",
        address: currentUser?.address || "",
    });

    /* ─── Not logged in ─── */
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-[#FDFCF9] flex flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center px-4">
                    <div className="text-center max-w-sm">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                            <User size={36} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-display font-light uppercase tracking-wider text-gray-800 mb-3">
                            You're not signed in
                        </h2>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            Sign in to view your reservations, order history, and manage your profile.
                        </p>
                        <Link to="/auth">
                            <Button className="rounded-2xl bg-[#111214] text-white h-13 px-10 font-black uppercase tracking-widest text-xs hover:bg-primary transition-all gap-2 py-4">
                                Sign In / Register <ArrowRight size={14} />
                            </Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const myReservations = erp.reservations
        .filter(r => r.customer_phone === currentUser.phone || r.customer_name?.toLowerCase() === currentUser.name?.toLowerCase())
        .slice().reverse();

    const handleLogout = () => { logout(); toast.success("Signed out successfully."); navigate("/"); };

    const handleSaveProfile = () => {
        if (!profileForm.name || !profileForm.phone) { toast.error("Name and phone are required."); return; }
        updateProfile(profileForm);
        setEditMode(false);
        toast.success("Profile updated.");
    };

    const initials = currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    const stats = [
        { label: "Reservations", value: myReservations.length },
        { label: "Confirmed", value: myReservations.filter(r => r.status !== "pending" && r.status !== "cancelled" && r.status !== "expired").length },
        { label: "Completed", value: myReservations.filter(r => r.status === "completed" || r.status === "confirmed_paid_fully").length },
    ];

    return (
        <div className="min-h-screen bg-[#F8F7F4] flex flex-col">
            <Header />

            <main className="flex-grow">
                {/* ── Hero Profile Banner ── */}
                <div className="bg-[#111214] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full -mr-64 -mt-64 blur-[120px]" />
                    <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />

                    <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="h-24 w-24 rounded-3xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-3xl font-black text-primary">
                                    {initials}
                                </div>
                                <div className="absolute -bottom-2 -right-2 h-7 w-7 bg-emerald-500 rounded-full border-2 border-[#111214] flex items-center justify-center">
                                    <CheckCircle2 size={12} className="text-white" />
                                </div>
                            </div>

                            {/* Name & meta */}
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mb-1">My Account</p>
                                <h1 className="text-3xl md:text-4xl font-display font-light text-white tracking-tight">{currentUser.name}</h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                                    <span className="flex items-center gap-1.5 text-white/40 text-xs"><Mail size={11} />{currentUser.email}</span>
                                    <span className="flex items-center gap-1.5 text-white/40 text-xs"><Phone size={11} />{currentUser.phone}</span>
                                    {currentUser.address && <span className="flex items-center gap-1.5 text-white/40 text-xs"><MapPin size={11} />{currentUser.address}</span>}
                                </div>
                            </div>

                            {/* Sign out */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-white/30 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-colors border border-white/10 hover:border-rose-400/30 px-4 py-2.5 rounded-xl"
                            >
                                <LogOut size={13} /> Sign Out
                            </button>
                        </div>

                        {/* Stats row */}
                        <div className="flex gap-6 mt-10 pt-8 border-t border-white/5">
                            {stats.map(stat => (
                                <div key={stat.label}>
                                    <p className="text-2xl font-black text-white">{stat.value}</p>
                                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex gap-0 border-b border-gray-200 mt-0">
                        {([
                            { id: "reservations" as Tab, label: "My Reservations", icon: Calendar },
                            { id: "profile" as Tab, label: "Edit Profile", icon: Settings },
                        ]).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-6 py-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all -mb-px ${activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-400 hover:text-gray-700"
                                    }`}
                            >
                                <tab.icon size={13} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="max-w-5xl mx-auto px-6 py-10">

                    {/* RESERVATIONS TAB */}
                    {activeTab === "reservations" && (
                        <div>
                            {myReservations.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-5">
                                        <Package size={28} className="text-gray-200" />
                                    </div>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">No reservations yet</p>
                                    <p className="text-gray-300 text-xs italic mb-8">Browse collection and reserve your fitting.</p>
                                    <Link to="/shop">
                                        <Button className="rounded-2xl bg-[#111214] text-white h-11 px-8 uppercase tracking-widest text-xs font-black hover:bg-primary transition-all gap-2">
                                            Browse Collection <ChevronRight size={13} />
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myReservations.map(res => {
                                        const variant = erp.variants.find(v => v.id === res.product_variant_id);
                                        const product = erp.products.find(p => p.id === (variant?.product_id || res.product_variant_id));
                                        const status = statusConfig[res.status] || { label: res.status, bg: "bg-gray-100", text: "text-gray-500", icon: null };

                                        return (
                                            <div
                                                key={res.id}
                                                className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:shadow-md transition-shadow"
                                            >
                                                {/* Product image */}
                                                <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                                    <img
                                                        src={product?.images?.[0] || "/placeholder.svg"}
                                                        className="h-full w-full object-cover"
                                                        alt={product?.name || "Product"}
                                                    />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 text-base truncate">{product?.name || "Boutique Item"}</p>
                                                    {variant && (
                                                        <p className="text-gray-400 text-xs mt-0.5">Size: {variant.size} · SKU: {variant.sku}</p>
                                                    )}
                                                    {res.notes && (
                                                        <p className="text-gray-400 text-xs mt-1 italic truncate">{res.notes}</p>
                                                    )}
                                                    <p className="text-gray-300 text-[10px] mt-2 font-medium">
                                                        {new Date(res.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                                                    </p>
                                                </div>

                                                {/* Status & payment */}
                                                <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                                                    <span className={`inline-flex items-center gap-1.5 ${status.bg} ${status.text} text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full`}>
                                                        {status.icon} {status.label}
                                                    </span>
                                                    {res.prepayment_amount && res.prepayment_amount > 0 && (
                                                        <p className="text-[10px] text-emerald-600 font-black">
                                                            ETB {res.prepayment_amount.toLocaleString()} Paid
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === "profile" && (
                        <div className="max-w-lg">
                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
                                    <h2 className="text-base font-black uppercase tracking-widest text-gray-800">Personal Details</h2>
                                    {!editMode ? (
                                        <button
                                            onClick={() => setEditMode(true)}
                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setEditMode(false)}
                                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600"
                                            ><X size={12} /> Cancel</button>
                                            <button
                                                onClick={handleSaveProfile}
                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-primary px-4 py-2 rounded-xl hover:bg-primary/90 transition"
                                            ><Save size={12} /> Save</button>
                                        </div>
                                    )}
                                </div>

                                {/* Fields */}
                                <div className="px-8 py-6 space-y-5">
                                    {[
                                        { label: "Full Name", key: "name", type: "text", placeholder: "Your full name" },
                                        { label: "Phone Number", key: "phone", type: "tel", placeholder: "+251 911 000 000" },
                                        { label: "Delivery Address", key: "address", type: "text", placeholder: "Addis Ababa, Ethiopia" },
                                    ].map(field => (
                                        <div key={field.key}>
                                            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1.5">{field.label}</label>
                                            {editMode ? (
                                                <input
                                                    type={field.type}
                                                    value={profileForm[field.key as keyof typeof profileForm]}
                                                    onChange={e => setProfileForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                    placeholder={field.placeholder}
                                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-700 font-medium h-11 flex items-center px-4 rounded-xl bg-gray-50">
                                                    {profileForm[field.key as keyof typeof profileForm] || <span className="text-gray-300 italic text-xs">Not set</span>}
                                                </p>
                                            )}
                                        </div>
                                    ))}

                                    {/* Read-only fields */}
                                    <div>
                                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1.5">Email Address</label>
                                        <p className="text-sm text-gray-400 h-11 flex items-center px-4 rounded-xl bg-gray-50 italic">{currentUser.email}</p>
                                        <p className="text-[10px] text-gray-300 mt-1 ml-1">Email cannot be changed after registration</p>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1.5">Member Since</label>
                                        <p className="text-sm text-gray-700 font-medium h-11 flex items-center px-4 rounded-xl bg-gray-50">
                                            {new Date(currentUser.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Account;
