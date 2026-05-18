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
import { Trash2, Save } from "lucide-react";

export default function SettingsPage() {
    const { user, updateUser, clearAllData } = useStore();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [salary, setSalary] = useState(0);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Avoid hydration issues by populating state once user is loaded
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
        toast.success("Settings saved successfully!");
    };

    const handleClear = () => {
        if (
            confirm(
                "Are you sure you want to clear all data? This will wipe all EMIs, expenses, goals, and reset your profile.",
            )
        ) {
            clearAllData();
            toast.info("All data cleared. Fresh start initialized!");
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Card className="glassmorphism">
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>
                        Update your personal details and monthly salary.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="salary">Monthly Salary (₹)</Label>
                        <Input
                            id="salary"
                            type="number"
                            value={salary || ""}
                            onChange={(e) => setSalary(Number(e.target.value))}
                        />
                    </div>
                    <Button onClick={handleSave} className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </CardContent>
            </Card>

            <Card className="glassmorphism">
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                        Customize your application experience.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select defaultValue="INR">
                            <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INR">
                                    ₹ INR (Indian Rupee)
                                </SelectItem>
                                <SelectItem value="USD">
                                    $ USD (US Dollar)
                                </SelectItem>
                                <SelectItem value="EUR">
                                    € EUR (Euro)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive/30 bg-destructive/5 glassmorphism">
                <CardHeader>
                    <CardTitle className="text-destructive">
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Permanently clear your application data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={handleClear}
                        className="w-full"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
                        (Fresh Start)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
