import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planTrip } from '../src/application/services/tripPlanner.js'

const origin = { lat: 35.7, lng: 51.4 }
const destination = { lat: 36.3, lng: 52.4 }

test('without a driving route, totalDist is the straight line', () => {
  const plan = planTrip({
    origin,
    destination,
    baseRange: 400,
    batteryPct: 100,
    stations: [],
    minArrival: 25,
  })
  assert.equal(plan.totalDist, 112)
})

test('totalDist follows the driving route, not the straight line', () => {
  const drivingRoute = {
    distanceKm: 174,
    coordinates: [
      { lat: 35.7, lng: 51.4 },
      { lat: 36.0, lng: 51.9 },
      { lat: 36.3, lng: 52.4 },
    ],
  }
  const plan = planTrip({
    origin,
    destination,
    baseRange: 400,
    batteryPct: 100,
    stations: [],
    minArrival: 25,
    drivingRoute,
  })

  assert.equal(plan.totalDist, 174)
  assert.equal(plan.feasible, true)
  assert.equal(plan.finalBattery, 57)
})

test('a road longer than the straight line can make the same trip impossible', () => {
  const straight = planTrip({
    origin,
    destination,
    baseRange: 160,
    batteryPct: 100,
    stations: [],
    minArrival: 25,
  })
  const driving = planTrip({
    origin,
    destination,
    baseRange: 160,
    batteryPct: 100,
    stations: [],
    minArrival: 25,
    drivingRoute: {
      distanceKm: 174,
      coordinates: [origin, destination],
    },
  })

  assert.equal(straight.feasible, true)
  assert.equal(driving.feasible, false)
  assert.equal(driving.totalDist, 174)
})

test('arrival from 5 up to 10 percent is feasible and warns', () => {
  const plan = planTrip({
    origin,
    destination,
    baseRange: 310,
    batteryPct: 100,
    stations: [],
    drivingRoute: {
      distanceKm: 292,
      coordinates: [origin, destination],
    },
  })

  assert.equal(plan.feasible, true)
  assert.equal(plan.finalBattery, 6)
  assert.deepEqual(plan.warnings, ['شارژ هنگام رسیدن به مقصد حدود 6 درصد است.'])
})

test('arrival under 5 percent is impossible', () => {
  const plan = planTrip({
    origin,
    destination,
    baseRange: 310,
    batteryPct: 100,
    stations: [],
    drivingRoute: {
      distanceKm: 300,
      coordinates: [origin, destination],
    },
  })

  assert.equal(plan.feasible, false)
  assert.equal(plan.message, 'این سفر با برد تجربی خودرو ممکن نیست')
})
