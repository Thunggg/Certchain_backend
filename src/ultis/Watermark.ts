import { BlendMode, Jimp } from 'jimp'
import path from 'path'

/**
 * Thêm watermark vào file (ảnh hoặc PDF)
 * @param buffer buffer của file upload
 * @param mimetype MIME type (vd: image/png, application/pdf)
 * @param text nội dung watermark (vd: CERT:0xabc123)
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
    const scale = 0.1
    watermark.resize({ w: width * scale, h: height * scale })

    // Tạo lớp overlay riêng để chứa watermark
    const overlay = new Jimp({ width: width * 3, height: height * 3, color: 0x00000000 })

    // Khoảng cách giữa các watermark
    const stepX = 300
    const stepY = 200

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
    overlay.rotate(-45)

    // 6️⃣ Gộp overlay vào ảnh gốc
    image.composite(overlay, - width *0.75 , - height *0.75, {
      mode: BlendMode.SRC_OVER,
      opacitySource: 0.8
    })

    // 7️⃣ Xuất kết quả
    return await image.getBuffer(mimetype as any)
  }
}
