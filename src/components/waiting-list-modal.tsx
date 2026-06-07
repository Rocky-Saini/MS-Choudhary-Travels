'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Phone, MapPin, Users, Clock, CheckCircle, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

const GANGOH_STOPS = ['Gangoh', 'Chandpura', 'Fatehpur', 'Titron', 'Jalalabad', 'Baghpat']
const DELHI_STOPS = ['Loni', 'Kashmere Gate Metro Station Gate 4', 'Kashmere Gate Metro Station Gate 3', 'Kashmere Gate Metro Station Gate 1']

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

interface WaitingListModalProps {
  isOpen: boolean
  onClose: () => void
  route: 'gangoh-delhi' | 'delhi-gangoh'
  date: string
  reason?: 'full' | 'no-trips'
}

export function WaitingListModal({ isOpen, onClose, route, date: initialDate, reason = 'full' }: WaitingListModalProps) {
  const [formData, setFormData] = useState({ customerName: '', customerMobile: '', pickupPoint: '', dropPoint: '', seats: 1, date: initialDate, preferredTime: route === 'gangoh-delhi' ? '5:00 AM' : '4:00 PM' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const dates = getNext7Days()

  const isGangohToDelhi = route === 'gangoh-delhi'
  const pickupOptions = isGangohToDelhi ? GANGOH_STOPS : DELHI_STOPS
  const dropOptions = isGangohToDelhi ? DELHI_STOPS : GANGOH_STOPS
  const routeId = isGangohToDelhi ? 'route-gangoh-delhi' : 'route-delhi-gangoh'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.customerMobile.length !== 10) {
      alert('Please enter a valid 10-digit mobile number')
      return
    }
    if (!formData.date) {
      alert('Please select a travel date')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, routeId }),
      })
      const data = await res.json()
      if (data.success) setDone(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setDone(false)
    setFormData({ customerName: '', customerMobile: '', pickupPoint: '', dropPoint: '', seats: 1, date: initialDate, preferredTime: 'Morning (5-8 AM)' })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" />Join Waiting List</h2>
                  <p className="text-sm text-gray-500">{isGangohToDelhi ? 'Gangoh → Delhi' : 'Delhi → Gangoh'}</p>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
              </div>

              {!done ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
                    {reason === 'no-trips'
                      ? 'No trips scheduled yet for this date. Join the waiting list — once trips are added, your seat will be confirmed automatically.'
                      : 'All seats are full. Join the waiting list — we\'ll contact you if a seat opens up.'}
                  </div>

                  {/* Travel Date */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1"><CalendarDays className="w-4 h-4 text-indigo-600" />Travel Date *</label>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {dates.map((d) => (
                        <button key={d.date} type="button" onClick={() => setFormData({ ...formData, date: d.date })}
                          className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[65px] transition-all ${
                            formData.date === d.date ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}>
                          <span className={`text-[9px] uppercase font-medium ${formData.date === d.date ? 'text-indigo-200' : 'text-gray-400'}`}>{d.day}</span>
                          <span className="text-xs font-bold">{d.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Time — route based */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Preferred Time *</label>
                    <Select value={formData.preferredTime} onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}>
                      {isGangohToDelhi ? (
                        <>
                          <option value="4:50 AM">4:50 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                        </>
                      ) : (
                        <>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="4:30 PM">4:30 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                        </>
                      )}
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input required placeholder="Your name" className="pl-10" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input required type="tel" inputMode="numeric" placeholder="10-digit mobile" className="pl-10" value={formData.customerMobile} onChange={(e) => setFormData({ ...formData, customerMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </div>
                    {formData.customerMobile.length > 0 && formData.customerMobile.length < 10 && (
                      <p className="text-xs text-red-500 mt-1">Mobile must be 10 digits</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Pickup Point</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 z-10" />
                      <Select required className="pl-10" value={formData.pickupPoint} onChange={(e) => setFormData({ ...formData, pickupPoint: e.target.value })}>
                        <option value="">Select pickup</option>
                        {pickupOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Drop Point</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 z-10" />
                      <Select required className="pl-10" value={formData.dropPoint} onChange={(e) => setFormData({ ...formData, dropPoint: e.target.value })}>
                        <option value="">Select drop</option>
                        {dropOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Seats Needed</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Select required className="pl-10" value={formData.seats} onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}>
                        {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Seat' : 'Seats'}</option>)}
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    <Clock className="w-4 h-4 mr-2" />{loading ? 'Adding...' : 'Join Waiting List'}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Added to Waiting List!</h3>
                  <p className="text-gray-600 mb-2">We&apos;ll contact you if a seat opens up for your date.</p>
                  <p className="text-sm text-gray-500">For urgent booking, call: +91 7830673603</p>
                  <Button onClick={handleClose} className="mt-6" variant="outline">Close</Button>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
