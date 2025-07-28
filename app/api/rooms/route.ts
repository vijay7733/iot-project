import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"
import type { Room } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyJWT(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const rooms = await db.collection<Room>("rooms").find({}).toArray()

    return NextResponse.json({
      success: true,
      rooms,
    })
  } catch (error) {
    console.error("Rooms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const { room_id, type, features } = await request.json()

    if (!room_id || !type) {
      return NextResponse.json({ error: "Room ID and type are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if room already exists
    const existingRoom = await db.collection<Room>("rooms").findOne({ room_id })
    if (existingRoom) {
      return NextResponse.json({ error: "Room already exists" }, { status: 400 })
    }

    const newRoom: Omit<Room, "_id"> = {
      room_id,
      type,
      features: features || [],
      status: "available",
    }

    const result = await db.collection<Room>("rooms").insertOne(newRoom)

    return NextResponse.json({
      success: true,
      message: "Room created successfully",
      roomId: result.insertedId,
    })
  } catch (error) {
    console.error("Create room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
