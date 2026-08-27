"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Save, User, Settings, ShieldAlert, Sparkles } from "lucide-react";

export default function SettingsPage() {
    const { user, updateUser, clearAllData } = useStore();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [salary, setSalary] = useState(0);
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (user && !hasInitialized) {
            setName(user.name || "");
            setEmail(user.email || "");
            setSalary(user.salary || 0);
            setHasInitialized(true);
        }
    }, [user, hasInitialized]);

    const handleSave = () => {
        updateUser(name, email, Number(salary));
        toast.success("Profile details saved successfully!");
    };

    const handleClear = () => {
        if (
            confirm(
                "Are you sure you want to clear all data? This will wipe all EMIs, expenses, goals, and reset your ledger.",
            )
        ) {
            clearAllData();
            toast.info("All data cleared. Fresh start initialized!");
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Settings className="h-6 w-6 text-indigo-400" />
                    Account & Financial Preferences
                </h2>
                <p className="text-sm text-slate-400">
                    Configure your net monthly income, profile credentials, and app preferences.
                </p>
            </div>

            {/* Profile & Salary Card */}
            <Card className="glassmorphism border-white/[0.08]">
                <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-400" />
                        Financial Profile
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                        Monthly salary is used across the dashboard and AI engines for ratios.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs text-slate-300">
                            Full Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs text-slate-300">
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="salary" className="text-xs text-slate-300">
                            Net Monthly Salary (₹)
                        </Label>
                        <Input
                            id="salary"
                            type="number"
                            value={salary || ""}
                            onChange={(e) => setSalary(Number(e.target.value))}
                            className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 font-mono font-bold text-base"
                        />
                    </div>
                    <Button
                        onClick={handleSave}
                        className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-9 shadow-md shadow-indigo-600/20"
                    >
                        <Save className="mr-1.5 h-4 w-4" /> Save Profile Settings
                    </Button>
                </CardContent>
            </Card>

            {/* Currency Preference */}
            <Card className="glassmorphism border-white/[0.08]">
                <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                        Regional & Currency Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Display Currency</Label>
                        <Select defaultValue="INR">
                            <SelectTrigger className="bg-slate-900/60 border-white/10 text-white text-xs">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white text-xs">
                                <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                                <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                                <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
                                <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-rose-500/30 bg-rose-500/[0.04] glassmorphism">
                <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base font-bold text-rose-400 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-xs text-rose-300/70">
                        Permanently clear all local and cloud storage data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                    <Button
                        variant="destructive"
                        onClick={handleClear}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs h-9"
                    >
                        <Trash2 className="mr-1.5 h-4 w-4" /> Reset All Data (Fresh Start)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
