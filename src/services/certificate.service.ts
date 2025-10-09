import { createHash } from 'crypto'
import path from 'path'
import { BadRequestError } from '~/ultis/CustomErrors'
import { saveFile } from '~/ultis/file'
import { addWatermark } from '~/ultis/Watermark'

type MintParams = {
  owner: string
  file: Express.Multer.File
}

export const mintCertificateService = async ({ owner, file }: MintParams) => {
  if(file.mimetype !== 'application/pdf' || !file.mimetype.startsWith("image/")) {
    throw new BadRequestError('File type not supported')
  }

  // 1) hash file (SHA256)
  const fileHashHex = createHash('sha256').update(file.buffer).digest('hex')
  const fileHashBytes32 = '0x' + fileHashHex


  // 2) Watermark + lưu file vào public/uploads
  const watermarkedBuffer = await addWatermark(file.buffer, file.mimetype)

  const ext = file.mimetype === 'application/pdf' ? '.pdf' : file.mimetype === 'image/png' ? '.png' : '.jpg'
  const outName = `${fileHashHex}_wm${ext}`
  const outPath = path.resolve(process.cwd(), 'public', 'uploads', outName)

  await saveFile(outPath, watermarkedBuffer as Buffer)


  // 3) Ký số hash bằng private key issuer

  // 4) Lưu metadata JSON vào public/metadata

  // 5) Mint on-chain

  // 6) Lưu MongoDB

  // 7) QR
}
