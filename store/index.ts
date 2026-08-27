import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveUserDataToCloud, fetchUserDataFromCloud } from "@/lib/firebase/db";

export type User = {
    id: string;
    name: string;
    email: string;
    salary: number;
};

export type EMI = {
    id: string;
    title: string;
    emi_amount: number;
    interest_rate: number;
    remaining_months: number;
    total_months: number;
    due_date: string;
    status: "Active" | "Paid";
    principal_amount?: number;
    last_paid_date?: string;
};

export type Expense = {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
};

export type Goal = {
    id: string;
    title: string;
    target_amount: number;
    saved_amount: number;
    deadline: string;
};

export type NotificationItem = {
    id: string;
    title: string;
    body: string;
    date: string;
    read: boolean;
};

export function rollDueDate(dateStr: string, monthsToAdd: number): string {
    try {
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);

        const targetDate = new Date(year, month + monthsToAdd, 1);
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();

        const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
        const finalDay = Math.min(day, maxDays);

        const pad = (n: number) => String(n).padStart(2, "0");
        return `${targetYear}-${pad(targetMonth + 1)}-${pad(finalDay)}`;
    } catch {
        return dateStr;
    }
}

interface AppState {
    user: User | null;
    emis: EMI[];
    expenses: Expense[];
    goals: Goal[];
    notifications: NotificationItem[];
    dismissedNotifications: string[];
    setUser: (user: Partial<User>) => void;
    updateUser: (name: string, email: string, salary: number) => void;
    addEmi: (emi: EMI) => void;
    updateEmi: (emi: EMI) => void;
    deleteEmi: (id: string) => void;
    toggleEmiStatus: (id: string) => void;
    payEmiInstallment: (id: string, autoLogExpense?: boolean, paymentDate?: string) => void;
    undoEmiPayment: (id: string) => void;
    payAllDueEmis: (autoLogExpense?: boolean) => number;
    addExpense: (expense: Expense) => void;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (id: string) => void;
    addGoal: (goal: Goal) => void;
    updateGoal: (goal: Goal) => void;
    deleteGoal: (id: string) => void;
    addToGoalSavings: (id: string, amount: number, deductAsExpense?: boolean) => void;
    addNotification: (title: string, body: string) => void;
    markNotificationRead: (id: string) => void;
    deleteNotification: (id: string) => void;
    clearAllData: () => void;
    loginUser: (firebaseUser: any) => Promise<void>;
    logoutUser: () => void;
}

let syncTimeout: any = null;

const syncCloud = (
    userId: string | undefined,
    getLatestState: () => AppState,
) => {
    if (userId && userId !== "1") {
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }
        syncTimeout = setTimeout(() => {
            const state = getLatestState();
            saveUserDataToCloud(userId, {
                user: state.user,
                emis: state.emis || [],
                expenses: state.expenses || [],
                goals: state.goals || [],
                notifications: state.notifications || [],
            });
        }, 1500); // 1.5s debounce
    }
};

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            user: null,
            emis: [],
            expenses: [],
            goals: [],
            notifications: [],
            dismissedNotifications: [],

            setUser: (userData) => {
                set((state) => ({
                    user: state.user
                        ? { ...state.user, ...userData }
                        : {
                              id: "1",
                              name: "",
                              email: "",
                              salary: 0,
                              ...userData,
                          },
                }));
                syncCloud(get().user?.id, get);
            },

            updateUser: (name, email, salary) => {
                set((state) => ({
                    user: state.user
                        ? { ...state.user, name, email, salary }
                        : { id: "1", name, email, salary },
                }));
                syncCloud(get().user?.id, get);
            },

            addEmi: (emi) => {
                set((state) => ({ emis: [...state.emis, emi] }));
                syncCloud(get().user?.id, get);
            },

            updateEmi: (emi) => {
                set((state) => ({
                    emis: state.emis.map((e) => (e.id === emi.id ? emi : e)),
                }));
                syncCloud(get().user?.id, get);
            },

            deleteEmi: (id) => {
                set((state) => ({
                    emis: state.emis.filter((e) => e.id !== id),
                }));
                syncCloud(get().user?.id, get);
            },

            toggleEmiStatus: (id) => {
                const emi = get().emis.find((e) => e.id === id);
                if (!emi) return;

                if (emi.status === "Active") {
                    // Pay installment
                    get().payEmiInstallment(id, true);
                } else {
                    // Mark as Active
                    set((state) => ({
                        emis: state.emis.map((e) =>
                            e.id === id ? { ...e, status: "Active" } : e,
                        ),
                    }));
                    syncCloud(get().user?.id, get);
                }
            },

            payEmiInstallment: (id, autoLogExpense = true, paymentDate) => {
                const today = paymentDate || new Date().toISOString().split("T")[0];
                const state = get();
                const emi = state.emis.find((e) => e.id === id);
                if (!emi) return;

                const newRemaining = Math.max(0, emi.remaining_months - 1);
                const nextDueDate = rollDueDate(emi.due_date, 1);
                const newStatus: "Active" | "Paid" = newRemaining === 0 ? "Paid" : emi.status;

                const updatedEmi: EMI = {
                    ...emi,
                    remaining_months: newRemaining,
                    due_date: nextDueDate,
                    status: newStatus,
                    last_paid_date: today,
                };

                let newExpenses = state.expenses;
                if (autoLogExpense) {
                    const newExpense: Expense = {
                        id: `emi-payment-${emi.id}-${Date.now()}`,
                        title: `EMI: ${emi.title}`,
                        amount: emi.emi_amount,
                        category: "EMI / Loan",
                        date: today,
                    };
                    newExpenses = [newExpense, ...state.expenses];
                }

                set({
                    emis: state.emis.map((e) => (e.id === id ? updatedEmi : e)),
                    expenses: newExpenses,
                });

                syncCloud(get().user?.id, get);
            },

            undoEmiPayment: (id) => {
                const state = get();
                const emi = state.emis.find((e) => e.id === id);
                if (!emi) return;

                const newRemaining = Math.min(emi.total_months, emi.remaining_months + 1);
                const prevDueDate = rollDueDate(emi.due_date, -1);

                const updatedEmi: EMI = {
                    ...emi,
                    remaining_months: newRemaining,
                    due_date: prevDueDate,
                    status: "Active",
                };

                set({
                    emis: state.emis.map((e) => (e.id === id ? updatedEmi : e)),
                });

                syncCloud(get().user?.id, get);
            },

            payAllDueEmis: (autoLogExpense = true) => {
                const state = get();
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const dueEmis = state.emis.filter((emi) => {
                    if (emi.status !== "Active" || emi.remaining_months <= 0) return false;
                    const due = new Date(emi.due_date);
                    due.setHours(0, 0, 0, 0);
                    // Due today, overdue, or due within 5 days
                    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays <= 5;
                });

                if (dueEmis.length === 0) return 0;

                const todayStr = new Date().toISOString().split("T")[0];
                const newExpenses: Expense[] = [];
                const updatedEmis = state.emis.map((emi) => {
                    const isDue = dueEmis.some((d) => d.id === emi.id);
                    if (!isDue) return emi;

                    const newRemaining = Math.max(0, emi.remaining_months - 1);
                    const nextDueDate = rollDueDate(emi.due_date, 1);
                    const newStatus: "Active" | "Paid" = newRemaining === 0 ? "Paid" : "Active";

                    if (autoLogExpense) {
                        newExpenses.push({
                            id: `emi-payment-${emi.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                            title: `EMI: ${emi.title}`,
                            amount: emi.emi_amount,
                            category: "EMI / Loan",
                            date: todayStr,
                        });
                    }

                    return {
                        ...emi,
                        remaining_months: newRemaining,
                        due_date: nextDueDate,
                        status: newStatus,
                        last_paid_date: todayStr,
                    };
                });

                set({
                    emis: updatedEmis,
                    expenses: [...newExpenses, ...state.expenses],
                });

                syncCloud(get().user?.id, get);
                return dueEmis.length;
            },

            addExpense: (expense) => {
                set((state) => ({ expenses: [expense, ...state.expenses] }));
                syncCloud(get().user?.id, get);
            },

            updateExpense: (expense) => {
                set((state) => ({
                    expenses: state.expenses.map((e) =>
                        e.id === expense.id ? expense : e,
                    ),
                }));
                syncCloud(get().user?.id, get);
            },

            deleteExpense: (id) => {
                set((state) => ({
                    expenses: state.expenses.filter((e) => e.id !== id),
                }));
                syncCloud(get().user?.id, get);
            },

            addGoal: (goal) => {
                set((state) => ({ goals: [...state.goals, goal] }));
                syncCloud(get().user?.id, get);
            },

            updateGoal: (goal) => {
                set((state) => ({
                    goals: state.goals.map((g) =>
                        g.id === goal.id ? goal : g,
                    ),
                }));
                syncCloud(get().user?.id, get);
            },

            deleteGoal: (id) => {
                set((state) => ({
                    goals: state.goals.filter((g) => g.id !== id),
                }));
                syncCloud(get().user?.id, get);
            },

            addToGoalSavings: (id, amount, deductAsExpense = false) => {
                const state = get();
                const goal = state.goals.find((g) => g.id === id);
                if (!goal) return;

                const updatedGoals = state.goals.map((g) =>
                    g.id === id ? { ...g, saved_amount: g.saved_amount + amount } : g,
                );

                let updatedExpenses = state.expenses;
                if (deductAsExpense) {
                    const todayStr = new Date().toISOString().split("T")[0];
                    updatedExpenses = [
                        {
                            id: `goal-contrib-${id}-${Date.now()}`,
                            title: `Goal Savings: ${goal.title}`,
                            amount,
                            category: "Savings",
                            date: todayStr,
                        },
                        ...state.expenses,
                    ];
                }

                set({
                    goals: updatedGoals,
                    expenses: updatedExpenses,
                });

                syncCloud(get().user?.id, get);
            },

            addNotification: (title, body) => {
                const newItem: NotificationItem = {
                    id: String(Date.now()),
                    title,
                    body,
                    date: new Date().toISOString().split("T")[0],
                    read: false,
                };
                set((state) => ({
                    notifications: [newItem, ...state.notifications],
                }));
                syncCloud(get().user?.id, get);
            },

            markNotificationRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n,
                    ),
                }));
                syncCloud(get().user?.id, get);
            },

            deleteNotification: (id) => {
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                    dismissedNotifications: [...state.dismissedNotifications, id],
                }));
                syncCloud(get().user?.id, get);
            },

            clearAllData: () => {
                set({
                    user: {
                        id: get().user?.id || "1",
                        name: "Fresh Start",
                        email: "",
                        salary: 0,
                    },
                    emis: [],
                    expenses: [],
                    goals: [],
                    notifications: [],
                });
                syncCloud(get().user?.id, get);
            },

            loginUser: async (firebaseUser) => {
                const id = firebaseUser.uid;
                const name = firebaseUser.displayName || "Google User";
                const email = firebaseUser.email || "";

                if (typeof document !== "undefined") {
                    document.cookie = `user-id=${id}; path=/; max-age=31536000; SameSite=Lax`;
                }

                let userData = { id, name, email, salary: 0 };
                let emisData: EMI[] = [];
                let expensesData: Expense[] = [];
                let goalsData: Goal[] = [];
                let notificationsData: NotificationItem[] = [];

                try {
                    const cloudData = await Promise.race([
                        fetchUserDataFromCloud(id),
                        new Promise<null>((resolve) =>
                            setTimeout(() => resolve(null), 5000),
                        ),
                    ]);

                    if (cloudData) {
                        userData = {
                            id,
                            name,
                            email,
                            salary: cloudData.user?.salary || 0,
                        };
                        emisData = cloudData.emis || [];
                        expensesData = cloudData.expenses || [];
                        goalsData = cloudData.goals || [];
                        notificationsData = cloudData.notifications || [];
                    } else {
                        saveUserDataToCloud(id, {
                            user: userData,
                            emis: [],
                            expenses: [],
                            goals: [],
                            notifications: [],
                        });
                    }
                } catch (err) {
                    console.error("Cloud data fetch failed:", err);
                }

                set({
                    user: userData,
                    emis: emisData,
                    expenses: expensesData,
                    goals: goalsData,
                    notifications: notificationsData,
                });

                if (typeof window !== "undefined") {
                    try {
                        const persistData = {
                            state: {
                                user: userData,
                                emis: emisData,
                                expenses: expensesData,
                                goals: goalsData,
                                notifications: notificationsData,
                            },
                            version: 0,
                        };
                        localStorage.setItem(
                            "cash-erp-persisted-store",
                            JSON.stringify(persistData),
                        );
                    } catch (e) {
                        console.error("Failed to persist store:", e);
                    }
                }
            },

            logoutUser: () => {
                if (typeof document !== "undefined") {
                    document.cookie =
                        "user-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                }
                set({
                    user: null,
                    emis: [],
                    expenses: [],
                    goals: [],
                    notifications: [],
                });
            },
        }),
        {
            name: "cash-erp-persisted-store",
        },
    ),
);
