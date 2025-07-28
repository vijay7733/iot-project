"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { AdminDashboard } from "@/components/admin-dashboard"
import { ManagerDashboard } from "@/components/manager-dashboard"
import { RegistrationForm } from "@/components/registration-form"

export default function Home() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState("")
  const [showRegistration, setShowRegistration] = useState(false)

  useEffect(() => {
    // Check for existing session
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (newToken: string, newUser: any) => {
    setToken(newToken)
    setUser(newUser)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken("")
    setUser(null)
  }

  const handleRegistrationComplete = () => {
    setShowRegistration(false)
  }

  if (showRegistration) {
    return <RegistrationForm onRegistrationComplete={handleRegistrationComplete} />
  }

  if (!user || !token) {
    return (
      <div>
        <LoginForm onLogin={handleLogin} />
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowRegistration(true)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Complete Manager Registration
          </button>
        </div>
      </div>
    )
  }

  if (user.role === "admin") {
    return <AdminDashboard user={user} token={token} onLogout={handleLogout} />
  }

  if (user.role === "manager") {
    return <ManagerDashboard user={user} token={token} onLogout={handleLogout} />
  }

  return <LoginForm onLogin={handleLogin} />
}
