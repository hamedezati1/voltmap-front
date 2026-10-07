import { NotFoundError, ValidationError } from '../../domain/errors/AppError.js'

export class NewsService {
  constructor({ newsRepository }) {
    this.newsRepository = newsRepository
  }

  async list() {
    return this.newsRepository.findAll()
  }

  async create(data) {
    if (!data.title || !data.body) throw new ValidationError('عنوان و متن خبر الزامی است')
    return this.newsRepository.create(data)
  }

  async update(id, data) {
    const updated = await this.newsRepository.update(id, data)
    if (!updated) throw new NotFoundError('خبر یافت نشد')
    return updated
  }

  async delete(id) {
    return this.newsRepository.delete(id)
  }
}
