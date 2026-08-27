"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { signInWithPopup } from "firebase/auth";
import {
    auth,
    googleProvider,
    isFirebaseConfigured,
} from "@/lib/firebase/config";
import { useStore } from "@/store";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const { loginUser, user } = useStore();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (user && user.id && user.id !== "1") {
            window.location.href = "/dashboard";
        }
    }, [user, mounted]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            if (!isFirebaseConfigured || !auth) {
                await loginUser({
                    uid: "mock-google-uid-12345",
                    displayName: "Abhijith Dev",
                    email: "abhijith@example.com",
                });
                toast.success("Welcome to Cash ERP!");
                window.location.href = "/dashboard";
                return;
            }

            const result = await signInWithPopup(auth, googleProvider);
            if (result.user) {
                await loginUser(result.user);
                toast.success(
                    `Welcome back, ${result.user.displayName || result.user.email}!`,
                );
                window.location.href = "/dashboard";
            }
        } catch (error: any) {
            console.error("Google Auth failed:", error);
            toast.error(error.message || "Google Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#07090e] p-4 relative overflow-hidden">
            {/* Ambient background glowing orbs */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />

            <Card className="w-full max-w-sm glassmorphism-glow border-white/[0.1] shadow-2xl relative overflow-hidden text-white">
                <CardHeader className="space-y-2 text-center relative z-10 pb-2">
                    <div className="flex justify-center mb-3">
                        <Logo iconSize={56} />
                    </div>
                    <CardTitle className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-white">
                        Cash ERP
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                        Next-Gen Debt Amortization & Personal Finance Suite
                    </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 pt-4 pb-6 space-y-4">
                    <Button
                        type="button"
                        className="w-full h-11 text-xs font-semibold flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 border border-transparent shadow-lg shadow-white/5 transition-all duration-200 cursor-pointer rounded-xl"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <span>Authenticating...</span>
                        ) : (
                            <>
                                <svg
                                    className="h-4 w-4 shrink-0"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.29c1.93,-1.78 3.04,-4.4 3.04,-7.48C21.67,11.83 21.56,11.43 21.35,11.1z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12,20.9c2.43,0 4.47,-0.8 5.96,-2.18l-3.29,-2.56c-0.9,0.6 -2.07,0.97 -3.29,0.97c-2.34,0 -4.33,-1.58 -5.03,-3.7H3.04v2.64C4.52,19.01 8.01,20.9 12,20.9z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M6.97,13.53C6.79,13.03 6.69,12.5 6.69,11.95s0.1,-1.08 0.28,-1.58V7.73H3.04C2.42,8.97 2.07,10.37 2.07,11.95s0.35,2.98 0.97,4.22L6.97,13.53z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12,5.78c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.09 14.43,2.2 12,2.2C8.01,2.2 4.52,4.09 3.04,7.08l3.93,3.05C7.67,7.36 9.66,5.78 12,5.78z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                <span>Sign In with Google</span>
                            </>
                        )}
                    </Button>

                    <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Encrypted Firebase Cloud Storage</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
