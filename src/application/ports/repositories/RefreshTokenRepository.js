export class RefreshTokenRepository {
  async store(_userId, _tokenHash, _expiresAt) { throw new Error('Not implemented') }
  async findValid(_tokenHash) { throw new Error('Not implemented') }
  async revoke(_tokenHash) { throw new Error('Not implemented') }
  async revokeAllForUser(_userId) { throw new Error('Not implemented') }
}
