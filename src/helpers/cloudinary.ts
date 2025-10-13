import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'
import { CertificateModel } from '~/models/schemas/Certificate'
import { ConflictError } from '~/ultis/CustomErrors'

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

const isFileExist = async (folder: string, publicId: string, resourceType: 'image' | 'raw'): Promise<boolean> => {
  try {
    await cloudinary.api.resource(`${folder}/${publicId}`, { resource_type: resourceType })
    return true
  } catch (error: any) {
    const httpCode = error?.http_code || error?.error?.http_code
    if (httpCode === 404) {
      return false
    }
    throw error
  }
}

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
  const checkFile = await isFileExist(folder, fileName as string, resourceType)
  if (checkFile) {
    const exist = await CertificateModel.findOne({ publishedHash: fileName })
      .select('status')
      .lean()

    if (exist && exist.status !== 'minted') {
      return cloudinary.url(`${folder}/${fileName}`, { secure: true, resource_type: resourceType })
    }

    throw new ConflictError('File already exists!')
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName, // optional
        resource_type: resourceType, // cho phép upload cả ảnh và PDF
        use_filename: true,
        unique_filename: false,
        overwrite: false
      },
      (err, result) => {
        if (err) {
          console.error('Cloudinary upload error:', err)
          return reject(err)
        }
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
  const checkFile = await isFileExist(folder, fileName as string, 'raw')

  if (checkFile) {
    // Idempotent: nếu metadata đã từng upload, trả về URL hiện có
    try {
      const res = await cloudinary.api.resource(`${folder}/${fileName}`, { resource_type: 'raw' })
      if (res?.secure_url) return res.secure_url
    } catch (error) {
      // nếu không lấy được secure_url, fallback throw như trước
      throw new ConflictError('File already exists!')
    }
  }

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
        overwrite: false
      },
      (err, result) => {
        if (err) {
          console.error('Cloudinary upload error:', err)
          return reject(err)
        }
        resolve(result?.secure_url || '')
      }
    )
    stream.pipe(uploadStream)
  })
}
