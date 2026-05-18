import { NextResponse } from "next/server"
import { ref, set } from "firebase/database"
import { rtdb } from "@/lib/firebase/config"

export async function POST(request: Request) {
  try {
    const { userId, data } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Server-side write to Realtime Database
    const userRef = ref(rtdb, `users/${userId}`)
    await set(userRef, {
      user: data.user || null,
      emis: data.emis || [],
      expenses: data.expenses || [],
      goals: data.goals || [],
      notifications: data.notifications || [],
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API Sync Error] Failed to write to Realtime Database:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
