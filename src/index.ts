import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import mintRouter from './routes/certificate.route'
import multer from 'multer'
import { errorHandler } from './middlewares/error.middlewares'
import 'dotenv/config'

const app = express()
const upload = multer()

// body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/mint', upload.single('file'), mintRouter)

app.use(errorHandler)

const PORT = Number(process.env.PORT || 3000)
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`)
})
