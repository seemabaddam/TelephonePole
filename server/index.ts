import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

// TODO Agent 2: connectDB()
// TODO Agent 3: app.use('/api/events', eventsRouter)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
