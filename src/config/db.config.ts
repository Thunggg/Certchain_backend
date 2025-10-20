import mongoose from 'mongoose'

export const connectDb = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.1btnnox.mongodb.net/`, // databaseNameHere
      {
        dbName: process.env.DB_NAME
      }
    )
    console.log('database connection successfully')
  } catch (error) {
    console.log(`failed to connect database ${error}`)
    process.exit(1) // dừng app nếu không thể kết nối
  }
}