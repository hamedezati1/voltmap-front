export class PasswordHasher {
  async hash(_plain) { throw new Error('Not implemented') }
  async compare(_plain, _hash) { throw new Error('Not implemented') }
}
