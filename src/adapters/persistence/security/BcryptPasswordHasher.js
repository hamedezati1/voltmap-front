import bcrypt from 'bcryptjs'
import { PasswordHasher } from '../../../application/ports/services/PasswordHasher.js'

const SALT_ROUNDS = 12

export class BcryptPasswordHasher extends PasswordHasher {
  async hash(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS)
  }

  async compare(plain, hash) {
    return bcrypt.compare(plain, hash)
  }
}
