import { NextResponse } from "next/server"
import { ref, set } from "firebase/database"
import { rtdb } from "@/lib/firebase/config"

export async function POST(request: Request) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: "User ID and token are required" }, { status: 400 })
    }

    if (!rtdb) {
      return NextResponse.json({ error: "Realtime Database is not configured" }, { status: 500 })
    }

    const tokenRef = ref(rtdb, `users/${userId}/fcmToken`)
    await set(tokenRef, token)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API Token Error] Failed to register FCM token:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
