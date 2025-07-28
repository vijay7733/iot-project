import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"
import type { User } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyJWT(token)

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { name, email, assigned_rooms } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if user already exists
    const existingUser = await db.collection<User>("users").findOne({
      email: email.toLowerCase(),
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Create invite (user without PIN initially)
    const newUser: Omit<User, "_id"> = {
      role: "manager",
      name,
      email: email.toLowerCase(),
      pin: "", // Will be set during registration
      status: "inactive", // Activated after PIN setup
      assigned_rooms: assigned_rooms || [],
      invited_by: decoded.email,
      created_at: new Date(),
    }

    const result = await db.collection<User>("users").insertOne(newUser)

    return NextResponse.json({
      success: true,
      message: "Manager invited successfully",
      userId: result.insertedId,
    })
  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
