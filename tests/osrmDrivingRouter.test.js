import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OsrmDrivingRouter } from '../src/adapters/routing/OsrmDrivingRouter.js'
import { AppError } from '../src/domain/errors/AppError.js'

test('OsrmDrivingRouter reads driving distance in kilometres', async () => {
  const router = new OsrmDrivingRouter({
    fetchImpl: async (url) => {
      assert.match(url, /51\.4,35\.7;52\.4,36\.3/)
      assert.match(url, /overview=full/)
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            code: 'Ok',
            routes: [
              {
                distance: 174320,
                duration: 9800,
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [51.4, 35.7],
                    [51.9, 36.0],
                    [52.4, 36.3],
                  ],
                },
              },
            ],
          }
        },
      }
    },
  })

  const route = await router.route({ lat: 35.7, lng: 51.4 }, { lat: 36.3, lng: 52.4 })
  assert.equal(route.distanceKm, 174.32)
  assert.deepEqual(route.coordinates[0], { lat: 35.7, lng: 51.4 })
  assert.equal(route.coordinates.length, 3)
})

test('OsrmDrivingRouter fails when no driving road exists', async () => {
  const router = new OsrmDrivingRouter({
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        return { code: 'NoRoute', routes: [] }
      },
    }),
  })

  await assert.rejects(
    () => router.route({ lat: 35.7, lng: 51.4 }, { lat: 36.3, lng: 52.4 }),
    (err) => err instanceof AppError && err.code === 'ROUTING_FAILED',
  )
})
