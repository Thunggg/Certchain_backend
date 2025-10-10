import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import mintRouter from './routes/certificate.route'
import multer from 'multer'
import { errorHandler } from './middlewares/error.middlewares'
import 'dotenv/config'
import { BadRequestError } from './ultis/CustomErrors'

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 10 // 10Mb
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestError('File type not supported'))
    }
    cb(null, true)
  }
})

// body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/mint', upload.single('file'), mintRouter)

app.use(errorHandler)

const PORT = Number(process.env.PORT || 3000)
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`)
})
