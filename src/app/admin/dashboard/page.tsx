'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  BarChart3, Car, Users, CreditCard, Calendar,
  Plus, LogOut, MapPin, Clock, Trash2, X, Check,
  Phone, UserPlus, Route, ToggleLeft, ToggleRight, Edit, Zap, CheckSquare, Square, Bus
} from 'lucide-react'
import { Loader } from '@/components/loader'

const GANGOH_STOPS = ['Gangoh', 'Chandpura', 'Fatehpur', 'Titron', 'Jalalabad', 'Baghpat']
const DELHI_STOPS = ['Loni', 'Kashmere Gate Metro Station Gate 4', 'Kashmere Gate Metro Station Gate 3', 'Kashmere Gate Metro Station Gate 1']

interface DashboardData {
  totalRevenue: number; totalBookings: number; pendingPayments: number; todayBookings: number
  totalVehicles: number; activeDrivers: number; seatOccupancy: number
  todayTrips: TodayTrip[]
}
interface TodayTrip {
  id: string; vehicleNumber: string; driverName: string; driverMobile: string; route: string
  departureTime: string; totalSeats: number; bookedSeats: number; availableSeats: number
  status: string; advanceRequired: boolean
  bookings: { id: string; customerName: string; customerMobile: string; pickupPoint: string; dropPoint: string; seats: number; totalFare: number; advancePaid: number; remainingFare: number; status: string }[]
}
interface Driver { id: string; name: string; mobile: string; isActive: boolean }
interface Vehicle { id: string; vehicleNumber: string; isActive: boolean; driverId: string | null; driver: { id: string; name: string; mobile: string } | null }
interface TripData { id: string; departureTime: string; date: string; totalSeats: number; bookedSeats: number; status: string; advanceRequired: boolean; tag: string | null; vehicle: { vehicleNumber: string }; driver: { name: string; mobile: string }; route: { origin: string; destination: string; fare: number } }
interface BookingData { id: string; customerName: string; customerMobile: string; pickupPoint: string; dropPoint: string; seats: number; totalFare: number; advancePaid: number; remainingFare: number; status: string; bookingCode: string; createdAt: string }

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'vehicles' | 'trips' | 'bookings' | 'bus'>('dashboard')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [trips, setTrips] = useState<TripData[]>([])
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [busServices, setBusServices] = useState<{ id: string; name: string; routeFrom: string; routeTo: string; departureTime: string; contactNumber: string; fare: string; description: string; isActive: boolean }[]>([])
  const [showBusForm, setShowBusForm] = useState(false)
  const [editingBus, setEditingBus] = useState<{ id: string; name: string; routeFrom: string; routeTo: string; departureTime: string; contactNumber: string; fare: string; description: string; isActive: boolean } | null>(null)
  const [busForm, setBusForm] = useState({ name: 'Travel Bus', routeFrom: '', routeTo: '', departureTime: '', contactNumber: '7830673603', fare: '', description: '' })
  const [token, setToken] = useState('')
  const [pageLoading, setPageLoading] = useState(false)

  // Admin Book Seat
  const [bookingTripId, setBookingTripId] = useState<string | null>(null)
  const [adminBookForm, setAdminBookForm] = useState({ customerName: '', customerMobile: '', pickupPoint: '', dropPoint: '', seats: 1 })
  const [lastWhatsAppLink, setLastWhatsAppLink] = useState('')

  // Shift Passenger
  const [shiftingBooking, setShiftingBooking] = useState<{ id: string; customerName: string; seats: number; currentTripId: string } | null>(null)
  const [shiftWhatsAppLink, setShiftWhatsAppLink] = useState('')
  const [shiftLoading, setShiftLoading] = useState(false)

  // Exchange
  const [shiftMode, setShiftMode] = useState<'shift' | 'exchange'>('shift')
  const [exchangeResult, setExchangeResult] = useState<{ whatsappLinkA: string; whatsappLinkB: string; passengerA: string; passengerB: string } | null>(null)

  // Forms
  const [showDriverForm, setShowDriverForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [driverForm, setDriverForm] = useState({ name: '', mobile: '', password: '' })
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: '', driverId: '' })
  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null)
  const [tripForm, setTripForm] = useState({ vehicleId: '', driverId: '', routeId: '', departureTime: '', date: '', advanceRequired: false, tag: '' })

  // Smart Trip Creator
  const [showSmartCreator, setShowSmartCreator] = useState(false)
  const [smartMode, setSmartMode] = useState<'all' | 'select' | 'split'>('all')
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [smartForm, setSmartForm] = useState({ routeId: '', departureTime: '', dates: [''], advanceRequired: false, tag: '' })
  // Split mode
  const [splitConfig, setSplitConfig] = useState<{ vehicleIds: string[]; routeId: string; departureTime: string }[]>([
    { vehicleIds: [], routeId: 'route-gangoh-delhi', departureTime: '' },
    { vehicleIds: [], routeId: 'route-delhi-gangoh', departureTime: '' },
  ])
  const [splitDates, setSplitDates] = useState([''])

  useEffect(() => {
    const t = localStorage.getItem('adminToken')
    if (!t) { router.push('/admin/login'); return }
    setToken(t)
  }, [router])

  const headers = useCallback(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token])

  useEffect(() => {
    if (!token) return
    setPageLoading(true)
    const load = async () => {
      if (activeTab === 'dashboard') await fetchDashboard()
      if (activeTab === 'drivers') await fetchDrivers()
      if (activeTab === 'vehicles') { await fetchVehicles(); await fetchDrivers() }
      if (activeTab === 'trips') { await fetchTrips(); await fetchVehicles(); await fetchDrivers() }
      if (activeTab === 'bookings') await fetchBookings()
      if (activeTab === 'bus') await fetchBusServices()
      setPageLoading(false)
    }
    load()
  }, [activeTab, token])

  const fetchDashboard = async () => { const r = await fetch('/api/admin/dashboard', { headers: headers() }); if (r.ok) setDashboard(await r.json()) }
  const fetchDrivers = async () => { const r = await fetch('/api/admin/drivers', { headers: headers() }); if (r.ok) { const d = await r.json(); setDrivers(d.drivers || []) } }
  const fetchVehicles = async () => { const r = await fetch('/api/admin/vehicles', { headers: headers() }); if (r.ok) { const d = await r.json(); setVehicles(d.vehicles || []) } }
  const fetchTrips = async () => { const r = await fetch('/api/admin/trips', { headers: headers() }); if (r.ok) { const d = await r.json(); setTrips(d.trips || []) } }
  const fetchBookings = async () => { const r = await fetch('/api/admin/bookings', { headers: headers() }); if (r.ok) { const d = await r.json(); setBookings(d.bookings || []) } }
  const fetchBusServices = async () => { const r = await fetch('/api/admin/bus-services', { headers: headers() }); if (r.ok) { const d = await r.json(); setBusServices(d.services || []) } }

  const saveBusService = async () => {
    if (!busForm.routeFrom || !busForm.routeTo || !busForm.departureTime) return
    if (editingBus) {
      await fetch('/api/admin/bus-services', { method: 'PUT', headers: headers(), body: JSON.stringify({ id: editingBus.id, ...busForm }) })
    } else {
      await fetch('/api/admin/bus-services', { method: 'POST', headers: headers(), body: JSON.stringify(busForm) })
    }
    setBusForm({ name: 'Travel Bus', routeFrom: '', routeTo: '', departureTime: '', contactNumber: '7830673603', fare: '', description: '' })
    setEditingBus(null)
    setShowBusForm(false)
    fetchBusServices()
  }
  const editBus = (bs: typeof busServices[0]) => {
    setEditingBus(bs)
    setBusForm({ name: bs.name, routeFrom: bs.routeFrom, routeTo: bs.routeTo, departureTime: bs.departureTime, contactNumber: bs.contactNumber, fare: bs.fare, description: bs.description })
    setShowBusForm(true)
  }
  const toggleBusService = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/bus-services', { method: 'PUT', headers: headers(), body: JSON.stringify({ id, isActive: !isActive }) })
    fetchBusServices()
  }
  const deleteBusService = async (id: string) => {
    if (!confirm('Delete this bus service?')) return
    await fetch(`/api/admin/bus-services?id=${id}`, { method: 'DELETE', headers: headers() })
    fetchBusServices()
  }

  // DRIVER
  const saveDriver = async () => {
    if (!driverForm.name || !driverForm.mobile) return
    if (editingDriver) {
      const body: Record<string, unknown> = { id: editingDriver.id, name: driverForm.name, mobile: driverForm.mobile }
      if (driverForm.password) body.password = driverForm.password
      await fetch('/api/admin/drivers', { method: 'PUT', headers: headers(), body: JSON.stringify(body) })
    } else {
      if (!driverForm.password) return
      await fetch('/api/admin/drivers', { method: 'POST', headers: headers(), body: JSON.stringify(driverForm) })
    }
    resetDriverForm(); fetchDrivers()
  }
  const editDriver = (d: Driver) => { setEditingDriver(d); setDriverForm({ name: d.name, mobile: d.mobile, password: '' }); setShowDriverForm(true) }
  const resetDriverForm = () => { setDriverForm({ name: '', mobile: '', password: '' }); setEditingDriver(null); setShowDriverForm(false) }
  const toggleDriver = async (id: string, isActive: boolean) => { await fetch('/api/admin/drivers', { method: 'PUT', headers: headers(), body: JSON.stringify({ id, isActive: !isActive }) }); fetchDrivers() }
  const deleteDriver = async (id: string) => { if (!confirm('Delete this driver?')) return; await fetch(`/api/admin/drivers?id=${id}`, { method: 'DELETE', headers: headers() }); fetchDrivers() }

  // VEHICLE
  const saveVehicle = async () => {
    if (!vehicleForm.vehicleNumber) return
    if (editingVehicle) {
      await fetch('/api/admin/vehicles', { method: 'PUT', headers: headers(), body: JSON.stringify({ id: editingVehicle.id, vehicleNumber: vehicleForm.vehicleNumber, driverId: vehicleForm.driverId || null }) })
    } else {
      await fetch('/api/admin/vehicles', { method: 'POST', headers: headers(), body: JSON.stringify(vehicleForm) })
    }
    resetVehicleForm(); fetchVehicles()
  }
  const editVehicle = (v: Vehicle) => { setEditingVehicle(v); setVehicleForm({ vehicleNumber: v.vehicleNumber, driverId: v.driverId || '' }); setShowVehicleForm(true) }
  const resetVehicleForm = () => { setVehicleForm({ vehicleNumber: '', driverId: '' }); setEditingVehicle(null); setShowVehicleForm(false) }
  const deleteVehicle = async (id: string) => { if (!confirm('Delete this vehicle?')) return; await fetch(`/api/admin/vehicles?id=${id}`, { method: 'DELETE', headers: headers() }); fetchVehicles() }

  // TRIP
  const saveTrip = async () => {
    if (!tripForm.vehicleId || !tripForm.driverId || !tripForm.routeId || !tripForm.departureTime || !tripForm.date) return
    if (editingTrip) {
      await fetch('/api/admin/trips', { method: 'PUT', headers: headers(), body: JSON.stringify({ id: editingTrip.id, ...tripForm }) })
    } else {
      await fetch('/api/admin/trips', { method: 'POST', headers: headers(), body: JSON.stringify(tripForm) })
    }
    resetTripForm(); fetchTrips()
  }
  const editTrip = (t: TripData) => {
    setEditingTrip(t)
    const v = vehicles.find(v => v.vehicleNumber === t.vehicle.vehicleNumber)
    const d = drivers.find(d => d.name === t.driver.name)
    setTripForm({
      vehicleId: v?.id || '', driverId: d?.id || '',
      routeId: t.route.origin === 'Gangoh' ? 'route-gangoh-delhi' : 'route-delhi-gangoh',
      departureTime: new Date(t.departureTime).toTimeString().slice(0, 5),
      date: new Date(t.date).toISOString().split('T')[0],
      advanceRequired: t.advanceRequired,
      tag: t.tag || '',
    })
    setShowTripForm(true); setShowSmartCreator(false)
  }
  const resetTripForm = () => { setTripForm({ vehicleId: '', driverId: '', routeId: '', departureTime: '', date: '', advanceRequired: false, tag: '' }); setEditingTrip(null); setShowTripForm(false) }
  const toggleAdvance = async (tripId: string, current: boolean) => { await fetch('/api/admin/trips', { method: 'PUT', headers: headers(), body: JSON.stringify({ id: tripId, advanceRequired: !current }) }); fetchTrips() }
  const deleteTrip = async (tripId: string) => { if (!confirm('Delete this trip?')) return; await fetch(`/api/admin/trips?id=${tripId}`, { method: 'DELETE', headers: headers() }); fetchTrips() }

  // SMART CREATOR
  const eligibleVehicles = vehicles.filter(v => v.driverId && v.isActive)

  const toggleVehicleSelection = (id: string) => {
    setSelectedVehicleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const selectAllVehicles = () => setSelectedVehicleIds(eligibleVehicles.map(v => v.id))
  const deselectAllVehicles = () => setSelectedVehicleIds([])

  const toggleSplitVehicle = (groupIndex: number, vehicleId: string) => {
    setSplitConfig(prev => {
      const updated = [...prev]
      const group = { ...updated[groupIndex] }
      group.vehicleIds = group.vehicleIds.includes(vehicleId)
        ? group.vehicleIds.filter(x => x !== vehicleId)
        : [...group.vehicleIds, vehicleId]
      updated[groupIndex] = group
      return updated
    })
  }

  const addDateField = () => {
    if (smartMode === 'split') setSplitDates(prev => [...prev, ''])
    else setSmartForm(prev => ({ ...prev, dates: [...prev.dates, ''] }))
  }
  const updateDate = (index: number, value: string) => {
    if (smartMode === 'split') {
      setSplitDates(prev => { const u = [...prev]; u[index] = value; return u })
    } else {
      setSmartForm(prev => { const u = [...prev.dates]; u[index] = value; return { ...prev, dates: u } })
    }
  }
  const removeDate = (index: number) => {
    if (smartMode === 'split') setSplitDates(prev => prev.filter((_, i) => i !== index))
    else setSmartForm(prev => ({ ...prev, dates: prev.dates.filter((_, i) => i !== index) }))
  }

  const createSmartTrips = async () => {
    let count = 0

    if (smartMode === 'all' || smartMode === 'select') {
      const targetVehicles = smartMode === 'all' ? eligibleVehicles : eligibleVehicles.filter(v => selectedVehicleIds.includes(v.id))
      if (targetVehicles.length === 0) { alert('No vehicles selected!'); return }
      if (!smartForm.routeId || !smartForm.departureTime || !smartForm.dates[0]) { alert('Fill all fields!'); return }

      const validDates = smartForm.dates.filter(d => d)
      for (const date of validDates) {
        for (const vehicle of targetVehicles) {
          await fetch('/api/admin/trips', {
            method: 'POST', headers: headers(),
            body: JSON.stringify({ vehicleId: vehicle.id, driverId: vehicle.driverId, routeId: smartForm.routeId, departureTime: smartForm.departureTime, date, advanceRequired: smartForm.advanceRequired, tag: smartForm.tag || null }),
          })
          count++
        }
      }
    } else if (smartMode === 'split') {
      const validDates = splitDates.filter(d => d)
      if (validDates.length === 0) { alert('Add at least one date!'); return }

      for (const group of splitConfig) {
        if (!group.vehicleIds.length || !group.routeId || !group.departureTime) continue
        const groupVehicles = eligibleVehicles.filter(v => group.vehicleIds.includes(v.id))
        for (const date of validDates) {
          for (const vehicle of groupVehicles) {
            await fetch('/api/admin/trips', {
              method: 'POST', headers: headers(),
              body: JSON.stringify({ vehicleId: vehicle.id, driverId: vehicle.driverId, routeId: group.routeId, departureTime: group.departureTime, date, advanceRequired: smartForm.advanceRequired, tag: smartForm.tag || null }),
            })
            count++
          }
        }
      }
    }

    setShowSmartCreator(false)
    fetchTrips()
    alert(`✅ ${count} trips created!`)
  }

  const [cancelWhatsAppLink, setCancelWhatsAppLink] = useState('')
  const updateBookingStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/bookings', { method: 'PUT', headers: headers(), body: JSON.stringify({ id, status }) })
    const data = await res.json()
    if (data.success && status === 'CANCELLED' && data.whatsappLink) {
      setCancelWhatsAppLink(data.whatsappLink)
    }
    fetchBookings()
  }

  // ADMIN BOOK SEAT
  const adminBookSeat = async () => {
    if (!bookingTripId || !adminBookForm.customerName || !adminBookForm.customerMobile) return
    const res = await fetch('/api/admin/book-seat', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ tripId: bookingTripId, ...adminBookForm }),
    })
    const data = await res.json()
    if (data.success) {
      setLastWhatsAppLink(data.whatsappLink)
      setAdminBookForm({ customerName: '', customerMobile: '', pickupPoint: '', dropPoint: '', seats: 1 })
      fetchDashboard()
    } else {
      alert(data.error || 'Failed to book')
    }
  }

  // SHIFT PASSENGER
  const shiftPassenger = async (newTripId: string) => {
    if (!shiftingBooking) return
    setShiftLoading(true)
    const res = await fetch('/api/admin/shift-passenger', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ bookingId: shiftingBooking.id, newTripId }),
    })
    const data = await res.json()
    setShiftLoading(false)
    if (data.success) {
      setShiftWhatsAppLink(data.whatsappLink)
      fetchDashboard()
    } else {
      alert(data.error || 'Failed to shift')
    }
  }

  // EXCHANGE PASSENGERS
  const exchangePassengers = async (bookingBId: string) => {
    if (!shiftingBooking) return
    setShiftLoading(true)
    const res = await fetch('/api/admin/exchange-passenger', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ bookingAId: shiftingBooking.id, bookingBId }),
    })
    const data = await res.json()
    setShiftLoading(false)
    if (data.success) {
      setExchangeResult(data)
      fetchDashboard()
    } else {
      alert(data.error || 'Failed to exchange')
    }
  }

  const logout = () => { localStorage.removeItem('adminToken'); router.push('/admin/login') }

  const tabs = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'drivers', icon: Users, label: 'Drivers' },
    { id: 'vehicles', icon: Car, label: 'Vehicles' },
    { id: 'trips', icon: Route, label: 'Trips' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'bus', icon: Bus, label: 'Bus Service' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-6 hidden lg:flex flex-col z-30">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xs">MS</span>
          </div>
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
        <nav className="space-y-1 flex-1">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </button>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500"><LogOut className="w-4 h-4" />Logout</button>
      </div>

      <div className="lg:ml-64 p-4 md:p-6">
        <div className="lg:hidden flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{tab.label}</button>
          ))}
          <button onClick={logout} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 whitespace-nowrap">Logout</button>
        </div>

        {/* Page Loader */}
        {pageLoading && <Loader text="Loading..." />}

        {/* DASHBOARD */}
        {!pageLoading && activeTab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Revenue', value: `₹${dashboard.totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'text-emerald-600 bg-emerald-100' },
                { label: 'Bookings', value: dashboard.totalBookings, icon: Calendar, color: 'text-indigo-600 bg-indigo-100' },
                { label: 'Today', value: dashboard.todayBookings, icon: Clock, color: 'text-amber-600 bg-amber-100' },
                { label: 'Occupancy', value: `${dashboard.seatOccupancy}%`, icon: Users, color: 'text-purple-600 bg-purple-100' },
              ].map((s) => (
                <Card key={s.label}><CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-5 h-5" /></div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p>
                </CardContent></Card>
              ))}
            </div>

            {/* Today's Trips Live View */}
            <h3 className="text-lg font-bold text-gray-900 mt-6">Today&apos;s Trips — Live Seat Status</h3>
            <div className="space-y-4">
              {(dashboard.todayTrips || []).map((trip) => (
                <Card key={trip.id} className="overflow-hidden">
                  <div className={`h-1 ${trip.availableSeats === 0 ? 'bg-red-500' : trip.availableSeats <= 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <Car className="w-4 h-4 text-indigo-600" />{trip.vehicleNumber}
                          <Badge variant={trip.availableSeats === 0 ? 'destructive' : 'secondary'}>{trip.availableSeats === 0 ? 'FULL' : `${trip.availableSeats} seats free`}</Badge>
                        </h4>
                        <p className="text-sm text-gray-500">{trip.route} • {trip.departureTime}</p>
                        <p className="text-sm text-gray-500">Driver: {trip.driverName} (<a href={`tel:${trip.driverMobile}`} className="text-indigo-600">{trip.driverMobile}</a>)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{trip.bookedSeats}<span className="text-sm text-gray-400">/{trip.totalSeats}</span></p>
                        <p className="text-xs text-gray-500">booked</p>
                        {trip.availableSeats > 0 && (
                          <Button size="sm" className="mt-2" onClick={() => { setBookingTripId(trip.id); setLastWhatsAppLink('') }}>
                            <Plus className="w-3 h-3 mr-1" />Book Seat
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Seat bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full mb-3">
                      <div className={`h-full rounded-full transition-all ${trip.availableSeats === 0 ? 'bg-red-500' : trip.availableSeats <= 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(trip.bookedSeats / trip.totalSeats) * 100}%` }} />
                    </div>

                    {/* Admin Book Form */}
                    {bookingTripId === trip.id && (
                      <div className="p-4 bg-indigo-50 rounded-xl space-y-3 mb-3">
                        {!lastWhatsAppLink ? (
                          <>
                            <h5 className="font-medium text-indigo-700 text-sm">Book Seat for Customer</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <Input placeholder="Customer Name *" value={adminBookForm.customerName} onChange={(e) => setAdminBookForm({ ...adminBookForm, customerName: e.target.value })} />
                              <Input placeholder="Mobile (10 digits) *" value={adminBookForm.customerMobile} onChange={(e) => setAdminBookForm({ ...adminBookForm, customerMobile: e.target.value })} />
                              <Select value={adminBookForm.pickupPoint} onChange={(e) => setAdminBookForm({ ...adminBookForm, pickupPoint: e.target.value })}>
                                <option value="">Select Pickup Point</option>
                                {(trip.route.startsWith('Gangoh') ? GANGOH_STOPS : DELHI_STOPS).map(s => <option key={s} value={s}>{s}</option>)}
                              </Select>
                              <Select value={adminBookForm.dropPoint} onChange={(e) => setAdminBookForm({ ...adminBookForm, dropPoint: e.target.value })}>
                                <option value="">Select Drop Point</option>
                                {(trip.route.startsWith('Gangoh') ? DELHI_STOPS : GANGOH_STOPS).map(s => <option key={s} value={s}>{s}</option>)}
                              </Select>
                              <Input type="number" min={1} max={trip.availableSeats} placeholder="Seats" value={adminBookForm.seats} onChange={(e) => setAdminBookForm({ ...adminBookForm, seats: parseInt(e.target.value) || 1 })} />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={adminBookSeat} variant="secondary" size="sm"><Check className="w-4 h-4 mr-1" />Confirm Booking</Button>
                              <Button onClick={() => { setBookingTripId(null); setLastWhatsAppLink('') }} variant="ghost" size="sm"><X className="w-4 h-4 mr-1" />Cancel</Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center space-y-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                              <Check className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="font-medium text-emerald-700">✅ Seat Booked Successfully!</p>
                            <p className="text-sm text-gray-600">Now send confirmation to customer via WhatsApp:</p>
                            <a
                              href={lastWhatsAppLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-green-500/30"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              Send WhatsApp Message
                            </a>
                            <Button onClick={() => { setBookingTripId(null); setLastWhatsAppLink('') }} variant="ghost" size="sm" className="mt-2">Done</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Passengers list */}
                    {trip.bookings.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">Passengers ({trip.bookings.length})</p>
                        {trip.bookings.map((b) => (
                          <div key={b.id} className="p-3 bg-white rounded-lg border border-gray-100 flex items-center justify-between">
                            <div className="text-xs">
                              <p className="font-medium text-gray-900 text-sm">{b.customerName}</p>
                              <p className="text-gray-500">{b.seats} seat • ₹{b.totalFare} • {b.pickupPoint} → {b.dropPoint}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={`tel:${b.customerMobile}`} className="px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs flex items-center gap-1">
                                <Phone className="w-3 h-3" />{b.customerMobile}
                              </a>
                              {trip.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => { setShiftingBooking({ id: b.id, customerName: b.customerName, seats: b.seats, currentTripId: trip.id }); setShiftWhatsAppLink('') }}
                                  className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-medium transition-colors"
                                >
                                  ↪ Shift
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(!dashboard.todayTrips || dashboard.todayTrips.length === 0) && (
                <p className="text-center text-gray-500 py-8">No trips scheduled for today</p>
              )}
            </div>

            {/* SHIFT PASSENGER MODAL */}
            {shiftingBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShiftingBooking(null); setShiftWhatsAppLink(''); setExchangeResult(null); setShiftMode('shift') }} />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
                  {!shiftWhatsAppLink && !exchangeResult ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Manage Passenger</h3>
                          <p className="text-sm text-gray-500"><span className="font-medium text-gray-900">{shiftingBooking.customerName}</span> • {shiftingBooking.seats} seat(s)</p>
                        </div>
                        <button onClick={() => { setShiftingBooking(null); setShiftMode('shift') }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
                      </div>

                      {/* Tab toggle */}
                      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setShiftMode('shift')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${shiftMode === 'shift' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>
                          ↪ Shift to Vehicle
                        </button>
                        <button onClick={() => setShiftMode('exchange')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${shiftMode === 'exchange' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>
                          🔄 Exchange with Passenger
                        </button>
                      </div>

                      {/* SHIFT MODE */}
                      {shiftMode === 'shift' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">Available Vehicles:</p>
                          {(dashboard?.todayTrips || [])
                            .filter(t => t.id !== shiftingBooking.currentTripId)
                            .map(t => {
                              const canFit = t.availableSeats >= shiftingBooking.seats
                              const isCompleted = t.status === 'COMPLETED'
                              const disabled = !canFit || isCompleted
                              return (
                                <div key={t.id} className={`p-4 rounded-xl border-2 ${disabled ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200 hover:border-indigo-300'}`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-bold text-gray-900 flex items-center gap-2">
                                        <Car className="w-4 h-4 text-indigo-600" /> {t.vehicleNumber}
                                        {isCompleted && <Badge variant="destructive" className="text-[10px]">🔒 Completed</Badge>}
                                      </p>
                                      <p className="text-xs text-gray-500">{t.route} • {t.departureTime} • {t.driverName}</p>
                                    </div>
                                    <p className="text-lg font-bold">{t.availableSeats}<span className="text-xs text-gray-400">/{t.totalSeats}</span></p>
                                  </div>
                                  {!disabled && (
                                    <button onClick={() => shiftPassenger(t.id)} disabled={shiftLoading}
                                      className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50">
                                      {shiftLoading ? 'Shifting...' : `Shift here`}
                                    </button>
                                  )}
                                  {isCompleted && <p className="text-xs text-red-500 mt-1">🔒 Trip completed</p>}
                                  {!isCompleted && !canFit && <p className="text-xs text-amber-600 mt-1">⚠ Need {shiftingBooking.seats} seats, only {t.availableSeats} free</p>}
                                </div>
                              )
                            })}
                        </div>
                      )}

                      {/* EXCHANGE MODE */}
                      {shiftMode === 'exchange' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">Select a passenger to swap with:</p>
                          {(dashboard?.todayTrips || [])
                            .filter(t => t.id !== shiftingBooking.currentTripId && t.status !== 'COMPLETED')
                            .map(t => (
                              <div key={t.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                  <p className="text-xs font-medium text-gray-700 flex items-center gap-2">
                                    <Car className="w-3 h-3 text-indigo-600" /> {t.vehicleNumber} • {t.route} • {t.departureTime}
                                  </p>
                                </div>
                                {t.bookings.length > 0 ? (
                                  <div className="divide-y divide-gray-50">
                                    {t.bookings.map(b => (
                                      <div key={b.id} className="px-4 py-3 flex items-center justify-between hover:bg-indigo-50 transition-colors">
                                        <div>
                                          <p className="font-medium text-gray-900 text-sm">{b.customerName}</p>
                                          <p className="text-xs text-gray-500">{b.seats} seat • {b.pickupPoint}→{b.dropPoint}</p>
                                        </div>
                                        <button onClick={() => exchangePassengers(b.id)} disabled={shiftLoading}
                                          className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-medium disabled:opacity-50">
                                          {shiftLoading ? '...' : '🔄 Swap'}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="px-4 py-3 text-xs text-gray-400">No passengers</p>
                                )}
                              </div>
                            ))}
                          {(dashboard?.todayTrips || []).filter(t => t.id !== shiftingBooking.currentTripId && t.status !== 'COMPLETED').length === 0 && (
                            <p className="text-center text-gray-500 py-6">No other active trips</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : shiftWhatsAppLink ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-600" /></div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Passenger Shifted!</h3>
                      <p className="text-sm text-gray-500 mb-4">{shiftingBooking.customerName} moved successfully.</p>
                      <a href={shiftWhatsAppLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl shadow-lg">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Notify on WhatsApp
                      </a>
                      <div className="mt-4"><button onClick={() => { setShiftingBooking(null); setShiftWhatsAppLink(''); setShiftMode('shift') }} className="text-sm text-gray-500">Done</button></div>
                    </div>
                  ) : exchangeResult ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🔄</span></div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Passengers Exchanged!</h3>
                      <p className="text-sm text-gray-500 mb-4"><span className="font-medium">{exchangeResult.passengerA}</span> ↔ <span className="font-medium">{exchangeResult.passengerB}</span></p>
                      <p className="text-sm text-gray-600 mb-4">Notify both passengers:</p>
                      <div className="flex flex-col gap-2 items-center">
                        <a href={exchangeResult.whatsappLinkA} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl text-sm">
                          📱 WhatsApp to {exchangeResult.passengerA}
                        </a>
                        <a href={exchangeResult.whatsappLinkB} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl text-sm">
                          📱 WhatsApp to {exchangeResult.passengerB}
                        </a>
                      </div>
                      <div className="mt-4"><button onClick={() => { setShiftingBooking(null); setExchangeResult(null); setShiftMode('shift') }} className="text-sm text-gray-500">Done</button></div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DRIVERS */}
        {!pageLoading && activeTab === 'drivers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Drivers ({drivers.length})</h2>
              <Button onClick={() => { resetDriverForm(); setShowDriverForm(!showDriverForm) }}>
                {showDriverForm ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><UserPlus className="w-4 h-4 mr-2" />Add</>}
              </Button>
            </div>
            {showDriverForm && (
              <Card><CardContent className="p-5 space-y-3">
                <h3 className="font-medium">{editingDriver ? 'Edit Driver' : 'New Driver'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input placeholder="Name" value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} />
                  <Input placeholder="Mobile" value={driverForm.mobile} onChange={(e) => setDriverForm({ ...driverForm, mobile: e.target.value })} />
                  <Input placeholder={editingDriver ? "Password (optional)" : "Password"} type="password" value={driverForm.password} onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })} />
                </div>
                <Button onClick={saveDriver} variant="secondary"><Check className="w-4 h-4 mr-2" />{editingDriver ? 'Update' : 'Save'}</Button>
              </CardContent></Card>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {drivers.map((d) => (
                <Card key={d.id}><CardContent className="p-5 flex items-center justify-between">
                  <div><h3 className="font-bold text-gray-900">{d.name}</h3><p className="text-sm text-gray-500"><Phone className="w-3 h-3 inline" /> {d.mobile}</p>
                    <Badge variant={d.isActive ? 'secondary' : 'destructive'} className="mt-1">{d.isActive ? 'Active' : 'Inactive'}</Badge></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => editDriver(d)} className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => toggleDriver(d.id, d.isActive)}>{d.isActive ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}</button>
                    <button onClick={() => deleteDriver(d.id)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </div>
        )}

        {/* VEHICLES */}
        {!pageLoading && activeTab === 'vehicles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Vehicles ({vehicles.length})</h2>
              <Button onClick={() => { resetVehicleForm(); setShowVehicleForm(!showVehicleForm) }}>
                {showVehicleForm ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><Plus className="w-4 h-4 mr-2" />Add</>}
              </Button>
            </div>
            {showVehicleForm && (
              <Card><CardContent className="p-5 space-y-3">
                <h3 className="font-medium">{editingVehicle ? 'Edit Vehicle' : 'New Vehicle'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Vehicle Number" value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })} />
                  <Select value={vehicleForm.driverId} onChange={(e) => setVehicleForm({ ...vehicleForm, driverId: e.target.value })}>
                    <option value="">Driver (optional)</option>
                    {drivers.filter(d => d.isActive).map(d => <option key={d.id} value={d.id}>{d.name} - {d.mobile}</option>)}
                  </Select>
                </div>
                <Button onClick={saveVehicle} variant="secondary"><Check className="w-4 h-4 mr-2" />{editingVehicle ? 'Update' : 'Save'}</Button>
              </CardContent></Card>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {vehicles.map((v) => (
                <Card key={v.id}><CardContent className="p-5 flex items-center justify-between">
                  <div><h3 className="font-bold text-gray-900">{v.vehicleNumber}</h3><p className="text-sm text-gray-500">Ertiga • 7 Seats</p>
                    {v.driver ? <p className="text-xs text-emerald-600 mt-1">✓ {v.driver.name} ({v.driver.mobile})</p> : <p className="text-xs text-amber-600 mt-1">⚠ No driver</p>}</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => editVehicle(v)} className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteVehicle(v.id)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </div>
        )}

        {/* TRIPS */}
        {!pageLoading && activeTab === 'trips' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Trips ({trips.length})</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setShowSmartCreator(!showSmartCreator); setShowTripForm(false) }}>
                  <Zap className="w-4 h-4 mr-2" />{showSmartCreator ? 'Close' : 'Smart Create'}
                </Button>
                <Button onClick={() => { resetTripForm(); setShowTripForm(!showTripForm); setShowSmartCreator(false) }}>
                  {showTripForm ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><Plus className="w-4 h-4 mr-2" />Single</>}
                </Button>
              </div>
            </div>

            {/* SMART TRIP CREATOR */}
            {showSmartCreator && (
              <Card className="border-2 border-emerald-200"><CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-emerald-700 flex items-center gap-2"><Zap className="w-5 h-5" />Smart Trip Creator</h3>

                {/* Mode Selector */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'all', label: '🚗 All Vehicles → One Route', desc: 'Sab gadiyan ek jagah' },
                    { id: 'select', label: '☑️ Select Vehicles → One Route', desc: 'Kuch gadiyan choose karo' },
                    { id: 'split', label: '↔️ Split Routes', desc: 'Kuch Gangoh→Delhi, kuch Delhi→Gangoh' },
                  ].map(m => (
                    <button key={m.id} onClick={() => setSmartMode(m.id as typeof smartMode)}
                      className={`flex-1 min-w-[200px] p-3 rounded-xl text-left border-2 transition-all ${smartMode === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </button>
                  ))}
                </div>

                {/* ALL / SELECT mode */}
                {(smartMode === 'all' || smartMode === 'select') && (
                  <div className="space-y-4">
                    {smartMode === 'select' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700">Select Vehicles ({selectedVehicleIds.length}/{eligibleVehicles.length})</p>
                          <div className="flex gap-2">
                            <button onClick={selectAllVehicles} className="text-xs text-indigo-600 hover:underline">Select All</button>
                            <button onClick={deselectAllVehicles} className="text-xs text-gray-500 hover:underline">Clear</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {eligibleVehicles.map(v => (
                            <button key={v.id} onClick={() => toggleVehicleSelection(v.id)}
                              className={`p-2 rounded-lg border text-left text-xs transition-all ${selectedVehicleIds.includes(v.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <div className="flex items-center gap-2">
                                {selectedVehicleIds.includes(v.id) ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                                <span className="font-medium">{v.vehicleNumber}</span>
                              </div>
                              <p className="text-gray-500 ml-6">{v.driver?.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Select value={smartForm.routeId} onChange={(e) => setSmartForm({ ...smartForm, routeId: e.target.value })}>
                        <option value="">Route</option>
                        <option value="route-gangoh-delhi">Gangoh → Delhi</option>
                        <option value="route-delhi-gangoh">Delhi → Gangoh</option>
                      </Select>
                      <Input type="time" placeholder="Time" value={smartForm.departureTime} onChange={(e) => setSmartForm({ ...smartForm, departureTime: e.target.value })} />
                      <label className="flex items-center gap-3 cursor-pointer px-4 py-2 bg-gray-50 rounded-xl">
                        <input type="checkbox" checked={smartForm.advanceRequired} onChange={(e) => setSmartForm({ ...smartForm, advanceRequired: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                        <span className="text-sm">Advance ON</span>
                      </label>
                    </div>

                    <Input placeholder="Tag (e.g. Super Fast, Premium, AC) — optional" value={smartForm.tag} onChange={(e) => setSmartForm({ ...smartForm, tag: e.target.value })} className="max-w-xs" />

                    {/* Multi-date */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Dates</p>
                        <button onClick={addDateField} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add Date</button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {smartForm.dates.map((d, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Input type="date" className="w-40" value={d} onChange={(e) => updateDate(i, e.target.value)} />
                            {smartForm.dates.length > 1 && <button onClick={() => removeDate(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SPLIT mode */}
                {smartMode === 'split' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">Assign vehicles to different routes — each group goes a different direction</p>

                    {splitConfig.map((group, gi) => (
                      <div key={gi} className="p-4 border border-gray-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <Select value={group.routeId} onChange={(e) => { const u = [...splitConfig]; u[gi] = { ...u[gi], routeId: e.target.value }; setSplitConfig(u) }} className="w-48">
                            <option value="route-gangoh-delhi">Gangoh → Delhi</option>
                            <option value="route-delhi-gangoh">Delhi → Gangoh</option>
                          </Select>
                          <Input type="time" className="w-32" value={group.departureTime} onChange={(e) => { const u = [...splitConfig]; u[gi] = { ...u[gi], departureTime: e.target.value }; setSplitConfig(u) }} />
                          <Badge variant={gi === 0 ? 'default' : 'secondary'}>{group.vehicleIds.length} vehicles</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {eligibleVehicles.map(v => (
                            <button key={v.id} onClick={() => toggleSplitVehicle(gi, v.id)}
                              className={`p-2 rounded-lg border text-xs text-left transition-all ${group.vehicleIds.includes(v.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <div className="flex items-center gap-1">
                                {group.vehicleIds.includes(v.id) ? <CheckSquare className="w-3 h-3 text-indigo-600" /> : <Square className="w-3 h-3 text-gray-400" />}
                                <span>{v.vehicleNumber}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Dates for split */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Dates</p>
                        <button onClick={addDateField} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {splitDates.map((d, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Input type="date" className="w-40" value={d} onChange={(e) => updateDate(i, e.target.value)} />
                            {splitDates.length > 1 && <button onClick={() => removeDate(i)} className="text-red-400"><X className="w-4 h-4" /></button>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={smartForm.advanceRequired} onChange={(e) => setSmartForm({ ...smartForm, advanceRequired: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                      <span className="text-sm">Advance Required</span>
                    </label>
                  </div>
                )}

                <Button onClick={createSmartTrips} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Zap className="w-4 h-4 mr-2" />Create Trips
                </Button>
              </CardContent></Card>
            )}

            {/* Single Trip Form */}
            {showTripForm && (
              <Card><CardContent className="p-5 space-y-3">
                <h3 className="font-medium">{editingTrip ? 'Edit Trip' : 'Single Trip'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select value={tripForm.vehicleId} onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}><option value="">Vehicle</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}</Select>
                  <Select value={tripForm.driverId} onChange={(e) => setTripForm({ ...tripForm, driverId: e.target.value })}><option value="">Driver</option>{drivers.filter(d => d.isActive).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
                  <Select value={tripForm.routeId} onChange={(e) => setTripForm({ ...tripForm, routeId: e.target.value })}><option value="">Route</option><option value="route-gangoh-delhi">Gangoh → Delhi</option><option value="route-delhi-gangoh">Delhi → Gangoh</option></Select>
                  <Input type="date" value={tripForm.date} onChange={(e) => setTripForm({ ...tripForm, date: e.target.value })} />
                  <Input type="time" value={tripForm.departureTime} onChange={(e) => setTripForm({ ...tripForm, departureTime: e.target.value })} />
                  <Input placeholder="Tag (e.g. Super Fast, Premium)" value={tripForm.tag} onChange={(e) => setTripForm({ ...tripForm, tag: e.target.value })} />
                  <label className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl"><input type="checkbox" checked={tripForm.advanceRequired} onChange={(e) => setTripForm({ ...tripForm, advanceRequired: e.target.checked })} className="w-4 h-4 accent-indigo-600" /><span className="text-sm">Advance</span></label>
                </div>
                <Button onClick={saveTrip} variant="secondary"><Check className="w-4 h-4 mr-2" />{editingTrip ? 'Update' : 'Create'}</Button>
              </CardContent></Card>
            )}

            {/* Trip List */}
            <div className="space-y-3">
              {trips.map((t) => (
                <Card key={t.id}><CardContent className="p-4 flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1"><Car className="w-4 h-4 text-indigo-600" />{t.vehicle.vehicleNumber}</h3>
                    <p className="text-xs text-gray-500">{t.route.origin}→{t.route.destination} • {new Date(t.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} • {new Date(t.date).toLocaleDateString('en-IN')}</p>
                    <p className="text-xs text-gray-500">Driver: {t.driver.name} • {t.bookedSeats}/{t.totalSeats} seats • ₹{t.route.fare}{t.tag ? ` • 🏷️ ${t.tag}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={t.status === 'SCHEDULED' ? 'warning' : t.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px]">{t.status}</Badge>
                    <button onClick={() => toggleAdvance(t.id, t.advanceRequired)} className="px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 text-[10px] flex items-center gap-1">
                      {t.advanceRequired ? <ToggleRight className="w-3 h-3 text-indigo-600" /> : <ToggleLeft className="w-3 h-3 text-gray-400" />}{t.advanceRequired ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => editTrip(t)} className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><Edit className="w-3 h-3" /></button>
                    <button onClick={() => deleteTrip(t.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </div>
        )}

        {/* BOOKINGS */}
        {!pageLoading && activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Bookings ({bookings.length})</h2>
            <div className="space-y-3">
              {bookings.map((b) => (
                <Card key={b.id}><CardContent className="p-4 flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{b.customerName}</h3>
                    <p className="text-xs text-gray-500"><Phone className="w-3 h-3 inline" /> {b.customerMobile} • <MapPin className="w-3 h-3 inline" /> {b.pickupPoint}→{b.dropPoint}</p>
                    <p className="text-xs text-gray-500">{b.seats} seat • ₹{b.totalFare} (Adv: ₹{b.advancePaid}, Due: ₹{b.remainingFare})</p>
                    <p className="text-[10px] text-gray-400">{b.bookingCode} • {new Date(b.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={b.status === 'CONFIRMED' ? 'secondary' : b.status === 'CANCELLED' ? 'destructive' : b.status === 'COMPLETED' ? 'default' : 'warning'}>{b.status}</Badge>
                    {b.status === 'PENDING' && <><Button size="sm" variant="secondary" onClick={() => updateBookingStatus(b.id, 'CONFIRMED')}>✓</Button><Button size="sm" variant="destructive" onClick={() => updateBookingStatus(b.id, 'CANCELLED')}>✗</Button></>}
                    {b.status === 'CONFIRMED' && <Button size="sm" variant="destructive" onClick={() => updateBookingStatus(b.id, 'CANCELLED')}>Cancel</Button>}
                  </div>
                </CardContent></Card>
              ))}
              {bookings.length === 0 && <p className="text-center text-gray-500 py-8">No bookings</p>}
            </div>

            {/* Cancel WhatsApp Modal */}
            {cancelWhatsAppLink && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCancelWhatsAppLink('')} />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Cancelled</h3>
                  <p className="text-sm text-gray-500 mb-4">Notify the customer about cancellation:</p>
                  <a href={cancelWhatsAppLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl shadow-lg">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Send Cancellation on WhatsApp
                  </a>
                  <div className="mt-4"><button onClick={() => setCancelWhatsAppLink('')} className="text-sm text-gray-500 hover:text-gray-700">Close</button></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BUS SERVICE */}
        {!pageLoading && activeTab === 'bus' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">🚌 Bus Services</h2>
              <Button onClick={() => setShowBusForm(!showBusForm)}>
                {showBusForm ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><Plus className="w-4 h-4 mr-2" />Add Bus</>}
              </Button>
            </div>

            {showBusForm && (
              <Card><CardContent className="p-5 space-y-3">
                <h3 className="font-medium">{editingBus ? 'Edit Bus Service' : 'New Bus Service'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Service Name" value={busForm.name} onChange={(e) => setBusForm({ ...busForm, name: e.target.value })} />
                  <Input placeholder="Route From (e.g. Gangoh)" value={busForm.routeFrom} onChange={(e) => setBusForm({ ...busForm, routeFrom: e.target.value })} />
                  <Input placeholder="Route To (e.g. Delhi)" value={busForm.routeTo} onChange={(e) => setBusForm({ ...busForm, routeTo: e.target.value })} />
                  <Input placeholder="Departure Time (e.g. 6:00 AM)" value={busForm.departureTime} onChange={(e) => setBusForm({ ...busForm, departureTime: e.target.value })} />
                  <Input placeholder="Contact Number" value={busForm.contactNumber} onChange={(e) => setBusForm({ ...busForm, contactNumber: e.target.value })} />
                  <Input placeholder="Fare (e.g. ₹200 or Contact for fare)" value={busForm.fare} onChange={(e) => setBusForm({ ...busForm, fare: e.target.value })} />
                </div>
                <Input placeholder="Description (optional)" value={busForm.description} onChange={(e) => setBusForm({ ...busForm, description: e.target.value })} />
                <Button onClick={saveBusService} variant="secondary"><Check className="w-4 h-4 mr-2" />{editingBus ? 'Update' : 'Save'}</Button>
              </CardContent></Card>
            )}

            <div className="space-y-4">
              {busServices.map(bs => (
                <Card key={bs.id}><CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><Bus className="w-4 h-4 text-orange-600" />{bs.name}</h3>
                    <p className="text-sm text-gray-500">{bs.routeFrom} → {bs.routeTo} • {bs.departureTime}</p>
                    <p className="text-xs text-gray-400">Contact: {bs.contactNumber} • Fare: {bs.fare || 'N/A'}</p>
                    {bs.description && <p className="text-xs text-gray-400 mt-1">{bs.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => editBus(bs)} className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => toggleBusService(bs.id, bs.isActive)}>
                      {bs.isActive ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                    </button>
                    <button onClick={() => deleteBusService(bs.id)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </CardContent></Card>
              ))}
              {busServices.length === 0 && (
                <p className="text-center text-gray-500 py-8">No bus services added yet. Add one to show on homepage.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
