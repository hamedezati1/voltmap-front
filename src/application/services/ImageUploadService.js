import { ValidationError } from '../../domain/errors/AppError.js'

export class ImageUploadService {
  constructor({ imageStorage }) {
    this.imageStorage = imageStorage
  }

  async saveStationImage(file) {
    if (!file?.buffer?.length) {
      throw new ValidationError('فایل عکس الزامی است')
    }
    return this.imageStorage.saveStationImage({
      buffer: file.buffer,
      mimetype: file.mimetype,
    })
  }
}
