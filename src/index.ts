import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import mintRouter from './routes/mint'

const app = express()

// body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/mint', mintRouter)

const PORT = Number(process.env.PORT || 3000)
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`)
})
