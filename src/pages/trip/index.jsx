import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchVehicles, planRoute, updateVehicle } from '../../api'
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

    const vehicleRange = parseInt(userRange, 10)
    const batteryPct = parseInt(currentBattery, 10)

    if (selectedVehicle) {
      await updateVehicle(selectedVehicle.id, {
        estimatedRange: vehicleRange,
        batteryLevel: batteryPct,
      }).catch(() => {})
    }

    try {
      const plan = await planRoute({
        origin: { lat: origin.lat, lng: origin.lng, name: origin.name },
        destination: { lat: destination.lat, lng: destination.lng, name: destination.name },
        vehicleRange,
        batteryPct,
        connector: selectedVehicle?.connector,
      })
      setResult({
        ...plan,
        stops: Array.isArray(plan?.stops) ? plan.stops : [],
        warnings: Array.isArray(plan?.warnings) ? plan.warnings : [],
      })
    } catch (err) {
      setResult({
        feasible: false,
        totalDist: 0,
        stops: [],
        finalBattery: 0,
        warnings: [err?.message || 'محاسبه مسیر انجام نشد'],
        message: 'خطا در محاسبه مسیر',
      })
    } finally {
      setPlanning(false)
    }
  }, [origin, destination, userRange, currentBattery, selectedVehicle])

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
