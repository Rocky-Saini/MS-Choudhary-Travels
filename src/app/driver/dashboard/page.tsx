'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/loader'
import { Car, Play, Square, MapPin, Users, Phone, LogOut, Navigation, User, CreditCard, CalendarDays } from 'lucide-react'

interface Booking {
  id: string; customerName: string; customerMobile: string; pickupPoint: string
  dropPoint: string; seats: number; totalFare: number; advancePaid: number
  remainingFare: number; status: string
}

interface Trip {
  id: string; status: string; departureTime: string; totalSeats: number
  bookedSeats: number; advanceRequired: boolean
  vehicle: { vehicleNumber: string }
  route: { origin: string; destination: string; fare: number }
  bookings: Booking[]
}

function getNext7Days() {
  const days = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    days.push({
      date: `${yyyy}-${mm}-${dd}`,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${d.getDate()} ${monthNames[d.getMonth()]}`,
      day: dayNames[d.getDay()],
    })
  }
  return days
}

export default function DriverDashboard() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [token, setToken] = useState('')
  const [driverName, setDriverName] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(getNext7Days()[0].date)
  const locationInterval = useRef<NodeJS.Timeout | null>(null)
  const dates = getNext7Days()

  useEffect(() => {
    const t = localStorage.getItem('driverToken')
    const name = localStorage.getItem('driverName')
    if (!t) { router.push('/driver/login'); return }
    setToken(t)
    setDriverName(name || 'Driver')
  }, [router])

  useEffect(() => {
    if (token) fetchTrips()
  }, [token, selectedDate])

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchTrips = async () => {
    setLoading(true)
    const res = await fetch(`/api/driver/trips?date=${selectedDate}`, { headers })
    if (res.ok) {
      const data = await res.json()
      setTrips(data.trips || [])
    }
    setLoading(false)
  }

  const handleTripAction = async (tripId: string, action: 'start' | 'stop') => {
    await fetch('/api/driver/trip-action', {
      method: 'POST', headers,
      body: JSON.stringify({ tripId, action }),
    })
    if (action === 'start') startLocationSharing()
    else stopLocationSharing()
    fetchTrips()
  }

  const startLocationSharing = () => {
    setIsSharing(true)
    locationInterval.current = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetch('/api/driver/location', {
              method: 'POST', headers,
              body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, heading: position.coords.heading, speed: position.coords.speed }),
            })
          },
          () => {}, { enableHighAccuracy: true }
        )
      }
    }, 15000)
  }

  const stopLocationSharing = () => {
    setIsSharing(false)
    if (locationInterval.current) { clearInterval(locationInterval.current); locationInterval.current = null }
  }

  const logout = () => {
    stopLocationSharing()
    localStorage.removeItem('driverToken')
    localStorage.removeItem('driverName')
    localStorage.removeItem('driverId')
    router.push('/driver/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {driverName}</h1>
          <p className="text-sm text-gray-500">Your trips & passengers</p>
        </div>
        <div className="flex items-center gap-3">
          {isSharing && (
            <Badge variant="secondary" className="animate-pulse">
              <Navigation className="w-3 h-3 mr-1" />GPS Active
            </Badge>
          )}
          <button onClick={logout} className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">Select Date</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((d) => (
            <button key={d.date} onClick={() => setSelectedDate(d.date)}
              className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[70px] transition-all ${
                selectedDate === d.date
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300'
              }`}>
              <span className={`text-[10px] uppercase font-medium ${selectedDate === d.date ? 'text-indigo-200' : 'text-gray-400'}`}>{d.day}</span>
              <span className="text-xs font-bold mt-0.5">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trips */}
      {loading ? (
        <Loader text="Loading trips..." />
      ) : (
        <div className="space-y-6">
          {trips.map((trip) => (
            <Card key={trip.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="w-5 h-5 text-indigo-600" />{trip.vehicle.vehicleNumber}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {trip.route.origin} → {trip.route.destination} • {new Date(trip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} • ₹{trip.route.fare}/seat
                    </p>
                  </div>
                  <Badge variant={trip.status === 'IN_PROGRESS' ? 'secondary' : trip.status === 'COMPLETED' ? 'default' : 'warning'}>
                    {trip.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Seat counter */}
                <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Passengers</span>
                      <span className="font-bold">{trip.bookedSeats}/{trip.totalSeats}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(trip.bookedSeats / trip.totalSeats) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Passenger List */}
                {trip.bookings.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User className="w-4 h-4" />Passengers ({trip.bookings.length})</h4>
                    {trip.bookings.map((booking) => (
                      <div key={booking.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{booking.customerName}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-emerald-500" />
                              <span className="text-xs text-gray-600">{booking.pickupPoint}</span>
                              <span className="text-xs text-gray-400 mx-1">→</span>
                              <MapPin className="w-3 h-3 text-red-500" />
                              <span className="text-xs text-gray-600">{booking.dropPoint}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500">{booking.seats} seat(s)</span>
                              <span className="text-xs text-gray-500">₹{booking.totalFare}</span>
                              {booking.advancePaid > 0 && <Badge variant="default" className="text-[10px]">Adv: ₹{booking.advancePaid}</Badge>}
                              {booking.remainingFare > 0 && <Badge variant="warning" className="text-[10px]"><CreditCard className="w-3 h-3 mr-1" />Due: ₹{booking.remainingFare}</Badge>}
                            </div>
                          </div>
                          <a href={`tel:${booking.customerMobile}`} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors ml-3">
                            <Phone className="w-4 h-4" /><span className="text-xs font-medium hidden sm:inline">Call</span>
                          </a>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">📞 {booking.customerMobile}</p>
                      </div>
                    ))}
                  </div>
                )}

                {trip.bookings.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No passengers booked yet</p>}

                {/* Actions */}
                {trip.status === 'SCHEDULED' && (
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleTripAction(trip.id, 'start')}>
                    <Play className="w-4 h-4 mr-2" />Start Journey
                  </Button>
                )}
                {trip.status === 'IN_PROGRESS' && (
                  <Button className="w-full" variant="destructive" onClick={() => handleTripAction(trip.id, 'stop')}>
                    <Square className="w-4 h-4 mr-2" />Complete Journey
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {trips.length === 0 && (
            <div className="text-center py-16">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No trips for this date</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
