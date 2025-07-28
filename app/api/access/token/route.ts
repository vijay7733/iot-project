import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyJWT, verifyAccessToken } from "@/lib/auth"
import type { User, AccessLog, Room } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jwtToken = authHeader.substring(7)
    const decoded = verifyJWT(jwtToken)

    if (!decoded || decoded.role !== "manager") {
      return NextResponse.json({ error: "Manager access required" }, { status: 403 })
    }

    const { token, room_id } = await request.json()

    if (!token || !room_id) {
      return NextResponse.json({ error: "Token and room_id are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Get manager details
    const manager = await db.collection<User>("users").findOne({
      _id: new ObjectId(decoded.userId),
      status: "active",
    })

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 })
    }

    // Verify access token
    const tokenVerification = verifyAccessToken(token)

    const logEntry: Omit<AccessLog, "_id"> = {
      manager_id: decoded.userId,
      manager_name: manager.name,
      room_id,
      timestamp: new Date(),
      status: "fail",
      reason: "Unknown error",
      method: "PIN + Token",
      ip_address: request.ip || "unknown",
    }

    if (!tokenVerification.success) {
      logEntry.reason = tokenVerification.reason || "Token verification failed"
      await db.collection<AccessLog>("access_logs").insertOne(logEntry)

      return NextResponse.json({
        success: false,
        reason: logEntry.reason,
      })
    }

    // Check if manager has access to this room
    if (!manager.assigned_rooms.includes(room_id)) {
      logEntry.reason = "Access denied - Room not assigned"
      await db.collection<AccessLog>("access_logs").insertOne(logEntry)

      return NextResponse.json({
        success: false,
        reason: logEntry.reason,
      })
    }

    // Check if room exists
    const room = await db.collection<Room>("rooms").findOne({ room_id })
    if (!room) {
      logEntry.reason = "Room not found"
      await db.collection<AccessLog>("access_logs").insertOne(logEntry)

      return NextResponse.json({
        success: false,
        reason: logEntry.reason,
      })
    }

    // Success - grant access
    logEntry.status = "success"
    logEntry.reason = "Access granted"
    await db.collection<AccessLog>("access_logs").insertOne(logEntry)

    return NextResponse.json({
      success: true,
      message: `Access granted to ${room_id}`,
      room: {
        id: room.room_id,
        type: room.type,
        features: room.features,
      },
    })
  } catch (error) {
    console.error("Access token error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
