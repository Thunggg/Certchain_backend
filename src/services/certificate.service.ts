import { createHash } from 'crypto'
import path from 'path'
import { TYPE_CERTIFICATE } from '~/constants/type-certificate'
import { uploadMetadataToCloudinary, uploadToCloudinary } from '~/helpers/cloudinary'
import { generateMetadataJSON } from '~/helpers/generate-metadata'
import { BadRequestError } from '~/ultis/CustomErrors'
import { saveFile } from '~/ultis/file'
import { addWatermark } from '~/ultis/Watermark'

type MintParams = {
  owner: string
  file: Express.Multer.File
}

export const mintCertificateService = async ({ owner, file }: MintParams) => {
  if(file.mimetype !== 'application/pdf' && !file.mimetype.startsWith("image/")) {
    throw new BadRequestError('File type not supported')
  }

  const isImage = file.mimetype.startsWith('image/')
  const resourceType = isImage ? 'image' : 'raw'
  
  // 1) hash file (SHA256)
  const fileHashHex = createHash('sha256').update(file.buffer).digest('hex')
  const fileHashBytes32 = '0x' + fileHashHex

  // 2) Watermark + lưu file vào public/uploads
  const watermarkedBuffer = await addWatermark(file.buffer, file.mimetype)

  const ext = file.mimetype === 'application/pdf' ? '.pdf' : file.mimetype === 'image/png' ? '.png' : '.jpg'
  const outName = `${fileHashHex}_wm${ext}`
  const outPath = path.resolve(process.cwd(), 'public', 'uploads', outName)

  await saveFile(outPath, watermarkedBuffer as Buffer)


  // 3) Upload Cloudinary
  const fileUrl = await uploadToCloudinary(
    watermarkedBuffer as Buffer,
    'certificates',
    resourceType,
    fileHashHex
  )

  // 4) Tạo metadata JSON
  const metadata = generateMetadataJSON({
    name: 'Certificate', // người dùng tự định nghĩa
    description: 'Certificate', // mô tả ngắn gọn
    issuerName: 'FPT University', // tổ chức cấp
    issuerWallet: owner, // ví tổ chức cấp
    issueDate: new Date().toISOString(), // ngày cấp
    fileUrl: fileUrl, // url file
    previewImageUrl: resourceType === 'raw' ? `https://docs.google.com/gview?url=${fileUrl}&embedded=true` : fileUrl, // url ảnh xem trước
    hash: fileHashBytes32, // hash file
    type: TYPE_CERTIFICATE.certificate, // loại asset
  })

  // 5) Upload metadata JSON vào Cloudinary
  const metadataUrl = await uploadMetadataToCloudinary(
    metadata,
    'metadata',
    fileHashHex
  )

  console.log('metadataUrl', metadataUrl)

  // 3) Ký số hash bằng private key issuer

  // 4) Lưu metadata JSON vào public/metadata

  // 5) Mint on-chain

  // 6) Lưu MongoDB

  // 7) QR
}
