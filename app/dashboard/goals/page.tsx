"use client";

import { useState } from "react";
import { useStore, Goal } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Edit2, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DeleteModal } from "@/components/ui/delete-modal";
import { DatePicker } from "@/components/ui/date-picker";

export default function GoalsPage() {
    const { goals, addGoal, updateGoal, deleteGoal } = useStore();

    // Dialog controls
    const [open, setOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    // Proper Delete Modal controls
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetDeleteId, setTargetDeleteId] = useState("");
    const [targetDeleteName, setTargetDeleteName] = useState("");

    // Form states
    const [title, setTitle] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [savedAmount, setSavedAmount] = useState("");
    const [deadline, setDeadline] = useState("");

    const openAddDialog = () => {
        setEditingGoal(null);
        setTitle("");
        setTargetAmount("");
        setSavedAmount("");
        setDeadline(new Date().toISOString().split("T")[0]);
        setOpen(true);
    };

    const openEditDialog = (goal: Goal) => {
        setEditingGoal(goal);
        setTitle(goal.title);
        setTargetAmount(String(goal.target_amount));
        setSavedAmount(String(goal.saved_amount));
        setDeadline(goal.deadline);
        setOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !targetAmount || !savedAmount || !deadline) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const payload: Goal = {
            id: editingGoal ? editingGoal.id : String(Date.now()),
            title,
            target_amount: Number(targetAmount),
            saved_amount: Number(savedAmount),
            deadline,
        };

        if (editingGoal) {
            updateGoal(payload);
            toast.success("Savings goal updated successfully!");
        } else {
            addGoal(payload);
            toast.success("Savings goal created successfully!");
        }

        setOpen(false);
    };

    const triggerDelete = (id: string, name: string) => {
        setTargetDeleteId(id);
        setTargetDeleteName(name);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteGoal(targetDeleteId);
        toast.success("Savings goal deleted successfully!");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Financial Goals
                    </h2>
                    <p className="text-muted-foreground">
                        Set targets and track your savings progress.
                    </p>
                </div>
                <Button onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" /> New Goal
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((goal) => {
                    const progress = Math.min(
                        100,
                        Math.round(
                            (goal.saved_amount / goal.target_amount) * 100,
                        ),
                    );

                    return (
                        <Card
                            key={goal.id}
                            className="glassmorphism relative group"
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium pr-10">
                                    {goal.title}
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                        onClick={() => openEditDialog(goal)}
                                        title="Edit Goal"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() =>
                                            triggerDelete(goal.id, goal.title)
                                        }
                                        title="Delete Goal"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-2">
                                    ₹{goal.saved_amount.toLocaleString()}{" "}
                                    <span className="text-sm text-muted-foreground font-normal">
                                        / ₹{goal.target_amount.toLocaleString()}
                                    </span>
                                </div>
                                <Progress
                                    value={progress}
                                    className="h-2 mb-2"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{progress}% Completed</span>
                                    <span>Deadline: {goal.deadline}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {goals.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl border-dashed glassmorphism">
                        No active goals. Start planning your future!
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="glassmorphism max-w-md w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGoal
                                ? "Edit Savings Goal"
                                : "Create Savings Goal"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingGoal
                                ? "Adjust your targets or savings balance."
                                : "Establish a new financial milestone and savings target."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="title">Goal Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Emergency Fund"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="targetAmount">
                                    Target Amount (₹) *
                                </Label>
                                <Input
                                    id="targetAmount"
                                    type="number"
                                    placeholder="300000"
                                    value={targetAmount}
                                    onChange={(e) =>
                                        setTargetAmount(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="savedAmount">
                                    Currently Saved (₹) *
                                </Label>
                                <Input
                                    id="savedAmount"
                                    type="number"
                                    placeholder="50000"
                                    value={savedAmount}
                                    onChange={(e) =>
                                        setSavedAmount(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="deadline">Target Deadline *</Label>
                            <DatePicker
                                id="deadline"
                                value={deadline}
                                onChange={(val) => setDeadline(val)}
                                placeholder="Select deadline"
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingGoal ? "Save Changes" : "Create Goal"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Savings Goal"
                itemName={targetDeleteName}
                description="Are you sure you want to permanently delete this savings goal? All accumulated progress tracking logs will be removed."
            />
        </div>
    );
}
