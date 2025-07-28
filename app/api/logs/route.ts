import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"
import type { AccessLog } from "@/lib/models"

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
    let query = {}

    // Managers can only see their own logs
    if (decoded.role === "manager") {
      query = { manager_id: decoded.userId }
    }
    // Admins can see all logs (no filter)

    const logs = await db.collection<AccessLog>("access_logs").find(query).sort({ timestamp: -1 }).limit(100).toArray()

    return NextResponse.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error("Logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
