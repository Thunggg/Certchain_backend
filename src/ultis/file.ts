import fs from 'fs'
import path from 'path'

// đảm bảo thư mục tồn tại. Nếu không tồn tại thì tạo thư mục
export const ensureDir = async (dirPath: string) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true })
  } catch (err) {
    console.error(`Error creating directory: ${err as string}`)
  }
}

export const saveFile = async (filePath: string, buffer: Buffer) => {
  await ensureDir(path.dirname(filePath))
  await fs.promises.writeFile(filePath, buffer)
}

