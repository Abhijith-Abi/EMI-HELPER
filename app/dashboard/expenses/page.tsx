"use client";

import { useState, useMemo } from "react";
import { useStore, Expense } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Trash2,
    Edit,
    Calendar as CalendarIcon,
    Sparkles,
    Loader2,
    Wallet,
    TrendingUp,
    Tag,
    Receipt,
    CalendarDays,
    Clock,
    Filter,
    BarChart3,
    Layers,
    List,
} from "lucide-react";
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
    "EMI / Loan",
    "Entertainment",
    "Travel",
    "Shopping",
    "Health",
    "Savings",
    "Others",
];

const CATEGORY_COLORS: Record<string, string> = {
    Food: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Bills: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    Fuel: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    "EMI / Loan": "bg-rose-500/15 text-rose-300 border-rose-500/30",
    Entertainment: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    Travel: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    Shopping: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    Health: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Savings: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    Others: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export default function ExpensesPage() {
    const { expenses, addExpense, updateExpense, deleteExpense } = useStore();

    // Dialog controls
    const [open, setOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Date, Month & Year Filtering
    const todayStr = new Date().toISOString().split("T")[0];
    const currentYearStr = todayStr.substring(0, 4);
    const currentMonthStr = todayStr.substring(0, 7);

    const [timeframeTab, setTimeframeTab] = useState<"all" | "this_month" | "this_year" | "custom">("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

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
                    date: data.expense.date || new Date().toISOString().split("T")[0],
                });
                toast.success(
                    `Logged: ${data.expense.title} — ₹${Number(data.expense.amount).toLocaleString()} (${data.expense.category}) on ${data.expense.date}`,
                );
                setSmartText("");
            } else {
                toast.error("Couldn't parse expense. Try: 'Spent 500 on groceries today' or 'പെട്രോൾ 1000 രൂപ'");
            }
        } catch {
            toast.error("AI parsing failed. Please use the manual form.");
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
        toast.success("Expense record removed!");
    };

    // Available Years and Months extracted from ledger
    const availableYears = useMemo(() => {
        const years = new Set(expenses.map((e) => e.date.substring(0, 4)));
        if (!years.has(currentYearStr)) years.add(currentYearStr);
        return Array.from(years).sort().reverse();
    }, [expenses, currentYearStr]);

    const availableMonths = useMemo(() => {
        const months = new Set(expenses.map((e) => e.date.substring(0, 7)));
        if (!months.has(currentMonthStr)) months.add(currentMonthStr);
        return Array.from(months).sort().reverse();
    }, [expenses, currentMonthStr]);

    const formatMonthName = (monthStr: string) => {
        if (!monthStr || monthStr === "all") return "All Months";
        const [year, month] = monthStr.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        return dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    };

    // Filtered expenses based on timeframe & dropdown filters
    const filteredExpenses = useMemo(() => {
        return expenses.filter((exp) => {
            // Timeframe quick presets
            if (timeframeTab === "this_month" && !exp.date.startsWith(currentMonthStr)) {
                return false;
            }
            if (timeframeTab === "this_year" && !exp.date.startsWith(currentYearStr)) {
                return false;
            }

            // Custom dropdown filters
            if (timeframeTab === "custom" || timeframeTab === "all") {
                if (selectedYear !== "all" && !exp.date.startsWith(selectedYear)) {
                    return false;
                }
                if (selectedMonth !== "all" && !exp.date.startsWith(selectedMonth)) {
                    return false;
                }
            }

            // Category filter
            if (selectedCategory !== "all" && exp.category !== selectedCategory) {
                return false;
            }

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [
        expenses,
        timeframeTab,
        currentMonthStr,
        currentYearStr,
        selectedYear,
        selectedMonth,
        selectedCategory,
    ]);

    // Summary calculations
    const totalFilteredAmount = useMemo(
        () => filteredExpenses.reduce((s, e) => s + e.amount, 0),
        [filteredExpenses],
    );

    const thisMonthTotal = useMemo(
        () => expenses.filter((e) => e.date.startsWith(currentMonthStr)).reduce((s, e) => s + e.amount, 0),
        [expenses, currentMonthStr],
    );

    const thisYearTotal = useMemo(
        () => expenses.filter((e) => e.date.startsWith(currentYearStr)).reduce((s, e) => s + e.amount, 0),
        [expenses, currentYearStr],
    );

    const emiOutflowInPeriod = useMemo(
        () => filteredExpenses.filter((e) => e.category === "EMI / Loan").reduce((s, e) => s + e.amount, 0),
        [filteredExpenses],
    );

    // Group expenses by Date for timeline view
    const groupedByDate = useMemo(() => {
        const groups: Record<string, Expense[]> = {};
        filteredExpenses.forEach((exp) => {
            if (!groups[exp.date]) groups[exp.date] = [];
            groups[exp.date].push(exp);
        });
        return groups;
    }, [filteredExpenses]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Receipt className="h-6 w-6 text-indigo-400" />
                        Expense Ledger & Transaction Tracker
                    </h2>
                    <p className="text-sm text-slate-400">
                        Track daily, monthly, and yearly transactions with AI natural language parsing.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={openAddDialog}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-9 shadow-lg shadow-indigo-600/20 rounded-xl"
                    >
                        <Plus className="mr-1.5 h-4 w-4" /> Add Expense Entry
                    </Button>
                </div>
            </div>

            {/* AI Natural Language Quick Add Bar */}
            <Card className="glassmorphism-glow border-indigo-500/30 p-4">
                <form onSubmit={handleSmartAdd} className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                        <Input
                            placeholder="AI Smart Add (English or മലയാളം): e.g. 'Paid 1500 electricity bill yesterday' or 'പെട്രോൾ 1000 രൂപ'"
                            value={smartText}
                            onChange={(e) => setSmartText(e.target.value)}
                            disabled={smartLoading}
                            className="pl-10 h-11 bg-slate-900/90 border-white/10 text-white placeholder:text-slate-400 text-xs rounded-xl focus:border-indigo-400"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!smartText.trim() || smartLoading}
                        className="w-full sm:w-auto h-11 px-5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 rounded-xl"
                    >
                        {smartLoading ? (
                            <>
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Parsing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-1.5 h-4 w-4" /> Smart Log
                            </>
                        )}
                    </Button>
                </form>
            </Card>

            {/* Top Date/Month/Year Summary Metric Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Filtered Period Outflow</span>
                        <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white font-mono">
                        ₹{totalFilteredAmount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {filteredExpenses.length} transaction{filteredExpenses.length === 1 ? "" : "s"} recorded
                    </p>
                </Card>

                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">This Month Total ({formatMonthName(currentMonthStr)})</span>
                        <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                            <CalendarDays className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
                        ₹{thisMonthTotal.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Current billing cycle
                    </p>
                </Card>

                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Year Total ({currentYearStr})</span>
                        <div className="p-2 rounded-lg bg-violet-500/15 text-violet-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-violet-300 font-mono">
                        ₹{thisYearTotal.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Year-to-date cumulative
                    </p>
                </Card>

                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">EMI / Loan Debits</span>
                        <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
                            <Tag className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-rose-400 font-mono">
                        ₹{emiOutflowInPeriod.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Loan installment payments in period
                    </p>
                </Card>
            </div>

            {/* Date, Month & Year Filtering Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0c101d] border border-white/[0.08]">
                {/* Timeframe Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                    {[
                        { id: "all", label: "All Time" },
                        { id: "this_month", label: "This Month" },
                        { id: "this_year", label: "This Year" },
                        { id: "custom", label: "Custom Filter" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setTimeframeTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                timeframeTab === tab.id
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Dropdown Filters (Year, Month, Category) */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Year Selector */}
                    <div className="w-28">
                        <Select
                            value={selectedYear}
                            onValueChange={(val) => {
                                if (val) {
                                    setSelectedYear(val);
                                    setTimeframeTab("custom");
                                }
                            }}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {availableYears.map((yr) => (
                                    <SelectItem key={yr} value={yr}>
                                        {yr}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Month Selector */}
                    <div className="w-36">
                        <Select
                            value={selectedMonth}
                            onValueChange={(val) => {
                                if (val) {
                                    setSelectedMonth(val);
                                    setTimeframeTab("custom");
                                }
                            }}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {availableMonths.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {formatMonthName(m)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category Selector */}
                    <div className="w-36">
                        <Select
                            value={selectedCategory}
                            onValueChange={(val) => val && setSelectedCategory(val)}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-white/[0.08]">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                viewMode === "table" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                            title="Table View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("timeline")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                viewMode === "timeline" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                            title="Timeline / Grouped by Date View"
                        >
                            <Layers className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expenses List: Table View or Date-Grouped Timeline */}
            {viewMode === "table" ? (
                <Card className="glassmorphism border-white/[0.08] overflow-hidden">
                    <CardHeader className="py-4 px-6 border-b border-white/[0.06] flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-white">
                                Transaction Entries
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Showing {filteredExpenses.length} entries matching selected date & category filters
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/[0.02]">
                                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                                        <TableHead className="text-slate-400 text-xs">Date (DD/MM/YYYY)</TableHead>
                                        <TableHead className="text-slate-400 text-xs">Description</TableHead>
                                        <TableHead className="text-slate-400 text-xs">Category</TableHead>
                                        <TableHead className="text-right text-slate-400 text-xs">Amount</TableHead>
                                        <TableHead className="text-right text-slate-400 text-xs pr-6">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExpenses.map((expense) => (
                                        <TableRow
                                            key={expense.id}
                                            className="border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                                        >
                                            <TableCell className="font-mono text-slate-300 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
                                                    <span>{expense.date}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-white">
                                                {expense.title}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`border text-[11px] font-semibold ${
                                                        CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Others
                                                    }`}
                                                >
                                                    {expense.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-white">
                                                ₹{expense.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditDialog(expense)}
                                                        className="h-8 w-8 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl"
                                                        title="Edit Expense"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => triggerDelete(expense.id, expense.title)}
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                                                        title="Delete Expense"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {filteredExpenses.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-slate-500 py-12 text-sm"
                                            >
                                                No expenses logged for this filter. Use the form above to add one!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Grouped Timeline / Date-wise View */
                <div className="space-y-4">
                    {Object.entries(groupedByDate).map(([dateKey, items]) => {
                        const dayTotal = items.reduce((s, e) => s + e.amount, 0);
                        const dateObj = new Date(dateKey + "T00:00:00");
                        const isToday = dateKey === todayStr;
                        const dateFormatted = dateObj.toLocaleDateString("en-US", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        });

                        return (
                            <Card key={dateKey} className="glassmorphism border-white/[0.08] overflow-hidden">
                                <div className="py-3 px-5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-indigo-400" />
                                        <span className="font-bold text-xs text-white">
                                            {isToday ? `Today (${dateFormatted})` : dateFormatted}
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-mono">
                                            ({items.length} item{items.length === 1 ? "" : "s"})
                                        </span>
                                    </div>
                                    <div className="font-mono font-bold text-sm text-indigo-300">
                                        ₹{dayTotal.toLocaleString()}
                                    </div>
                                </div>
                                <div className="divide-y divide-white/[0.04]">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-xs"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    className={`border text-[10px] font-semibold ${
                                                        CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Others
                                                    }`}
                                                >
                                                    {item.category}
                                                </Badge>
                                                <span className="font-semibold text-white">{item.title}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-bold text-white text-sm">
                                                    ₹{item.amount.toLocaleString()}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditDialog(item)}
                                                        className="h-7 w-7 text-slate-400 hover:text-indigo-300"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => triggerDelete(item.id, item.title)}
                                                        className="h-7 w-7 text-slate-400 hover:text-rose-400"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}

                    {Object.keys(groupedByDate).length === 0 && (
                        <Card className="glassmorphism p-12 text-center text-slate-500 text-xs">
                            No transactions found for the selected timeframe.
                        </Card>
                    )}
                </div>
            )}

            {/* Manual Add / Edit Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md w-full">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle>
                                    {editingExpense ? "Edit Expense Entry" : "Log Expense Entry"}
                                </DialogTitle>
                                <DialogDescription>
                                    Provide transaction details to record in your ledger with exact date, month, and year.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="exp-title" className="text-xs text-slate-300 font-semibold">
                                Expense Title *
                            </Label>
                            <Input
                                id="exp-title"
                                placeholder="e.g. Electricity Bill, Dinner, Supermarket"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl text-xs font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="exp-amount" className="text-xs text-slate-300 font-semibold">
                                    Amount (₹) *
                                </Label>
                                <Input
                                    id="exp-amount"
                                    type="number"
                                    placeholder="1200"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl font-mono font-bold text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-300 font-semibold">Category *</Label>
                                <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                                    <SelectTrigger className="bg-slate-900/80 border-white/10 text-white h-10 rounded-xl text-xs font-semibold">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0c101d] border-white/10 text-white rounded-xl">
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="exp-date" className="text-xs text-slate-300 font-semibold">
                                Transaction Date (Date, Month, Year) *
                            </Label>
                            <DatePicker
                                id="exp-date"
                                value={date}
                                onChange={(val) => setDate(val)}
                                placeholder="Select date"
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
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl h-10 px-6 shadow-lg shadow-indigo-600/30"
                            >
                                {editingExpense ? "Save Changes" : "Log Expense"}
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
                description="Are you sure you want to delete this expense record? This will permanently adjust your monthly outflow totals."
            />
        </div>
    );
}
