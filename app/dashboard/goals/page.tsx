"use client";

import { useState, useMemo } from "react";
import { useStore, Goal } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Edit2, Trash2, PiggyBank, Sparkles, CheckCircle2, Trophy, Clock } from "lucide-react";
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
    const { goals, addGoal, updateGoal, deleteGoal, addToGoalSavings } = useStore();

    // Dialog controls
    const [open, setOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    // Add Savings dialog
    const [savingsOpen, setSavingsOpen] = useState(false);
    const [savingsGoal, setSavingsGoal] = useState<Goal | null>(null);
    const [contribution, setContribution] = useState("");
    const [deductAsExpense, setDeductAsExpense] = useState(false);

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

    const openSavingsDialog = (goal: Goal) => {
        setSavingsGoal(goal);
        setContribution("");
        setDeductAsExpense(false);
        setSavingsOpen(true);
    };

    const handleAddSavings = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = Number(contribution);
        if (!savingsGoal || amt <= 0) {
            toast.error("Enter a valid contribution amount.");
            return;
        }

        addToGoalSavings(savingsGoal.id, amt, deductAsExpense);
        const newTotal = savingsGoal.saved_amount + amt;
        if (newTotal >= savingsGoal.target_amount) {
            toast.success(`🎉 Hurray! You've achieved your goal "${savingsGoal.title}"!`);
        } else {
            toast.success(`Added ₹${amt.toLocaleString()} to "${savingsGoal.title}"!`);
        }
        setSavingsOpen(false);
    };

    // Summary calculations
    const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target_amount, 0), [goals]);
    const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.saved_amount, 0), [goals]);
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const completedGoals = goals.filter((g) => g.saved_amount >= g.target_amount).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Target className="h-6 w-6 text-emerald-400" />
                        Financial Milestones & Goals
                    </h2>
                    <p className="text-sm text-slate-400">
                        Set capital targets, build emergency funds, and track savings progress.
                    </p>
                </div>
                <Button
                    onClick={openAddDialog}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-9 shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="mr-1.5 h-4 w-4" /> Create Goal
                </Button>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Accumulated Savings</span>
                        <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                            <PiggyBank className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
                        ₹{totalSaved.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Across all financial targets
                    </p>
                </Card>

                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Total Goal Target</span>
                        <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                            <Target className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white font-mono">
                        ₹{totalTarget.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {goals.length} active target{goals.length === 1 ? "" : "s"}
                    </p>
                </Card>

                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Completion Rate</span>
                        <div className="p-2 rounded-lg bg-violet-500/15 text-violet-400">
                            <Trophy className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-violet-300 font-mono">
                        {overallProgress}%
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {completedGoals} achieved milestone{completedGoals === 1 ? "" : "s"}
                    </p>
                </Card>

                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Target Deficit</span>
                        <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-amber-300 font-mono">
                        ₹{Math.max(0, totalTarget - totalSaved).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Remaining capital to fund
                    </p>
                </Card>
            </div>

            {/* Goals Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((goal) => {
                    const progress = Math.min(
                        100,
                        Math.round((goal.saved_amount / (goal.target_amount || 1)) * 100),
                    );
                    const isCompleted = progress >= 100;

                    return (
                        <Card
                            key={goal.id}
                            className={`glassmorphism border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between ${
                                isCompleted ? "bg-emerald-950/20 border-emerald-500/30" : ""
                            }`}
                        >
                            <CardHeader className="p-5 pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                            {isCompleted && <Trophy className="h-4 w-4 text-amber-400" />}
                                            {goal.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Target: {goal.deadline}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                                            onClick={() => openEditDialog(goal)}
                                            title="Edit Goal"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                            onClick={() => triggerDelete(goal.id, goal.title)}
                                            title="Delete Goal"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-5 pt-0 space-y-4">
                                <div>
                                    <div className="flex items-baseline justify-between mb-1.5">
                                        <span className="text-2xl font-bold font-mono text-white">
                                            ₹{goal.saved_amount.toLocaleString()}
                                        </span>
                                        <span className="text-xs font-mono text-slate-400">
                                            / ₹{goal.target_amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress
                                        value={progress}
                                        className="h-2 bg-slate-800"
                                    />
                                    <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                                        <span className="font-semibold text-emerald-400">{progress}% funded</span>
                                        <span>
                                            ₹{Math.max(0, goal.target_amount - goal.saved_amount).toLocaleString()} left
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => openSavingsDialog(goal)}
                                    variant="outline"
                                    size="sm"
                                    className={`w-full h-8 text-xs font-semibold rounded-lg transition-all ${
                                        isCompleted
                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                            : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
                                    }`}
                                >
                                    <PiggyBank className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                                    {isCompleted ? "Add Bonus Savings 🎉" : "Contribute to Goal"}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}

                {goals.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl glassmorphism">
                        <Target className="h-10 w-10 mx-auto mb-2 text-slate-600 opacity-60" />
                        <p className="text-sm font-medium text-slate-400">No active savings goals found.</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Click &quot;Create Goal&quot; to begin building your emergency fund or dream purchase.
                        </p>
                    </div>
                )}
            </div>

            {/* Add / Edit Goal Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md w-full">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle>
                                    {editingGoal ? "Edit Savings Milestone" : "Create New Goal"}
                                </DialogTitle>
                                <DialogDescription>
                                    Establish a target savings amount and target completion date.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="goal-title" className="text-xs text-slate-300 font-semibold">
                                Goal Title *
                            </Label>
                            <Input
                                id="goal-title"
                                placeholder="e.g. Emergency Fund (6 Months), Vacation, House Downpayment"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl text-xs font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="target-amount" className="text-xs text-slate-300 font-semibold">
                                    Target (₹) *
                                </Label>
                                <Input
                                    id="target-amount"
                                    type="number"
                                    placeholder="300000"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl font-mono font-bold text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="saved-amount" className="text-xs text-slate-300 font-semibold">
                                    Currently Saved (₹) *
                                </Label>
                                <Input
                                    id="saved-amount"
                                    type="number"
                                    placeholder="50000"
                                    value={savedAmount}
                                    onChange={(e) => setSavedAmount(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl font-mono font-bold text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="goal-deadline" className="text-xs text-slate-300 font-semibold">
                                Target Date *
                            </Label>
                            <DatePicker
                                id="goal-deadline"
                                value={deadline}
                                onChange={(val) => setDeadline(val)}
                                placeholder="Select deadline"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="border-white/10 text-slate-300 hover:bg-white/[0.08] rounded-xl h-10 px-5 text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl h-10 px-6 shadow-lg shadow-emerald-600/30"
                            >
                                {editingGoal ? "Save Changes" : "Create Goal"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Quick Contribution Dialog */}
            <Dialog open={savingsOpen} onOpenChange={setSavingsOpen}>
                <DialogContent className="max-w-sm w-full">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                                <PiggyBank className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle>Add Savings Deposit</DialogTitle>
                                <DialogDescription>
                                    {savingsGoal &&
                                        `Target "${savingsGoal.title}" (₹${savingsGoal.saved_amount.toLocaleString()} / ₹${savingsGoal.target_amount.toLocaleString()})`}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleAddSavings} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="contrib-amount" className="text-xs text-slate-300 font-semibold">
                                Amount to Add (₹) *
                            </Label>
                            <Input
                                id="contrib-amount"
                                type="number"
                                placeholder="5000"
                                value={contribution}
                                onChange={(e) => setContribution(e.target.value)}
                                className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 text-base font-mono font-bold h-11 rounded-xl"
                                autoFocus
                                required
                            />
                        </div>

                        {/* Quick preset buttons */}
                        <div className="flex gap-2">
                            {[1000, 5000, 10000].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setContribution(String(preset))}
                                    className="flex-1 text-xs py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 font-semibold transition-all cursor-pointer"
                                >
                                    +₹{preset.toLocaleString()}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                id="deductExpense"
                                type="checkbox"
                                checked={deductAsExpense}
                                onChange={(e) => setDeductAsExpense(e.target.checked)}
                                className="rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <Label htmlFor="deductExpense" className="text-xs text-slate-400 cursor-pointer">
                                Also log as expense (Category: Savings)
                            </Label>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSavingsOpen(false)}
                                className="border-white/10 text-slate-300 hover:bg-white/[0.08] rounded-xl h-10 px-4 text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl h-10 px-5 shadow-lg shadow-emerald-600/30"
                            >
                                Deposit Savings
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
