import { NotFoundError } from '../../domain/errors/AppError.js'

export class ProfileService {
  constructor({ userRepository, favoriteRepository, stationRepository }) {
    this.userRepository = userRepository
    this.favoriteRepository = favoriteRepository
    this.stationRepository = stationRepository
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId)
    if (!user) throw new NotFoundError('کاربر یافت نشد')
    return user.toPublic()
  }

  async updateProfile(userId, changes) {
    const user = await this.userRepository.updateProfile(userId, changes)
    if (!user) throw new NotFoundError('کاربر یافت نشد')
    return user.toPublic()
  }

  async listFavorites(userId) {
    return this.favoriteRepository.list(userId)
  }

  async addFavorite(userId, stationId) {
    const station = await this.stationRepository.findById(stationId)
    if (!station) throw new NotFoundError('ایستگاه یافت نشد')
    return this.favoriteRepository.add(userId, stationId)
  }

  async removeFavorite(userId, stationId) {
    return this.favoriteRepository.remove(userId, stationId)
  }

  async isFavorite(userId, stationId) {
    return this.favoriteRepository.isFavorite(userId, stationId)
  }
}
