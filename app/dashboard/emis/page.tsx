"use client";

import { useState } from "react";
import { useStore, EMI } from "@/store";
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
import { Plus, Check, Trash2, Edit, HelpCircle } from "lucide-react";
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

export default function EMIManagementPage() {
    const {
        emis,
        addEmi,
        updateEmi,
        deleteEmi,
        toggleEmiStatus,
        setUser,
        user,
    } = useStore();

    // Dialog controls
    const [open, setOpen] = useState(false);
    const [editingEmi, setEditingEmi] = useState<EMI | null>(null);

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

    const openAddDialog = () => {
        setEditingEmi(null);
        setTitle("");
        setEmiAmount("");
        setInterestRate("");
        setRemainingMonths("");
        setTotalMonths("");
        setDueDate(new Date().toISOString().split("T")[0]);
        setStatus("Active");
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
        setOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !title ||
            !emiAmount ||
            !remainingMonths ||
            !totalMonths ||
            !dueDate
        ) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const payload: EMI = {
            id: editingEmi ? editingEmi.id : String(Date.now()),
            title,
            emi_amount: Number(emiAmount),
            interest_rate: Number(interestRate) || 0,
            remaining_months: Number(remainingMonths),
            total_months: Number(totalMonths),
            due_date: dueDate,
            status,
        };

        if (editingEmi) {
            updateEmi(payload);
            toast.success("EMI updated successfully!");
        } else {
            addEmi(payload);
            toast.success("EMI added successfully!");
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

    const handleToggleStatus = (id: string, currentStatus: string) => {
        toggleEmiStatus(id);
        toast.success(
            `EMI marked as ${currentStatus === "Active" ? "Paid" : "Active"}!`,
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        EMI Management
                    </h2>
                    <p className="text-muted-foreground">
                        Track and manage your active loans and EMIs.
                    </p>
                </div>
                <Button onClick={openAddDialog}>
                    <Plus className="mr-2 h-4 w-4" /> Add EMI
                </Button>
            </div>

            <Card className="glassmorphism">
                <CardHeader>
                    <CardTitle>Active EMIs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Loan Title</TableHead>
                                <TableHead>Amount (₹)</TableHead>
                                <TableHead>Interest</TableHead>
                                <TableHead>Months Left</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {emis.map((emi) => (
                                <TableRow key={emi.id}>
                                    <TableCell className="font-medium">
                                        {emi.title}
                                    </TableCell>
                                    <TableCell>
                                        ₹{emi.emi_amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell>{emi.interest_rate}%</TableCell>
                                    <TableCell>
                                        {emi.remaining_months} /{" "}
                                        {emi.total_months}
                                    </TableCell>
                                    <TableCell>{emi.due_date}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                emi.status === "Active"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            {emi.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                handleToggleStatus(
                                                    emi.id,
                                                    emi.status,
                                                )
                                            }
                                            title={
                                                emi.status === "Active"
                                                    ? "Mark as Paid"
                                                    : "Mark as Active"
                                            }
                                        >
                                            <Check
                                                className={`h-4 w-4 ${emi.status === "Paid" ? "text-muted-foreground" : "text-emerald-500"}`}
                                            />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(emi)}
                                            title="Edit Loan"
                                        >
                                            <Edit className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                triggerDelete(emi.id, emi.title)
                                            }
                                            title="Delete Loan"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {emis.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        No EMIs found. Add one to get started!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="glassmorphism max-w-md w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEmi ? "Edit EMI Details" : "Add New EMI"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingEmi
                                ? "Modify the properties of your active loan."
                                : "Enter your loan information below to track monthly EMIs."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="title">Loan Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Car Loan"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="emiAmount">
                                    EMI Amount (₹) *
                                </Label>
                                <Input
                                    id="emiAmount"
                                    type="number"
                                    placeholder="15000"
                                    value={emiAmount}
                                    onChange={(e) =>
                                        setEmiAmount(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="interestRate">
                                    Interest Rate (%)
                                </Label>
                                <Input
                                    id="interestRate"
                                    type="number"
                                    step="0.1"
                                    placeholder="8.5"
                                    value={interestRate}
                                    onChange={(e) =>
                                        setInterestRate(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="remainingMonths">
                                    Remaining Months *
                                </Label>
                                <Input
                                    id="remainingMonths"
                                    type="number"
                                    placeholder="24"
                                    value={remainingMonths}
                                    onChange={(e) =>
                                        setRemainingMonths(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="totalMonths">
                                    Total Months *
                                </Label>
                                <Input
                                    id="totalMonths"
                                    type="number"
                                    placeholder="36"
                                    value={totalMonths}
                                    onChange={(e) =>
                                        setTotalMonths(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="dueDate">Next Due Date *</Label>
                                <DatePicker
                                    id="dueDate"
                                    value={dueDate}
                                    onChange={(val) => setDueDate(val)}
                                    placeholder="Select due date"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(val) =>
                                        val &&
                                        setStatus(val as "Active" | "Paid")
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="Paid">
                                            Paid
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                                {editingEmi ? "Save Changes" : "Create EMI"}
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
