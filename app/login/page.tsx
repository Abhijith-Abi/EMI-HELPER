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
import { Wallet } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import {
    auth,
    googleProvider,
    isFirebaseConfigured,
} from "@/lib/firebase/config";
import { useStore } from "@/store";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";

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
                toast.success("Logged in successfully");
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
        <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
            <Card className="w-full max-w-sm glassmorphism border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl" />

                <CardHeader className="space-y-1 text-center relative z-10 pb-2">
                    <div className="flex justify-center mb-4">
                        <Logo iconSize={56} />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Cash ERP
                    </CardTitle>
                    <CardDescription>
                        Sign in to manage your finances
                    </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 pt-4 pb-6">
                    <Button
                        type="button"
                        className="w-full h-12 text-base font-medium flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm transition-all duration-200"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <span>Signing in...</span>
                        ) : (
                            <>
                                <svg
                                    className="h-5 w-5 shrink-0"
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
                                <span>Continue with Google</span>
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
