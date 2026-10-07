import { test } from 'node:test'
import assert from 'node:assert'
import http from 'node:http'
import { createApp } from '../src/adapters/http/app.js'
import { buildContainer } from '../src/infrastructure/container.js'
import { closePool } from '../src/infrastructure/database/pool.js'

// این تست فقط wiring اپ رو چک می‌کنه — مسیرهای عمومی مثل /health
test('GET /health returns ok', async () => {
  const container = buildContainer()
  const app = createApp(container)
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()

  try {
    const body = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }))
      }).on('error', reject)
    })

    assert.strictEqual(body.status, 200)
    assert.strictEqual(body.json.status, 'ok')
  } finally {
    await new Promise((resolve) => server.close(resolve))
    await closePool()
  }
})
