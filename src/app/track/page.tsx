'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Car, Phone, User, Clock, Navigation } from 'lucide-react'

interface BookingDetails {
  id: string
  bookingCode: string
  customerName: string
  customerMobile: string
  pickupPoint: string
  dropPoint: string
  seats: number
  totalFare: number
  advancePaid: number
  remainingFare: number
  status: string
  trip: {
    status: string
    departureTime: string
    vehicle: { vehicleNumber: string }
    driver: { name: string; mobile: string; id: string }
    route: { origin: string; destination: string }
  }
}

interface LocationData {
  latitude: number
  longitude: number
  createdAt: string
}

export default function TrackBooking() {
  const [searchInput, setSearchInput] = useState('')
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [fullCarBooking, setFullCarBooking] = useState<{ id: string; customerName: string; pickupPoint: string; dropPoint: string; date: string; preferredTime: string; status: string; tripId: string | null } | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setBooking(null)
    setFullCarBooking(null)
    setLocation(null)

    try {
      const isCode = searchInput.length > 10
      const isMobile = /^\d{10}$/.test(searchInput)
      const isShortId = /^[A-Z0-9]{6,10}$/i.test(searchInput) && !isMobile

      const param = isCode ? `code=${searchInput}` : `mobile=${searchInput}`

      // Search regular bookings
      const res = await fetch(`/api/bookings?${param}`)
      const data = await res.json()

      if (data.bookings && data.bookings.length > 0) {
        setBooking(data.bookings[0])
        if (data.bookings[0].trip.status === 'IN_PROGRESS') {
          const locRes = await fetch(`/api/driver/location?driverId=${data.bookings[0].trip.driver.id}`)
          const locData = await locRes.json()
          if (locData.location) setLocation(locData.location)
        }
      }

      // Always search full car bookings by mobile too
      if (isMobile) {
        const fcRes = await fetch(`/api/full-car-booking?mobile=${searchInput}`)
        const fcData = await fcRes.json()
        if (fcData.entries && fcData.entries.length > 0) {
          setFullCarBooking(fcData.entries[0])
        }
      }
      // Search full car by booking ID (short code like CXFFOV9E)
      if (isShortId || isCode) {
        const fcRes = await fetch(`/api/full-car-booking?id=${searchInput}`)
        const fcData = await fcRes.json()
        if (fcData.entries && fcData.entries.length > 0) {
          setFullCarBooking(fcData.entries[0])
        }
      }

      // If neither found
      if ((!data.bookings || data.bookings.length === 0) && !fullCarBooking) {
        if (isMobile) {
          const fcCheck = await fetch(`/api/full-car-booking?mobile=${searchInput}`)
          const fcCheckData = await fcCheck.json()
          if (!fcCheckData.entries || fcCheckData.entries.length === 0) {
            setError('No booking found with this information')
          }
        } else if (!isShortId) {
          setError('No booking found')
        }
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Track Your Booking</h1>
          <p className="text-gray-600 mt-2">Enter your mobile number or booking code</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-5">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Mobile number or booking code"
                  className="pl-10"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Track'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm text-center mb-6">
            {error}
          </div>
        )}

        {/* Booking Details */}
        {booking && (
          <div className="space-y-4">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Booking Status</CardTitle>
                  <Badge
                    variant={
                      booking.status === 'CONFIRMED' ? 'secondary' :
                      booking.status === 'COMPLETED' ? 'default' :
                      booking.status === 'CANCELLED' ? 'destructive' : 'warning'
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Passenger</p>
                      <p className="text-sm font-medium">{booking.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Route</p>
                      <p className="text-sm font-medium">{booking.trip.route.origin} → {booking.trip.route.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Departure</p>
                      <p className="text-sm font-medium">
                        {new Date(booking.trip.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Seats</p>
                      <p className="text-sm font-medium">{booking.seats}</p>
                    </div>
                  </div>
                </div>

                {/* Pickup & Drop */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-sm text-gray-700">{booking.pickupPoint}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-sm text-gray-700">{booking.dropPoint}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver & Vehicle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Driver & Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-500">Vehicle</p>
                      <p className="text-sm font-medium">{booking.trip.vehicle.vehicleNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs text-gray-500">Driver</p>
                      <p className="text-sm font-medium">{booking.trip.driver.name}</p>
                    </div>
                  </div>
                </div>
                <a
                  href={`tel:${booking.trip.driver.mobile}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full p-3 bg-emerald-50 rounded-xl text-emerald-700 font-medium text-sm hover:bg-emerald-100 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Driver: {booking.trip.driver.mobile}
                </a>
              </CardContent>
            </Card>

            {/* Live Tracking */}
            {booking.trip.status === 'IN_PROGRESS' && location && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-emerald-600 animate-pulse" />
                    Live Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Navigation className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Last update: {new Date(location.createdAt).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 font-medium"
                      >
                        <MapPin className="w-4 h-4" />
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Fare</span>
                    <span className="font-medium">₹{booking.totalFare}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Advance Paid</span>
                    <span className="font-medium text-emerald-600">₹{booking.advancePaid}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                    <span className="text-gray-600">Remaining (pay to driver)</span>
                    <span className="font-bold text-indigo-600">₹{booking.remainingFare}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Car Booking Status */}
        {fullCarBooking && (
          <div className="space-y-4">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">🚗 Full Car Booking</CardTitle>
                  <Badge variant={fullCarBooking.status === 'PENDING' ? 'warning' : fullCarBooking.status === 'APPROVED' ? 'secondary' : 'destructive'}>
                    {fullCarBooking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Customer</p>
                      <p className="text-sm font-medium">{fullCarBooking.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm font-medium">{new Date(fullCarBooking.date).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-sm text-gray-700">{fullCarBooking.pickupPoint}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-sm text-gray-700">{fullCarBooking.dropPoint}</span>
                  </div>
                </div>
                {fullCarBooking.preferredTime && (
                  <p className="text-sm text-gray-600">🕐 Preferred: {fullCarBooking.preferredTime}</p>
                )}
                <p className="text-xs text-gray-400 font-mono">Booking ID: {fullCarBooking.id.slice(-8).toUpperCase()}</p>

                {fullCarBooking.status === 'PENDING' && (
                  <div className="p-4 bg-amber-50 rounded-xl text-center">
                    <p className="text-amber-700 font-medium">⏳ Awaiting Admin Approval</p>
                    <p className="text-xs text-amber-600 mt-1">We&apos;ll notify you once a vehicle is assigned.</p>
                    <p className="text-xs text-gray-500 mt-2">💰 Fare: As discussed with admin. Pay to driver after ride.</p>
                  </div>
                )}
                {fullCarBooking.status === 'APPROVED' && (
                  <div className="p-4 bg-emerald-50 rounded-xl text-center">
                    <p className="text-emerald-700 font-medium">✅ Approved! Vehicle Assigned</p>
                    <p className="text-xs text-emerald-600 mt-1">Check WhatsApp for vehicle & driver details.</p>
                    <p className="text-xs text-gray-500 mt-2">💰 Pay fare to driver as discussed with admin after ride.</p>
                  </div>
                )}
                {fullCarBooking.status === 'REJECTED' && (
                  <div className="p-4 bg-red-50 rounded-xl text-center">
                    <p className="text-red-700 font-medium">❌ Request Rejected</p>
                    <p className="text-xs text-red-600 mt-1">No vehicle available. Please try again or call: +91 7830673603</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
