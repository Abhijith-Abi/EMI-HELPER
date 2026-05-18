import { NextResponse } from "next/server"
import { ref, get } from "firebase/database"
import { rtdb } from "@/lib/firebase/config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!rtdb) {
      return NextResponse.json({ error: "Realtime Database is not configured" }, { status: 500 })
    }

    const userRef = ref(rtdb, `users/${userId}`)
    const snapshot = await get(userRef)

    if (snapshot.exists()) {
      const data = snapshot.val()
      return NextResponse.json({
        user: data.user || null,
        emis: data.emis || [],
        expenses: data.expenses || [],
        goals: data.goals || [],
        notifications: data.notifications || []
      })
    }

    return NextResponse.json({
      user: null,
      emis: [],
      expenses: [],
      goals: [],
      notifications: []
    })
  } catch (error: any) {
    console.error("[API Fetch Error] Failed to read from Realtime Database:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
