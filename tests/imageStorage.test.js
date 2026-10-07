import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { LocalImageStorage } from '../src/adapters/storage/LocalImageStorage.js'
import { AppError } from '../src/domain/errors/AppError.js'

test('saves a station image under a unique relative path', async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'voltmap-storage-'))
  try {
    const storage = new LocalImageStorage({ rootDir })
    const saved = await storage.saveStationImage({
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-jpeg'),
    })

    assert.match(saved.path, /^stations\/[0-9a-f-]+\.jpg$/)
    const onDisk = await fs.readFile(path.join(rootDir, 'stations', `${saved.id}.jpg`))
    assert.equal(onDisk.toString(), 'fake-jpeg')
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
  }
})

test('rejects a file that is not a photo', async () => {
  const storage = new LocalImageStorage({ rootDir: os.tmpdir() })
  await assert.rejects(
    () => storage.saveStationImage({ mimetype: 'text/plain', buffer: Buffer.from('nope') }),
    (err) => err instanceof AppError && err.code === 'VALIDATION_ERROR',
  )
})
