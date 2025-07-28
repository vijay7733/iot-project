import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { hashPin } from "@/lib/auth"
import type { User } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { email, pin } = await request.json()

    if (!email || !pin) {
      return NextResponse.json({ error: "Email and PIN are required" }, { status: 400 })
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({
      email: email.toLowerCase(),
      status: "inactive",
      pin: "", // Only allow registration for invited users without PIN
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid invitation or user already registered" }, { status: 400 })
    }

    const hashedPin = await hashPin(pin)

    await db.collection<User>("users").updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          pin: hashedPin,
          status: "active",
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
