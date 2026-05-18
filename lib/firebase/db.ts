import { ref, set, get } from "firebase/database";
import { rtdb } from "./config";

export interface CloudUserData {
    user: {
        id: string;
        name: string;
        email: string;
        salary: number;
    } | null;
    emis: any[];
    expenses: any[];
    goals: any[];
    notifications: any[];
}

/**
 * Saves all user-related state directly to Firebase Realtime Database
 * Uses the client SDK so Firebase Auth rules apply correctly.
 */
export async function saveUserDataToCloud(userId: string, data: CloudUserData) {
    if (!userId || !rtdb) return;

    try {
        const userRef = ref(rtdb, `users/${userId}`);
        await set(userRef, {
            user: data.user || null,
            emis: data.emis || [],
            expenses: data.expenses || [],
            goals: data.goals || [],
            notifications: data.notifications || [],
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Cloud sync failed:", error);
    }
}

/**
 * Fetches user-related state from Firebase Realtime Database
 * Uses the client SDK so Firebase Auth rules apply correctly.
 */
export async function fetchUserDataFromCloud(
    userId: string,
): Promise<CloudUserData | null> {
    if (!userId || !rtdb) return null;

    try {
        const userRef = ref(rtdb, `users/${userId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            return {
                user: data.user || null,
                emis: data.emis || [],
                expenses: data.expenses || [],
                goals: data.goals || [],
                notifications: data.notifications || [],
            };
        }
    } catch (error) {
        console.error("Failed to fetch data from Realtime Database:", error);
    }
    return null;
}
