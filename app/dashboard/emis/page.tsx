"use client";

import { useState, useMemo } from "react";
import { useStore, EMI, rollDueDate } from "@/store";
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
    Check,
    Trash2,
    Edit,
    CreditCard,
    Calendar,
    RotateCcw,
    Calculator,
    CheckCircle2,
    Clock,
    Landmark,
    TrendingDown,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Percent,
    IndianRupee,
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
import { Progress } from "@/components/ui/progress";

export default function EMIManagementPage() {
    const {
        emis,
        addEmi,
        updateEmi,
        deleteEmi,
        payEmiInstallment,
        undoEmiPayment,
        payAllDueEmis,
    } = useStore();

    // Dialog controls
    const [open, setOpen] = useState(false);
    const [editingEmi, setEditingEmi] = useState<EMI | null>(null);
    const [filterTab, setFilterTab] = useState<"all" | "active" | "paid">("all");

    // Standalone Calculator Modal
    const [calcModalOpen, setCalcModalOpen] = useState(false);
    const [standalonePrincipal, setStandalonePrincipal] = useState("1000000");
    const [standaloneRate, setStandaloneRate] = useState("9.5");
    const [standaloneTenure, setStandaloneTenure] = useState("36");
    const [tenureUnit, setTenureUnit] = useState<"months" | "years">("months");

    // Proper Delete Modal controls
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetDeleteId, setTargetDeleteId] = useState("");
    const [targetDeleteName, setTargetDeleteName] = useState("");

    // Form states
    const [title, setTitle] = useState("");
    const [emiAmount, setEmiAmount] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [remainingMonths, setRemainingMonths] = useState("");
    const [totalMonths, setTotalMonths] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState<"Active" | "Paid">("Active");

    // In-form Calculator accordion
    const [showCalculator, setShowCalculator] = useState(false);
    const [calcPrincipal, setCalcPrincipal] = useState("");
    const [calcRate, setCalcRate] = useState("");
    const [calcMonths, setCalcMonths] = useState("");

    const calculateEMI = (p: number, rAnnual: number, nMonths: number) => {
        if (p <= 0 || nMonths <= 0) return 0;
        if (rAnnual <= 0) return Math.round(p / nMonths);
        const r = rAnnual / 12 / 100;
        const emi = (p * r * Math.pow(1 + r, nMonths)) / (Math.pow(1 + r, nMonths) - 1);
        return Math.round(emi);
    };

    // Standalone Calculator Computed Stats
    const standaloneComputed = useMemo(() => {
        const p = Number(standalonePrincipal) || 0;
        const r = Number(standaloneRate) || 0;
        const tenureInMonths = tenureUnit === "years" ? (Number(standaloneTenure) || 0) * 12 : Number(standaloneTenure) || 0;
        const emi = calculateEMI(p, r, tenureInMonths);
        const totalPayment = emi * tenureInMonths;
        const totalInterest = Math.max(0, totalPayment - p);
        const principalPct = totalPayment > 0 ? Math.round((p / totalPayment) * 100) : 100;
        const interestPct = 100 - principalPct;
        return {
            emi,
            tenureInMonths,
            totalPayment,
            totalInterest,
            principalPct,
            interestPct,
        };
    }, [standalonePrincipal, standaloneRate, standaloneTenure, tenureUnit]);

    const handleApplyCalculatorToForm = () => {
        const p = Number(calcPrincipal);
        const r = Number(calcRate);
        const n = Number(calcMonths);
        if (p <= 0 || n <= 0) {
            toast.error("Please enter a valid principal and tenure.");
            return;
        }
        const computedEmi = calculateEMI(p, r, n);
        setEmiAmount(String(computedEmi));
        setInterestRate(String(r));
        setTotalMonths(String(n));
        setRemainingMonths(String(n));
        toast.success(`Calculated EMI: ₹${computedEmi.toLocaleString()}/month`);
        setShowCalculator(false);
    };

    const handleCreateFromStandaloneCalc = () => {
        setCalcModalOpen(false);
        setEditingEmi(null);
        setTitle("New Loan");
        setEmiAmount(String(standaloneComputed.emi));
        setInterestRate(String(standaloneRate));
        setTotalMonths(String(standaloneComputed.tenureInMonths));
        setRemainingMonths(String(standaloneComputed.tenureInMonths));
        setDueDate(new Date().toISOString().split("T")[0]);
        setStatus("Active");
        setOpen(true);
    };

    const openAddDialog = () => {
        setEditingEmi(null);
        setTitle("");
        setEmiAmount("");
        setInterestRate("");
        setRemainingMonths("");
        setTotalMonths("");
        setDueDate(new Date().toISOString().split("T")[0]);
        setStatus("Active");
        setShowCalculator(false);
        setOpen(true);
    };

    const openEditDialog = (emi: EMI) => {
        setEditingEmi(emi);
        setTitle(emi.title);
        setEmiAmount(String(emi.emi_amount));
        setInterestRate(String(emi.interest_rate));
        setRemainingMonths(String(emi.remaining_months));
        setTotalMonths(String(emi.total_months));
        setDueDate(emi.due_date);
        setStatus(emi.status);
        setShowCalculator(false);
        setOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !emiAmount || !remainingMonths || !totalMonths || !dueDate) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const remaining = Number(remainingMonths);
        const total = Number(totalMonths);

        if (remaining > total) {
            toast.error("Remaining months cannot exceed total months.");
            return;
        }

        const payload: EMI = {
            id: editingEmi ? editingEmi.id : String(Date.now()),
            title,
            emi_amount: Number(emiAmount),
            interest_rate: Number(interestRate) || 0,
            remaining_months: remaining,
            total_months: total,
            due_date: dueDate,
            status: remaining === 0 ? "Paid" : status,
        };

        if (editingEmi) {
            updateEmi(payload);
            toast.success("EMI updated successfully!");
        } else {
            addEmi(payload);
            toast.success("EMI created successfully!");
        }

        setOpen(false);
    };

    const triggerDelete = (id: string, name: string) => {
        setTargetDeleteId(id);
        setTargetDeleteName(name);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteEmi(targetDeleteId);
        toast.success("EMI deleted successfully!");
    };

    const handlePayInstallment = (emi: EMI) => {
        if (emi.remaining_months <= 0) {
            toast.info("This EMI is already fully completed!");
            return;
        }
        payEmiInstallment(emi.id, true);
        const newRemaining = emi.remaining_months - 1;
        const nextDue = rollDueDate(emi.due_date, 1);
        if (newRemaining === 0) {
            toast.success(`🎉 Congratulations! "${emi.title}" is now fully paid off!`);
        } else {
            toast.success(
                `Payment recorded for "${emi.title}". Months left: ${newRemaining}. Next due: ${nextDue}`,
            );
        }
    };

    const handleUndoPayment = (emi: EMI) => {
        undoEmiPayment(emi.id);
        toast.info(`Reversed last installment for "${emi.title}".`);
    };

    const handleBatchPay = () => {
        const count = payAllDueEmis(true);
        if (count > 0) {
            toast.success(`Paid ${count} due EMI installment${count > 1 ? "s" : ""}!`);
        } else {
            toast.info("No active EMIs are due right now.");
        }
    };

    const getDaysRemaining = (dueDateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dueDateStr);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const activeEmis = useMemo(() => emis.filter((e) => e.status === "Active" && e.remaining_months > 0), [emis]);
    const paidEmis = useMemo(() => emis.filter((e) => e.status === "Paid" || e.remaining_months === 0), [emis]);
    const totalMonthlyEmi = activeEmis.reduce((sum, e) => sum + e.emi_amount, 0);
    const totalOutstandingDebt = activeEmis.reduce((sum, e) => sum + e.emi_amount * e.remaining_months, 0);

    const filteredEmis = useMemo(() => {
        if (filterTab === "active") return activeEmis;
        if (filterTab === "paid") return paidEmis;
        return emis;
    }, [filterTab, emis, activeEmis, paidEmis]);

    return (
        <div className="space-y-6">
            {/* Header & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Landmark className="h-6 w-6 text-indigo-400" />
                        EMI & Loan Manager
                    </h2>
                    <p className="text-sm text-slate-400">
                        Track amortization, calculate EMIs, and decrease loan burdens automatically.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <Button
                        variant="outline"
                        onClick={() => setCalcModalOpen(true)}
                        className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold h-9 rounded-xl"
                    >
                        <Calculator className="mr-1.5 h-4 w-4 text-indigo-400" />
                        EMI Calculator
                    </Button>
                    {activeEmis.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleBatchPay}
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold h-9 rounded-xl"
                        >
                            <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-400" />
                            Pay Due EMIs
                        </Button>
                    )}
                    <Button
                        onClick={openAddDialog}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-9 shadow-lg shadow-indigo-600/20 rounded-xl"
                    >
                        <Plus className="mr-1.5 h-4 w-4" /> Add Loan / EMI
                    </Button>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Monthly Active EMI</span>
                        <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                            <CreditCard className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white font-mono">
                        ₹{totalMonthlyEmi.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {activeEmis.length} active loan obligation{activeEmis.length === 1 ? "" : "s"}
                    </p>
                </Card>

                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Outstanding Liability</span>
                        <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-rose-400 font-mono">
                        ₹{totalOutstandingDebt.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Sum of all remaining tenure installments
                    </p>
                </Card>

                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Active Loans</span>
                        <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
                        {activeEmis.length}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {paidEmis.length} loan{paidEmis.length === 1 ? "" : "s"} completed
                    </p>
                </Card>

                <Card className="glassmorphism p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Auto Decrement</span>
                        <div className="p-2 rounded-lg bg-violet-500/15 text-violet-400">
                            <Sparkles className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-sm font-bold text-violet-300">
                        1-Click Ledger Sync
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Payment logs expense & rolls due date
                    </p>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <button
                    onClick={() => setFilterTab("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        filterTab === "all"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                >
                    All Loans ({emis.length})
                </button>
                <button
                    onClick={() => setFilterTab("active")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        filterTab === "active"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                >
                    Active Loans ({activeEmis.length})
                </button>
                <button
                    onClick={() => setFilterTab("paid")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        filterTab === "paid"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                >
                    Paid / Completed ({paidEmis.length})
                </button>
            </div>

            {/* EMIs Table & Cards */}
            <Card className="glassmorphism border-white/[0.08] overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-white/[0.06] flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-white">
                            Amortization Schedules & Payments
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                            Click &quot;Pay Installment&quot; to decrease remaining months and advance due date.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/[0.06] hover:bg-transparent">
                                    <TableHead className="text-slate-400 text-xs">Loan Title</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Monthly EMI</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Interest</TableHead>
                                    <TableHead className="text-slate-400 text-xs min-w-[170px]">
                                        Tenure Progress
                                    </TableHead>
                                    <TableHead className="text-slate-400 text-xs">Remaining Balance</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Next Due Date</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Status</TableHead>
                                    <TableHead className="text-right text-slate-400 text-xs pr-6">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmis.map((emi) => {
                                    const isPaid = emi.status === "Paid" || emi.remaining_months === 0;
                                    const paidMonths = Math.max(0, emi.total_months - emi.remaining_months);
                                    const progress = Math.min(
                                        100,
                                        Math.round((paidMonths / (emi.total_months || 1)) * 100),
                                    );
                                    const remainingLiability = emi.emi_amount * emi.remaining_months;
                                    const daysRemaining = getDaysRemaining(emi.due_date);
                                    const isOverdue = !isPaid && daysRemaining < 0;
                                    const isDueSoon = !isPaid && daysRemaining >= 0 && daysRemaining <= 5;

                                    return (
                                        <TableRow
                                            key={emi.id}
                                            className="border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                                        >
                                            <TableCell className="font-semibold text-white">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                                    <span>{emi.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono font-bold text-white">
                                                ₹{emi.emi_amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-slate-300 font-mono text-xs">
                                                {emi.interest_rate > 0 ? `${emi.interest_rate}%` : "0% (No-Cost)"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-slate-300 font-medium">
                                                            {paidMonths} of {emi.total_months} mo
                                                        </span>
                                                        <span className="text-indigo-400 font-semibold font-mono">
                                                            {progress}%
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={progress}
                                                        className="h-1.5 bg-slate-800"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-slate-300 text-xs">
                                                {isPaid ? (
                                                    <span className="text-emerald-400 font-semibold">₹0 (Cleared)</span>
                                                ) : (
                                                    `₹${remainingLiability.toLocaleString()}`
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isPaid ? (
                                                    <span className="text-slate-500 text-xs">Completed</span>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="font-medium text-slate-200">
                                                            {emi.due_date}
                                                        </span>
                                                        {isOverdue ? (
                                                            <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.2 rounded bg-rose-500/10">
                                                                Overdue
                                                            </span>
                                                        ) : isDueSoon ? (
                                                            <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-500/10">
                                                                Due in {daysRemaining}d
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        isPaid
                                                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
                                                            : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold"
                                                    }
                                                >
                                                    {isPaid ? "Paid Off" : "Active"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {!isPaid && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handlePayInstallment(emi)}
                                                            className="h-8 border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold px-2.5 rounded-xl"
                                                            title="Pay 1 month installment"
                                                        >
                                                            <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                                                            Pay Installment
                                                        </Button>
                                                    )}
                                                    {paidMonths > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleUndoPayment(emi)}
                                                            className="h-8 w-8 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl"
                                                            title="Undo last installment"
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditDialog(emi)}
                                                        className="h-8 w-8 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl"
                                                        title="Edit Loan"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => triggerDelete(emi.id, emi.title)}
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                                                        title="Delete Loan"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {filteredEmis.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="text-center text-slate-500 py-12 text-sm"
                                        >
                                            No EMIs found in this category. Click &quot;Add Loan / EMI&quot; to begin!
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Standalone Interactive EMI Calculator Modal */}
            <Dialog open={calcModalOpen} onOpenChange={setCalcModalOpen}>
                <DialogContent className="max-w-xl w-full">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                                <Calculator className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle>Loan & EMI Amortization Calculator</DialogTitle>
                                <DialogDescription>
                                    Simulate principal amounts, interest burdens, and repayment schedules.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-300 font-semibold">Principal (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="1000000"
                                    value={standalonePrincipal}
                                    onChange={(e) => setStandalonePrincipal(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white font-mono font-bold text-xs h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-300 font-semibold">Annual Interest (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="9.5"
                                    value={standaloneRate}
                                    onChange={(e) => setStandaloneRate(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white font-mono font-bold text-xs h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-slate-300 font-semibold">Tenure</Label>
                                    <button
                                        type="button"
                                        onClick={() => setTenureUnit(tenureUnit === "months" ? "years" : "months")}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 cursor-pointer"
                                    >
                                        {tenureUnit === "months" ? "Switch to Years" : "Switch to Months"}
                                    </button>
                                </div>
                                <Input
                                    type="number"
                                    placeholder="36"
                                    value={standaloneTenure}
                                    onChange={(e) => setStandaloneTenure(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white font-mono font-bold text-xs h-10 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Calculated Results Banner */}
                        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-violet-950/40 p-4 space-y-3">
                            <div className="text-center pb-3 border-b border-white/[0.08]">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                                    Calculated Monthly Installment
                                </span>
                                <span className="text-3xl font-extrabold text-white font-mono drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                                    ₹{standaloneComputed.emi.toLocaleString()}
                                </span>
                                <span className="text-xs text-indigo-300/80 block mt-0.5 font-medium">
                                    Total {standaloneComputed.tenureInMonths} monthly installments
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[11px]">Total Interest</span>
                                    <span className="font-bold text-amber-400 font-mono text-base">
                                        ₹{standaloneComputed.totalInterest.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-400 block text-[11px]">Total Amount Payable</span>
                                    <span className="font-bold text-white font-mono text-base">
                                        ₹{standaloneComputed.totalPayment.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Ratio Bar */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                                    <span>Principal ({standaloneComputed.principalPct}%)</span>
                                    <span className="text-amber-400">Interest ({standaloneComputed.interestPct}%)</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-amber-500/30 overflow-hidden flex">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-300"
                                        style={{ width: `${standaloneComputed.principalPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCalcModalOpen(false)}
                                className="border-white/10 text-slate-300 hover:bg-white/[0.08] rounded-xl h-10 px-5 text-xs font-semibold"
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreateFromStandaloneCalc}
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl h-10 px-5 shadow-lg shadow-indigo-600/30"
                            >
                                <Plus className="mr-1.5 h-4 w-4" /> Add as Active Loan
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add / Edit EMI Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xl w-full">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                                <Landmark className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle>
                                    {editingEmi ? "Edit Loan Details" : "Add New Loan / EMI"}
                                </DialogTitle>
                                <DialogDescription>
                                    Enter loan properties. Monthly installments will automatically roll dates and sync expenses.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        {/* Loan Title */}
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-xs text-slate-300 font-semibold">
                                Loan Title *
                            </Label>
                            <Input
                                id="title"
                                placeholder="e.g. HDFC Home Loan, Car Loan, MacBook EMI"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl text-xs font-medium"
                                required
                            />
                        </div>

                        {/* Financial Terms: EMI & Interest */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="emiAmount" className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                                    <IndianRupee className="h-3.5 w-3.5 text-indigo-400" />
                                    Monthly EMI (₹) *
                                </Label>
                                <Input
                                    id="emiAmount"
                                    type="number"
                                    placeholder="15000"
                                    value={emiAmount}
                                    onChange={(e) => setEmiAmount(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl font-mono font-bold text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="interestRate" className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                                    <Percent className="h-3.5 w-3.5 text-violet-400" />
                                    Annual Interest Rate (%)
                                </Label>
                                <Input
                                    id="interestRate"
                                    type="number"
                                    step="0.1"
                                    placeholder="8.5"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl font-mono font-bold text-xs"
                                />
                            </div>
                        </div>

                        {/* Tenure: Remaining & Total Months */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="remainingMonths" className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                                    Remaining Months *
                                </Label>
                                <Input
                                    id="remainingMonths"
                                    type="number"
                                    placeholder="24"
                                    value={remainingMonths}
                                    onChange={(e) => setRemainingMonths(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl font-mono font-bold text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="totalMonths" className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                                    Total Months (Tenure) *
                                </Label>
                                <Input
                                    id="totalMonths"
                                    type="number"
                                    placeholder="36"
                                    value={totalMonths}
                                    onChange={(e) => setTotalMonths(e.target.value)}
                                    className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-10 rounded-xl font-mono font-bold text-xs"
                                    required
                                />
                            </div>
                        </div>

                        {/* Due Date & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="dueDate" className="text-xs text-slate-300 font-semibold">
                                    Next Due Date *
                                </Label>
                                <DatePicker
                                    id="dueDate"
                                    value={dueDate}
                                    onChange={(val) => setDueDate(val)}
                                    placeholder="Select due date"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-300 font-semibold">Loan Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(val) =>
                                        val && setStatus(val as "Active" | "Paid")
                                    }
                                >
                                    <SelectTrigger className="bg-slate-900/80 border-white/10 text-white h-10 rounded-xl text-xs font-semibold">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0c101d] border-white/10 text-white rounded-xl">
                                        <SelectItem value="Active">Active Loan</SelectItem>
                                        <SelectItem value="Paid">Paid Off / Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Optional Inline Amortization Calculator Accordion */}
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden transition-all">
                            <button
                                type="button"
                                onClick={() => setShowCalculator(!showCalculator)}
                                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-indigo-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <Calculator className="h-4 w-4 text-indigo-400" />
                                    Calculate EMI from Loan Principal
                                </span>
                                {showCalculator ? (
                                    <ChevronUp className="h-4 w-4 text-slate-400" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                )}
                            </button>

                            {showCalculator && (
                                <div className="p-4 pt-2 border-t border-white/[0.08] bg-indigo-950/30 space-y-3">
                                    <div className="grid grid-cols-3 gap-2.5">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-300 font-semibold">Principal (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="500000"
                                                value={calcPrincipal}
                                                onChange={(e) => setCalcPrincipal(e.target.value)}
                                                className="h-9 text-xs bg-slate-900/80 border-white/10 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-300 font-semibold">Interest (%)</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="9.5"
                                                value={calcRate}
                                                onChange={(e) => setCalcRate(e.target.value)}
                                                className="h-9 text-xs bg-slate-900/80 border-white/10 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-300 font-semibold">Tenure (Mo)</Label>
                                            <Input
                                                type="number"
                                                placeholder="36"
                                                value={calcMonths}
                                                onChange={(e) => setCalcMonths(e.target.value)}
                                                className="h-9 text-xs bg-slate-900/80 border-white/10 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleApplyCalculatorToForm}
                                        className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm"
                                    >
                                        Apply Calculated EMI to Form
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Live Total Liability Preview */}
                        {emiAmount && remainingMonths && (
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.08] flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Total Remaining Liability:</span>
                                <span className="font-mono font-bold text-indigo-300 text-sm">
                                    ₹{(Number(emiAmount) * Number(remainingMonths)).toLocaleString()}
                                </span>
                            </div>
                        )}

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
                                {editingEmi ? "Save Changes" : "Create Loan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete EMI Loan Record"
                itemName={targetDeleteName}
                description="Are you sure you want to permanently delete this EMI and all its amortization details? This will update your cloud cash flow statements."
            />
        </div>
    );
}
