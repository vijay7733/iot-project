"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, LogOut, Key, CheckCircle, XCircle, Clock } from "lucide-react"
import { generateAccessToken } from "@/lib/auth"

interface ManagerDashboardProps {
  user: any
  token: string
  onLogout: () => void
}

export function ManagerDashboard({ user, token, onLogout }: ManagerDashboardProps) {
  const [logs, setLogs] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [accessResult, setAccessResult] = useState<any>(null)

  useEffect(() => {
    fetchLogs()
    fetchRooms()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setRooms(data.rooms.filter((room: any) => user.assigned_rooms.includes(room.room_id)))
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err)
    }
  }

  const handleRoomAccess = async (roomId: string) => {
    setLoading(true)
    setError("")
    setSuccess("")
    setAccessResult(null)

    try {
      // Generate access token
      const accessToken = generateAccessToken(user.id)

      // Send token to backend for verification
      const response = await fetch("/api/access/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: accessToken,
          room_id: roomId,
        }),
      })

      const data = await response.json()
      setAccessResult(data)

      if (data.success) {
        setSuccess(`Access granted to ${roomId}!`)
      } else {
        setError(data.reason || "Access denied")
      }

      // Refresh logs
      fetchLogs()
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {accessResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {accessResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>Access Result</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Status:</strong>{" "}
                  <Badge variant={accessResult.success ? "default" : "destructive"}>
                    {accessResult.success ? "Granted" : "Denied"}
                  </Badge>
                </p>
                <p className="text-sm">
                  <strong>Message:</strong> {accessResult.message || accessResult.reason}
                </p>
                {accessResult.room && (
                  <div className="text-sm">
                    <strong>Room Details:</strong>
                    <ul className="ml-4 mt-1">
                      <li>ID: {accessResult.room.id}</li>
                      <li>Type: {accessResult.room.type}</li>
                      <li>Features: {accessResult.room.features.join(", ")}</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="access" className="space-y-6">
          <TabsList>
            <TabsTrigger value="access">Room Access</TabsTrigger>
            <TabsTrigger value="logs">My Access Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Assigned Rooms</CardTitle>
                <CardDescription>Click on a room to generate an access token and unlock the door</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room: any) => (
                    <Card key={room._id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {room.room_id}
                          <Key className="h-4 w-4 text-gray-400" />
                        </CardTitle>
                        <CardDescription>{room.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1">
                            {room.features.map((feature: string) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          <Button onClick={() => handleRoomAccess(room.room_id)} disabled={loading} className="w-full">
                            {loading ? (
                              <>
                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                Generating Token...
                              </>
                            ) : (
                              <>
                                <Key className="mr-2 h-4 w-4" />
                                Access Room
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {rooms.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Key className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No rooms assigned to you yet.</p>
                    <p className="text-sm">Contact your administrator to get room access.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Access History</CardTitle>
                <CardDescription>Recent access attempts and their results</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log._id}>
                        <TableCell>{log.room_id}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                        </TableCell>
                        <TableCell>{log.reason}</TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {logs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No access logs yet.</p>
                    <p className="text-sm">Your access attempts will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
