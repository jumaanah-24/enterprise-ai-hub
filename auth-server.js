import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/index.js'

const { Pool } = pg
const pool    = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

const app = express()
app.use(cors())
app.use(express.json())

// ── Register ──────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ detail: 'Name, email and password are required.' })

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing)
      return res.status(409).json({ detail: 'Email already registered.' })

    const hashed = await bcrypt.hash(password, 10)
    const user   = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, role: true },
    })
    return res.status(201).json({ user })
  } catch (err) {
    console.error('Register error:', err.message)
    return res.status(500).json({ detail: 'Server error. Please try again.' })
  }
})

// ── Login ─────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ detail: 'Email and password are required.' })

  // Demo credentials (no DB needed)
  const DEMO = { 'admin@enterprise.ai': 'admin123', 'user@enterprise.ai': 'user123' }
  if (DEMO[email] !== undefined) {
    if (DEMO[email] !== password)
      return res.status(401).json({ detail: 'Invalid email or password.' })
    const name = email.split('@')[0]
    return res.json({ user: { id: 0, name, email, role: 'admin' } })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ detail: 'Invalid email or password.' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ detail: 'Invalid email or password.' })

    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error('Login error:', err.message)
    return res.status(500).json({ detail: 'Server error. Please try again.' })
  }
})

// ── Health ────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'auth-server' }))

const PORT = 8080
app.listen(PORT, () => console.log(`Auth server running on http://localhost:${PORT}`))
