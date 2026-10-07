/**
 * Port (Interface) مخزن کاربران.
 * هر Adapter پایگاه‌داده (Postgres, MySQL, InMemory برای تست و ...) باید این متدها را پیاده‌سازی کند.
 * لایه‌ی Application فقط به این Interface وابسته است، نه به یک DB خاص (DIP از SOLID).
 */
export class UserRepository {
  async create(_user) { throw new Error('Not implemented') }
  async findById(_id) { throw new Error('Not implemented') }
  async findByEmail(_email) { throw new Error('Not implemented') }
  async findByPhone(_phone) { throw new Error('Not implemented') }
  async findByEmailOrPhone(_identifier) { throw new Error('Not implemented') }
  async updateMembership(_id, _membership) { throw new Error('Not implemented') }
  async updateProfile(_id, _changes) { throw new Error('Not implemented') }
  async incrementUsageStats(_id, { _sessions, _kwh }) { throw new Error('Not implemented') }
  async list() { throw new Error('Not implemented') }
}
