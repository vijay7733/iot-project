export interface User {
  _id?: string
  role: "admin" | "manager"
  name: string
  email: string
  pin: string // bcrypt hash
  device_id?: string
  status: "active" | "inactive"
  assigned_rooms: string[]
  invited_by?: string
  created_at: Date
}

export interface Room {
  _id?: string
  room_id: string
  type: string
  features: string[]
  status: "available" | "occupied" | "maintenance"
}

export interface AccessLog {
  _id?: string
  manager_id: string
  manager_name: string
  room_id: string
  timestamp: Date
  status: "success" | "fail"
  reason: string
  method: string
  ip_address?: string
}

export interface AccessToken {
  manager_id: string
  timestamp: number
  nonce: string
  signature: string
}
