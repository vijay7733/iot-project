// MongoDB Seed Data Script
// Run this script to populate initial data

const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

const uri = "mongodb://localhost:27017"
const dbName = "secure_hotel"

async function seedData() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(dbName)

    console.log("Connected to MongoDB")

    // Clear existing data
    await db.collection("users").deleteMany({})
    await db.collection("rooms").deleteMany({})
    await db.collection("access_logs").deleteMany({})

    console.log("Cleared existing data")

    // Create admin user
    const adminPin = await bcrypt.hash("1234", 12)
    await db.collection("users").insertOne({
      role: "admin",
      name: "Hotel Administrator",
      email: "admin@hotel.com",
      pin: adminPin,
      status: "active",
      assigned_rooms: [],
      created_at: new Date(),
    })

    console.log("Created admin user (email: admin@hotel.com, PIN: 1234)")

    // Create sample rooms
    const rooms = [
      {
        room_id: "R101",
        type: "Standard",
        features: ["Wi-Fi", "AC", "TV"],
        status: "available",
      },
      {
        room_id: "R102",
        type: "Deluxe",
        features: ["Wi-Fi", "AC", "TV", "Mini Bar"],
        status: "available",
      },
      {
        room_id: "R201",
        type: "Suite",
        features: ["Wi-Fi", "AC", "TV", "Mini Bar", "Balcony"],
        status: "available",
      },
      {
        room_id: "R202",
        type: "Presidential",
        features: ["Wi-Fi", "AC", "TV", "Mini Bar", "Balcony", "Jacuzzi"],
        status: "available",
      },
    ]

    await db.collection("rooms").insertMany(rooms)
    console.log("Created sample rooms")

    // Create sample manager (invited but not registered)
    await db.collection("users").insertOne({
      role: "manager",
      name: "John Manager",
      email: "manager@hotel.com",
      pin: "", // Empty PIN means not registered yet
      status: "inactive",
      assigned_rooms: ["R101", "R102"],
      invited_by: "admin@hotel.com",
      created_at: new Date(),
    })

    console.log("Created sample manager invitation (email: manager@hotel.com)")
    console.log("Manager can complete registration with any 4-digit PIN")

    console.log("\n=== SETUP COMPLETE ===")
    console.log("Admin Login: admin@hotel.com / PIN: 1234")
    console.log("Manager Registration: manager@hotel.com / Set your own PIN")
  } catch (error) {
    console.error("Error seeding data:", error)
  } finally {
    await client.close()
  }
}

seedData()
