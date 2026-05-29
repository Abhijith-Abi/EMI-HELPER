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

const DEFAULT_USER: User = {
    id: "1",
    name: "New User",
    email: "",
    salary: 0,
};

const DEMO_NOTIFICATIONS: NotificationItem[] = [];
const DEMO_EMIS: EMI[] = [];
const DEMO_EXPENSES: Expense[] = [];
const DEMO_GOALS: Goal[] = [];

interface AppState {
    user: User | null;
    emis: EMI[];
    expenses: Expense[];
    goals: Goal[];
    notifications: NotificationItem[];
    setUser: (user: Partial<User>) => void;
    updateUser: (name: string, email: string, salary: number) => void;
    addEmi: (emi: EMI) => void;
    updateEmi: (emi: EMI) => void;
    deleteEmi: (id: string) => void;
    toggleEmiStatus: (id: string) => void;
    addExpense: (expense: Expense) => void;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (id: string) => void;
    addGoal: (goal: Goal) => void;
    updateGoal: (goal: Goal) => void;
    deleteGoal: (id: string) => void;
    addToGoalSavings: (id: string, amount: number) => void;
    addNotification: (title: string, body: string) => void;
    markNotificationRead: (id: string) => void;
    deleteNotification: (id: string) => void;
    dismissedNotifications: string[];
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
        }, 1500); // 1.5s debounce to optimize database writes and UI smoothness
    }
};

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            user: null,
            emis: DEMO_EMIS,
            expenses: DEMO_EXPENSES,
            goals: DEMO_GOALS,
            notifications: DEMO_NOTIFICATIONS,
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
                set((state) => ({
                    emis: state.emis.map((e) =>
                        e.id === id
                            ? {
                                  ...e,
                                  status:
                                      e.status === "Active" ? "Paid" : "Active",
                              }
                            : e,
                    ),
                }));
                syncCloud(get().user?.id, get);
            },
            addExpense: (expense) => {
                set((state) => ({ expenses: [...state.expenses, expense] }));
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
            addToGoalSavings: (id, amount) => {
                set((state) => ({
                    goals: state.goals.map((g) =>
                        g.id === id
                            ? { ...g, saved_amount: g.saved_amount + amount }
                            : g,
                    ),
                }));
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
                    notifications: state.notifications.filter(
                        (n) => n.id !== id,
                    ),
                    dismissedNotifications: [
                        ...state.dismissedNotifications,
                        id,
                    ],
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

                // Try to fetch cloud data first (with a timeout so it doesn't hang forever)
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
                        // New user or timeout — save initial state to cloud (fire and forget)
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

                // Set the full state in Zustand
                set({
                    user: userData,
                    emis: emisData,
                    expenses: expensesData,
                    goals: goalsData,
                    notifications: notificationsData,
                });

                // Persist to localStorage immediately so page reload has the data
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
