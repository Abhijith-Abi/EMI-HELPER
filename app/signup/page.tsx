"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    signInWithPopup,
    createUserWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import {
    auth,
    googleProvider,
    isFirebaseConfigured,
} from "@/lib/firebase/config";
import { useStore } from "@/store";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { ShieldCheck } from "lucide-react";

export default function SignupPage() {
    const { loginUser, user } = useStore();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!isFirebaseConfigured || !auth) {
                await loginUser({
                    uid: "mock-email-uid-12345",
                    displayName: name || "Abhijith Dev",
                    email: email || "guest@example.com",
                });
                toast.success("Account created successfully");
                window.location.href = "/dashboard";
                return;
            }

            const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password,
            );
            if (result.user) {
                await updateProfile(result.user, { displayName: name });
                await loginUser(result.user);
                toast.success(`Welcome to Cash ERP, ${name}!`);
                window.location.href = "/dashboard";
            }
        } catch (error: any) {
            console.error("Email Signup failed:", error);
            toast.error(error.message || "Sign up failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setLoading(true);
        try {
            if (!isFirebaseConfigured || !auth) {
                await loginUser({
                    uid: "mock-google-uid-12345",
                    displayName: "Abhijith Dev",
                    email: "abhijith@example.com",
                });
                toast.success("Account created successfully");
                window.location.href = "/dashboard";
                return;
            }

            const result = await signInWithPopup(auth, googleProvider);
            if (result.user) {
                await loginUser(result.user);
                toast.success(`Welcome to Cash ERP, ${result.user.displayName || "User"}!`);
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
        <div className="flex min-h-screen items-center justify-center bg-[#07090e] p-4 relative overflow-hidden text-white">
            <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />

            <Card className="w-full max-w-md glassmorphism-glow border-white/[0.1] shadow-2xl relative overflow-hidden text-white">
                <CardHeader className="space-y-2 text-center relative z-10">
                    <div className="flex justify-center mb-3">
                        <Logo iconSize={48} />
                    </div>
                    <CardTitle className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-white">
                        Create an Account
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                        Join Cash ERP to track and optimize your debt amortization
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleEmailSignUp}>
                    <CardContent className="space-y-3.5 relative z-10">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs text-slate-300">
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
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
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs text-slate-300">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-3 relative z-10 pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-10 shadow-lg shadow-indigo-600/20"
                        >
                            {loading ? "Creating Profile..." : "Create Account"}
                        </Button>

                        <div className="relative flex py-1 items-center w-full">
                            <div className="flex-grow border-t border-white/[0.08]"></div>
                            <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-wider">
                                or
                            </span>
                            <div className="flex-grow border-t border-white/[0.08]"></div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200"
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                        >
                            Sign Up with Google
                        </Button>

                        <div className="text-xs text-center text-slate-400 pt-2">
                            Already have an account?{" "}
                            <Link href="/login" className="text-indigo-400 hover:underline font-semibold">
                                Sign In
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
