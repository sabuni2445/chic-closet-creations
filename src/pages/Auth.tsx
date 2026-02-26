import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowRight, Star, CalendarCheck, Package, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type Mode = "login" | "register";

const perks = [
    { icon: CalendarCheck, text: "Reserve exclusive fittings instantly" },
    { icon: Package, text: "Track all your orders in one place" },
    { icon: Star, text: "Wishlist your favourite pieces" },
    { icon: ShieldCheck, text: "Secure & private account" },
];

const Auth = () => {
    const navigate = useNavigate();
    const { login, register } = useAuthStore();
    const [mode, setMode] = useState<Mode>("login");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (mode === "login") {
            const result = login(form.email, form.password);
            if (result.success) { toast.success("Welcome back!"); navigate("/account"); }
            else toast.error(result.error);
        } else {
            if (!form.name || !form.email || !form.phone || !form.password) { toast.error("Please fill in all fields."); setLoading(false); return; }
            if (form.password !== form.confirm) { toast.error("Passwords do not match."); setLoading(false); return; }
            if (form.password.length < 6) { toast.error("Password must be at least 6 characters."); setLoading(false); return; }
            const result = register(form.name, form.email, form.phone, form.password);
            if (result.success) { toast.success("Account created! Welcome."); navigate("/account"); }
            else toast.error(result.error);
        }
        setLoading(false);
    };

    const switchMode = (m: Mode) => { setMode(m); setForm({ name: "", email: "", phone: "", password: "", confirm: "" }); };

    return (
        <div className="min-h-screen flex">
            {/* ── Left Panel ── */}
            <div className="hidden lg:flex w-[45%] bg-[#111214] relative overflow-hidden flex-col">
                {/* Ambient glows */}
                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/25 rounded-full blur-[130px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10 p-12">
                    <Link to="/">
                        <img src={logo} alt="Rina's Closet" className="h-16 w-auto object-contain rounded-full mix-blend-luminosity opacity-90 hover:opacity-100 transition" />
                    </Link>
                </div>

                {/* Hero text */}
                <div className="relative z-10 flex-1 flex flex-col justify-center px-14 pb-20">
                    <p className="text-primary/70 text-[10px] font-black uppercase tracking-[0.4em] mb-5">Your Private Access</p>
                    <h1 className="text-5xl font-display font-light text-white leading-[1.15] tracking-tight mb-8">
                        Luxury<br />
                        <span className="text-primary">Boutique</span><br />
                        Experience
                    </h1>
                    <p className="text-white/30 text-sm leading-relaxed max-w-sm mb-14">
                        Join Rina's Closet to reserve fittings, track your wardrobe, and get first access to new arrivals.
                    </p>

                    {/* Perks list */}
                    <div className="space-y-4">
                        {perks.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-4">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                    <Icon size={15} className="text-primary" />
                                </div>
                                <span className="text-white/50 text-sm">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom strip */}
                <div className="relative z-10 px-14 pb-10">
                    <div className="border-t border-white/5 pt-6">
                        <p className="text-white/20 text-[10px] uppercase tracking-widest">Chic Closet Creations · Est. 2024</p>
                    </div>
                </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="flex-1 flex flex-col bg-[#FDFCF9]">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-between p-6 border-b border-gray-100">
                    <Link to="/">
                        <img src={logo} alt="Rina's Closet" className="h-10 w-auto object-contain rounded-full" />
                    </Link>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12">
                    <div className="w-full max-w-[400px]">

                        {/* Heading */}
                        <div className="mb-10">
                            <h2 className="text-3xl font-display font-light text-gray-900 tracking-tight leading-tight">
                                {mode === "login" ? "Welcome back" : "Create account"}
                            </h2>
                            <p className="text-gray-400 text-sm mt-2">
                                {mode === "login"
                                    ? "Sign in to access your boutique account."
                                    : "Join the family and enjoy exclusive access."}
                            </p>
                        </div>

                        {/* Mode toggle pills */}
                        <div className="flex p-1 bg-gray-100 rounded-2xl mb-8 gap-1">
                            {(["login", "register"] as Mode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className={`flex-1 py-2.5 text-[11px] uppercase font-black tracking-widest rounded-xl transition-all duration-200 ${mode === m ? "bg-[#111214] text-white shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    {m === "login" ? "Sign In" : "Register"}
                                </button>
                            ))}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {mode === "register" && (
                                <div className="group">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-focus-within:text-primary transition-colors">Full Name</label>
                                    <input
                                        name="name" value={form.name} onChange={handleChange}
                                        placeholder="Sebrina Kedir" autoComplete="name"
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    />
                                </div>
                            )}

                            <div className="group">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-focus-within:text-primary transition-colors">Email Address</label>
                                <input
                                    name="email" type="email" value={form.email} onChange={handleChange}
                                    placeholder="you@example.com" autoComplete="email"
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>

                            {mode === "register" && (
                                <div className="group">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-focus-within:text-primary transition-colors">Phone Number</label>
                                    <input
                                        name="phone" type="tel" value={form.phone} onChange={handleChange}
                                        placeholder="+251 911 000 000" autoComplete="tel"
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    />
                                </div>
                            )}

                            <div className="group">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-focus-within:text-primary transition-colors">Password</label>
                                <div className="relative">
                                    <input
                                        name="password" type={showPassword ? "text" : "password"}
                                        value={form.password} onChange={handleChange}
                                        placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"}
                                        className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {mode === "register" && (
                                <div className="group">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-focus-within:text-primary transition-colors">Confirm Password</label>
                                    <input
                                        name="confirm" type={showPassword ? "text" : "password"}
                                        value={form.confirm} onChange={handleChange}
                                        placeholder="••••••••" autoComplete="new-password"
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    />
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-13 mt-1 bg-[#111214] hover:bg-primary text-white font-black uppercase tracking-widest rounded-2xl text-[11px] shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-3 py-4"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" /> Processing…</span>
                                    ) : (
                                        <>{mode === "login" ? "Sign In to My Account" : "Create My Account"} <ArrowRight size={15} /></>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Switch mode link */}
                        <p className="text-center text-xs text-gray-400 mt-6">
                            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => switchMode(mode === "login" ? "register" : "login")}
                                className="text-primary font-black hover:underline underline-offset-2">
                                {mode === "login" ? "Create one free" : "Sign in"}
                            </button>
                        </p>

                        {/* Back to shop */}
                        <div className="mt-10 text-center">
                            <Link to="/" className="text-[10px] uppercase font-black text-gray-300 tracking-widest hover:text-gray-500 transition-colors">
                                ← Return to Boutique
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
