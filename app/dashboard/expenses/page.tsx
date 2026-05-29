"use client";

import { useState } from "react";
import { useStore, Expense } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit, Calendar, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DeleteModal } from "@/components/ui/delete-modal";
import { DatePicker } from "@/components/ui/date-picker";

const CATEGORIES = [
    "Food",
    "Bills",
    "Fuel",
    "Entertainment",
    "Travel",
    "Others",
];

export default function ExpensesPage() {
    const { expenses, addExpense, updateExpense, deleteExpense } = useStore();

    // Dialog controls
    const [open, setOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>("all");

    // Proper Delete Modal controls
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetDeleteId, setTargetDeleteId] = useState("");
    const [targetDeleteName, setTargetDeleteName] = useState("");

    // Form states
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Food");
    const [date, setDate] = useState("");

    // AI Smart Add
    const [smartText, setSmartText] = useState("");
    const [smartLoading, setSmartLoading] = useState(false);

    const handleSmartAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!smartText.trim() || smartLoading) return;
        setSmartLoading(true);
        try {
            const res = await fetch("/api/ai-parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: smartText }),
            });
            const data = await res.json();
            if (data.expense && data.expense.amount > 0) {
                addExpense({
                    id: String(Date.now()),
                    title: data.expense.title || "Expense",
                    amount: Number(data.expense.amount),
                    category: data.expense.category || "Others",
                    date:
                        data.expense.date ||
                        new Date().toISOString().split("T")[0],
                });
                toast.success(
                    `Added: ${data.expense.title} — ₹${Number(data.expense.amount).toLocaleString()} (${data.expense.category})`,
                );
                setSmartText("");
            } else {
                toast.error(
                    "Couldn't understand that. Try: 'spent 500 on groceries'",
                );
            }
        } catch {
            toast.error("AI parsing failed. Please try the manual form.");
        } finally {
            setSmartLoading(false);
        }
    };

    const openAddDialog = () => {
        setEditingExpense(null);
        setTitle("");
        setAmount("");
        setCategory("Food");
        setDate(new Date().toISOString().split("T")[0]);
        setOpen(true);
    };

    const openEditDialog = (expense: Expense) => {
        setEditingExpense(expense);
        setTitle(expense.title);
        setAmount(String(expense.amount));
        setCategory(expense.category);
        setDate(expense.date);
        setOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !amount || !date || !category) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const payload: Expense = {
            id: editingExpense ? editingExpense.id : String(Date.now()),
            title,
            amount: Number(amount),
            category,
            date,
        };

        if (editingExpense) {
            updateExpense(payload);
            toast.success("Expense updated successfully!");
        } else {
            addExpense(payload);
            toast.success("Expense logged successfully!");
        }

        setOpen(false);
    };

    const triggerDelete = (id: string, name: string) => {
        setTargetDeleteId(id);
        setTargetDeleteName(name);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteExpense(targetDeleteId);
        toast.success("Expense deleted successfully!");
    };

    // Generate unique list of months present in expenses for filtering
    const monthsList = Array.from(
        new Set(
            expenses.map((exp) => {
                // e.g. "2026-05-15" -> "2026-05"
                return exp.date.substring(0, 7);
            }),
        ),
    ).sort();

    const formatMonthName = (monthStr: string) => {
        const [year, month] = monthStr.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        return dateObj.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    };

    // Filter expenses
    const filteredExpenses = expenses.filter((exp) => {
        if (selectedMonth === "all") return true;
        return exp.date.startsWith(selectedMonth);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Expense Tracker
                    </h2>
                    <p className="text-muted-foreground">
                        Monitor and filter your daily expenses and categories.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Month Wise Filter */}
                    <div className="w-[180px]">
                        <Select
                            value={selectedMonth}
                            onValueChange={(val) =>
                                val && setSelectedMonth(val)
                            }
                        >
                            <SelectTrigger>
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Filter by Month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {monthsList.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {formatMonthName(m)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={openAddDialog}>
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </div>
            </div>

            {/* AI Smart Add */}
            <Card className="glassmorphism border-violet-500/20">
                <CardContent className="py-4">
                    <form
                        onSubmit={handleSmartAdd}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                        <div className="flex items-center gap-2 flex-1">
                            <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
                            <input
                                value={smartText}
                                onChange={(e) => setSmartText(e.target.value)}
                                placeholder="Smart Add: type 'spent 500 on groceries yesterday'"
                                className="flex-1 h-10 px-2 bg-transparent text-sm outline-none"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={smartLoading || !smartText.trim()}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        >
                            {smartLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" /> AI Add
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="glassmorphism">
                <CardHeader>
                    <CardTitle>
                        {selectedMonth === "all"
                            ? "All Recent Expenses"
                            : `${formatMonthName(selectedMonth)} Expenses`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">
                                        Amount (₹)
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExpenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell className="font-medium">
                                            {expense.title}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {expense.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{expense.date}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            ₹{expense.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    openEditDialog(expense)
                                                }
                                                title="Edit Expense"
                                            >
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    triggerDelete(
                                                        expense.id,
                                                        expense.title,
                                                    )
                                                }
                                                title="Delete Expense"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredExpenses.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center text-muted-foreground py-8"
                                        >
                                            No expenses logged for this period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="glassmorphism max-w-md w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {editingExpense
                                ? "Edit Expense Details"
                                : "Log New Expense"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingExpense
                                ? "Modify your logged spending details."
                                : "Enter transaction details below to log a new expense."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Groceries"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="amount">Amount (₹) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="1200"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Category *</Label>
                                <Select
                                    value={category}
                                    onValueChange={(val) =>
                                        val && setCategory(val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="date">Date *</Label>
                            <DatePicker
                                id="date"
                                value={date}
                                onChange={(val) => setDate(val)}
                                placeholder="Select date"
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
                                {editingExpense
                                    ? "Save Changes"
                                    : "Log Expense"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Expense Record"
                itemName={targetDeleteName}
                description="Are you sure you want to permanently delete this logged expense from your statement? This will update your monthly budget summary."
            />
        </div>
    );
}
