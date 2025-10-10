import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})


/**
 * Upload buffer file lên Cloudinary
 * @param fileBuffer Buffer của file (ảnh / PDF)
 * @param folder Thư mục lưu trên Cloudinary
 * @param fileName Tên file (không có đuôi)
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw',
  fileName?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName, // optional
        resource_type: resourceType, // cho phép upload cả ảnh và PDF
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      },
      (err, result) => {
        if (err) return reject(err)
        resolve(result?.secure_url || '')
      }
    )

    stream.end(fileBuffer)
  })
}

export const uploadMetadataToCloudinary = async (
  metadata: Record<string, any>,
  folder: string,
  fileName: string
): Promise<string> => {
  const jsonString = JSON.stringify(metadata, null, 2)
  const buffer = Buffer.from(jsonString)
  const stream = Readable.from(buffer)

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName,
        resource_type: 'raw', // JSON là raw file
        format: 'json',
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      },
      (err, result) => {
        if (err) return reject(err)
        resolve(result?.secure_url || '')
      }
    )
    stream.pipe(uploadStream)
  })
}