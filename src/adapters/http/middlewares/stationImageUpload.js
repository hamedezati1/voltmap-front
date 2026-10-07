import multer from 'multer'
import { ValidationError } from '../../../domain/errors/AppError.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
})

/** فیلد فایل باید image باشد. حجم مجاز ۵ مگابایت. */
export function stationImageUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ValidationError('حجم عکس بیشتر از ۵ مگابایت است'))
    }
    return next(new ValidationError('فایل عکس نامعتبر است'))
  })
}
