import { BlendMode, Jimp } from 'jimp'
import path from 'path'
import { degrees, PDFDocument, rgb } from 'pdf-lib'
import fs from 'fs'

/**
 * Thêm watermark vào file (ảnh hoặc PDF)
 * @param buffer buffer của file upload
 * @param mimetype MIME type (vd: image/png, application/pdf)
 * @returns Buffer của file đã watermark
 */
export const addWatermark = async (buffer: Buffer, mimetype: string) => {
  if (mimetype.startsWith('image/')) {
    // đọc ảnh và lấy font
    const image = await Jimp.read(buffer)

    // lấy kích thước ảnh
    const width = image.bitmap.width
    const height = image.bitmap.height

    // Đọc ảnh watermark
    const watermarkPath = path.resolve(process.cwd(), 'public', 'uploads', 'watermark.png')
    const watermark = await Jimp.read(watermarkPath)

    // resize watermark cho phù hợp (ví dụ 10% kích thước ảnh)
    const scale = Math.min(Math.max(width * 0.1, 50), 300) / width
    watermark.resize({ w: width * scale, h: height * scale })

    // Tạo lớp overlay riêng để chứa watermark
    const maxOverlaySize = 4096
    const overlayWidth = Math.min(width * 2, maxOverlaySize)
    const overlayHeight = Math.min(height * 2, maxOverlaySize)
    const overlay = new Jimp({ width: overlayWidth, height: overlayHeight, color: 0x00000000 })

    // Khoảng cách giữa các watermark
    const stepX = Math.max(Math.floor(width / 8), 80)
    const stepY = Math.max(Math.floor(height / 8), 80)

    // 4️⃣ In watermark theo dạng lặp
    for (let y = -height; y < height * 2; y += stepY) {
      for (let x = -width; x < width * 2; x += stepX) {
        overlay.composite(watermark, x, y, {
          mode: BlendMode.SRC_OVER,
          opacitySource: 0.25
        })
      }
    }

    // 5️⃣ Xoay overlay 45 độ
    overlay.rotate(45)

    // 6️⃣ Gộp overlay vào ảnh gốc
    image.composite(overlay, (width - overlay.bitmap.width) / 2, (height - overlay.bitmap.height) / 2, {
      mode: BlendMode.SRC_OVER,
      opacitySource: 0.8
    })

    // 7️⃣ Xuất kết quả
    return await image.getBuffer(mimetype as any)
  }

  if (mimetype.startsWith('application/pdf')) {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const pages = pdfDoc.getPages()

    // Đọc ảnh watermark
    const watermarkPath = path.resolve(process.cwd(), 'public', 'uploads', 'watermark.png')
    const watermarkBytes = fs.readFileSync(watermarkPath)
    const watermarkImage = await pdfDoc.embedPng(watermarkBytes)

    // Tùy chỉnh tỉ lệ watermark
    const scale = 0.3 // kích thước watermark
    const stepXFactor = 2.5 // khoảng cách ngang (theo lần kích thước watermark)
    const stepYFactor = 1.8 // khoảng cách dọc (theo lần kích thước watermark)
    const rotation = 45 // độ nghiêng
    const opacity = 0.2 // độ trong suốt

    for (const page of pages) {
      const { width, height } = page.getSize()
      const watermarkDims = watermarkImage.scale(scale)
      const stepX = watermarkDims.width * stepXFactor
      const stepY = watermarkDims.height * stepYFactor

      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          page.drawImage(watermarkImage, {
            x,
            y,
            width: watermarkDims.width,
            height: watermarkDims.height,
            rotate: degrees(rotation),
            opacity
          })
        }
      }
    }

    const out = await pdfDoc.save()
    return Buffer.from(out)
  }
}
