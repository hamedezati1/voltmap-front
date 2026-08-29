import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchStations, fetchVehicles, updateVehicle } from '../../api'
import { computeRealRange, planTrip } from './tripEngine'
import { isGoldMember } from './membership'
import { startGoldPayment } from './startGoldPayment'
import TripIntro from './TripIntro'
import VehicleSetup from './VehicleSetup'
import TripPlanner from './TripPlanner'

export default function Trip() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isGold = isGoldMember(user)

  const [step, setStep] = useState('intro')
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [userRange, setUserRange] = useState('')
  const [currentBattery, setCurrentBattery] = useState('')
  const [weather, setWeather] = useState({ temp: 22, ac: false, heat: false })
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [stations, setStations] = useState([])
  const [planning, setPlanning] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetchVehicles()
      .then((list) => {
        const items = Array.isArray(list) ? list : []
        setVehicles(items)
        const def = items.find((v) => v.isDefault) || items[0]
        if (def) {
          setSelectedVehicle(def)
          setUserRange(String(def.estimatedRange || ''))
        }
      })
      .catch(() => {})
    fetchStations()
      .then((list) => setStations(Array.isArray(list) ? list : []))
      .catch(() => setStations([]))
  }, [])

  const handleStart = () => {
    if (!isGold) {
      startGoldPayment({ navigate, returnTo: '/trip' })
      return
    }
    setStep('vehicle')
  }

  const handlePlan = useCallback(async () => {
    if (!origin || !destination || !userRange || !currentBattery) return
    setPlanning(true)
    setResult(null)

    const baseRange = parseInt(userRange, 10)
    const batteryPct = parseInt(currentBattery, 10)

    if (selectedVehicle) {
      await updateVehicle(selectedVehicle.id, { estimatedRange: baseRange }).catch(() => {})
    }

    const realRange = computeRealRange(baseRange, batteryPct, weather)
    const vehicleConnector = selectedVehicle?.connector
    const compatibleStations = vehicleConnector
      ? stations.filter((s) => {
          if (!s.connector && !s.connectors) return true
          const stationConnectors = String(s.connectors || s.connector)
            .split('+')
            .map((x) => x.trim())
          const vehicleConnectors = vehicleConnector.split('+').map((x) => x.trim())
          return vehicleConnectors.some((vc) =>
            stationConnectors.some((sc) => sc.toLowerCase().includes(vc.toLowerCase())),
          )
        })
      : stations

    if (compatibleStations.length === 0 && vehicleConnector) {
      setResult({
        feasible: false,
        totalDist: 0,
        stops: [],
        finalBattery: 0,
        warnings: [`⚠️ هیچ ایستگاهی با نازل ${vehicleConnector} در مسیر پیدا نشد`],
        message: 'ایستگاه سازگار پیدا نشد',
      })
      setPlanning(false)
      return
    }

    const plan = planTrip({
      origin,
      destination,
      realRange,
      baseRange,
      batteryPct,
      stations: compatibleStations,
      minArrival: 25,
    })
    setResult(plan)
    setPlanning(false)
  }, [origin, destination, userRange, currentBattery, weather, stations, selectedVehicle])

  if (step === 'intro') {
    return <TripIntro onStart={handleStart} />
  }

  if (step === 'vehicle') {
    return (
      <VehicleSetup
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={(v) => {
          setSelectedVehicle(v)
          setUserRange(String(v.estimatedRange || ''))
        }}
        userRange={userRange}
        onRangeChange={setUserRange}
        currentBattery={currentBattery}
        onBatteryChange={setCurrentBattery}
        weather={weather}
        onWeatherChange={setWeather}
        onBack={() => setStep('intro')}
        onContinue={() => {
          if (!userRange || !currentBattery) return
          setStep('planner')
        }}
      />
    )
  }

  return (
    <TripPlanner
      origin={origin}
      destination={destination}
      onOriginChange={(pos) => {
        setOrigin(pos)
        setResult(null)
      }}
      onDestinationChange={(pos) => {
        setDestination(pos)
        setResult(null)
      }}
      onPlan={handlePlan}
      planning={planning}
      result={result}
      currentBattery={currentBattery}
      onEditVehicle={() => setStep('vehicle')}
    />
  )
}
