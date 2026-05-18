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
import { Wallet } from "lucide-react";
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
            if (!isFirebaseConfigured) {
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
            toast.error(
                error.message ||
                    "Sign up failed. Ensure Email Auth Provider is enabled.",
            );
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
                toast.success(
                    `Welcome to Cash ERP, ${result.user.displayName || "User"}!`,
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
            <Card className="w-full max-w-md glassmorphism border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Decorative backdrop glow */}
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl" />

                <CardHeader className="space-y-1 text-center relative z-10">
                    <div className="flex justify-center mb-4">
                        <Logo iconSize={48} />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                        Create an account
                    </CardTitle>
                    <CardDescription>
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleEmailSignUp}>
                    <CardContent className="space-y-4 relative z-10">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-background/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background/40"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-3 relative z-10">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </Button>

                        <div className="relative flex py-2 items-center w-full">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase tracking-wider">
                                or continue with
                            </span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full bg-background/30 hover:bg-background/50 border-white/10 flex items-center justify-center gap-2 group transition-all duration-300"
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                        >
                            <svg
                                className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <g transform="matrix(1, 0, 0, 1, 0, 0)">
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
                                        strokeWidth="0"
                                    />
                                    <path
                                        d="M12,5.78c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.09 14.43,2.2 12,2.2C8.01,2.2 4.52,4.09 3.04,7.08l3.93,3.05C7.67,7.36 9.66,5.78 12,5.78z"
                                        fill="#EA4335"
                                    />
                                </g>
                            </svg>
                            <span className="font-medium">
                                Sign up with Google
                            </span>
                        </Button>

                        <div className="text-xs text-center text-muted-foreground pt-2">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-primary hover:underline font-medium"
                            >
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
