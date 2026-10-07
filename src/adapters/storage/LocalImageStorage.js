import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { ImageStorage } from '../../application/ports/services/ImageStorage.js'
import { ValidationError } from '../../domain/errors/AppError.js'

const EXTENSION_BY_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

/**
 * عکس را روی دیسک همین سرور ذخیره می‌کند.
 * اسم فایل از نام اصلی کاربر ساخته نمی‌شود تا آدرس یکتا و امن بماند.
 */
export class LocalImageStorage extends ImageStorage {
  constructor({ rootDir }) {
    super()
    this.rootDir = rootDir
  }

  async saveStationImage(file) {
    const ext = EXTENSION_BY_TYPE[file?.mimetype]
    if (!ext || !file.buffer?.length) {
      throw new ValidationError('فقط عکس jpg، png یا webp مجاز است')
    }

    const id = randomUUID()
    const filename = `${id}${ext}`
    const relativePath = `stations/${filename}`
    const directory = path.join(this.rootDir, 'stations')
    await fs.mkdir(directory, { recursive: true })
    await fs.writeFile(path.join(directory, filename), file.buffer)
    return { id, path: relativePath }
  }
}
