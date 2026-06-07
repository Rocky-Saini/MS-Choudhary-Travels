'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, RefreshCw, CalendarDays } from 'lucide-react'
import { VehicleCard } from '@/components/vehicle-card'
import { BookingModal } from '@/components/booking-modal'
import { WaitingListModal } from '@/components/waiting-list-modal'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/loader'

interface Trip {
  id: string
  vehicleNumber: string
  driverName: string
  driverMobile: string
  departureTime: string
  totalSeats: number
  bookedSeats: number
  fare: number
  route: string
  advanceRequired: boolean
  tag: string | null
  date: string
}

function getNext7Days(): { date: string; label: string; day: string }[] {
  const days = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    // Use local date parts to avoid UTC timezone shift
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

export function TripSection() {
  const [activeRoute, setActiveRoute] = useState<'gangoh-delhi' | 'delhi-gangoh'>('gangoh-delhi')
  const [selectedDate, setSelectedDate] = useState(getNext7Days()[0].date)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWaitingOpen, setIsWaitingOpen] = useState(false)

  const dates = getNext7Days()

  const fetchTrips = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips?route=${activeRoute}&date=${selectedDate}`)
      const data = await res.json()
      setTrips(data.trips || [])
    } catch (error) {
      console.error('Failed to fetch trips:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [activeRoute, selectedDate])

  const handleBook = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId)
    if (trip) {
      setSelectedTrip(trip)
      setIsModalOpen(true)
    }
  }

  const allFull = trips.length > 0 && trips.every(t => t.totalSeats - t.bookedSeats <= 0)
  const noTrips = !loading && trips.length === 0

  // Only show waiting list for future dates or today if trips haven't departed yet
  const isToday = selectedDate === getNext7Days()[0].date
  const isFutureDate = !isToday
  // For today: check if current time is before latest trip departure (approximate: before 9 AM for Gangoh→Delhi, before 6 PM for Delhi→Gangoh)
  const now = new Date()
  const currentHour = now.getHours()
  const routeStillActive = isToday
    ? (activeRoute === 'gangoh-delhi' ? currentHour < 9 : currentHour < 18)
    : true

  const showWaitingOption = (allFull || noTrips) && (isFutureDate || routeStillActive)

  return (
    <section id="trips" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Available Trips</h2>
        <p className="text-gray-600">Book your seat up to 7 days in advance</p>
      </motion.div>

      {/* Route Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center bg-white/70 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-200 shadow-lg">
          <button
            onClick={() => setActiveRoute('gangoh-delhi')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeRoute === 'gangoh-delhi'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gangoh <ArrowRight className="w-4 h-4" /> Delhi
          </button>
          <button
            onClick={() => setActiveRoute('delhi-gangoh')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeRoute === 'delhi-gangoh'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Delhi <ArrowRight className="w-4 h-4" /> Gangoh
          </button>
        </div>
      </div>

      {/* Date Selector - 7 days */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <CalendarDays className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">Select Date</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 justify-start sm:justify-center px-1">
          {dates.map((d) => (
            <button
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              className={`flex flex-col items-center px-3 py-3 rounded-xl min-w-[70px] shrink-0 transition-all duration-200 ${
                selectedDate === d.date
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <span className={`text-[10px] uppercase font-medium ${selectedDate === d.date ? 'text-indigo-200' : 'text-gray-400'}`}>
                {d.day}
              </span>
              <span className="text-sm font-bold mt-0.5">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Refresh */}
      <div className="flex justify-end mb-6">
        <Button variant="ghost" size="sm" onClick={fetchTrips} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Trip Cards Grid */}
      {loading ? (
        <Loader text="Finding available trips..." />
      ) : trips.length > 0 ? (
        <>
          {showWaitingOption && (
            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-amber-800 flex items-center gap-2">{noTrips ? '📅 No Trips Scheduled Yet' : '⏳ All Seats Full'}</h3>
                <p className="text-sm text-amber-700">{noTrips ? 'Once trips are scheduled, your seat will be added automatically.' : 'Join the waiting list — we\'ll contact you if a seat opens up.'}</p>
              </div>
              <Button onClick={() => setIsWaitingOpen(true)} className="bg-amber-500 hover:bg-amber-600">
                Join Waiting List
              </Button>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <VehicleCard key={trip.id} trip={trip} onBook={handleBook} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No trips available for this date.</p>
          <p className="text-gray-400 text-sm mt-2">Try selecting another date or join the waiting list.</p>
          {showWaitingOption && (
            <div className="mt-6">
              <Button onClick={() => setIsWaitingOpen(true)} className="bg-amber-500 hover:bg-amber-600">
                ⏳ Join Waiting List
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTrip(null)
          fetchTrips()
        }}
        trip={selectedTrip ? {
          ...selectedTrip,
          availableSeats: selectedTrip.totalSeats - selectedTrip.bookedSeats,
        } : null}
      />

      {/* Waiting List Modal */}
      <WaitingListModal
        isOpen={isWaitingOpen}
        onClose={() => setIsWaitingOpen(false)}
        route={activeRoute}
        date={selectedDate}
        reason={noTrips ? 'no-trips' : 'full'}
      />
    </section>
  )
}
