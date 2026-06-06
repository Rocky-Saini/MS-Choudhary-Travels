'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Car, User, Phone, MapPin, CalendarDays, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

function getNext7Days() {
  const days = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i)
    days.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${d.getDate()} ${monthNames[d.getMonth()]}`,
      day: dayNames[d.getDay()],
    })
  }
  return days
}

export function FullCarSection() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customerName: '', customerMobile: '', pickupPoint: '', dropPoint: '', date: '', preferredTime: 'Morning (5-8 AM)' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const dates = getNext7Days()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.customerMobile.length !== 10) { alert('Enter valid 10-digit mobile'); return }
    if (!form.date || form.date === 'custom') { alert('Select a travel date'); return }
    setLoading(true)
    const res = await fetch('/api/full-car-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) setDone(true)
  }

  const reset = () => { setForm({ customerName: '', customerMobile: '', pickupPoint: '', dropPoint: '', date: '', preferredTime: 'Morning (5-8 AM)' }); setDone(false); setShowForm(false) }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500" />
          <CardContent className="p-6 md:p-8">
            {!showForm && !done && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <Car className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Book Full Car</h3>
                    <p className="text-sm text-gray-600">Need the entire vehicle? Book a dedicated car with your own pickup & drop point.</p>
                  </div>
                </div>
                <Button onClick={() => setShowForm(true)} size="lg" className="whitespace-nowrap">
                  <Car className="w-4 h-4 mr-2" />Request Full Car
                </Button>
              </div>
            )}

            {showForm && !done && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Car className="w-5 h-5 text-indigo-600" />Book Full Car</h3>
                  <button type="button" onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl">⏳ Full car requests need admin approval. You&apos;ll be notified once approved with vehicle & driver details.</p>

                {/* Date */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1"><CalendarDays className="w-4 h-4 text-indigo-600" />Travel Date *</label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {dates.map(d => (
                      <button key={d.date} type="button" onClick={() => setForm({ ...form, date: d.date })}
                        className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[65px] transition-all ${form.date === d.date ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        <span className={`text-[9px] uppercase font-medium ${form.date === d.date ? 'text-indigo-200' : 'text-gray-400'}`}>{d.day}</span>
                        <span className="text-xs font-bold">{d.label}</span>
                      </button>
                    ))}
                    {/* Custom date option */}
                    <button type="button" onClick={() => setForm({ ...form, date: 'custom' })}
                      className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[75px] transition-all ${form.date === 'custom' || (form.date && !dates.find(d => d.date === form.date)) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      <span className={`text-[9px] uppercase font-medium ${form.date === 'custom' || (form.date && !dates.find(d => d.date === form.date)) ? 'text-indigo-200' : 'text-gray-400'}`}>📅</span>
                      <span className="text-xs font-bold">Other</span>
                    </button>
                  </div>
                  {(form.date === 'custom' || (form.date && !dates.find(d => d.date === form.date) && form.date !== '')) && (
                    <div className="flex gap-2 mt-2">
                      <Input type="date" className="w-48" value={form.date === 'custom' ? '' : form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]} />
                      <Input type="time" className="w-36" value={form.preferredTime.startsWith('Custom:') ? form.preferredTime.replace('Custom: ', '') : ''} onChange={(e) => setForm({ ...form, preferredTime: `Custom: ${e.target.value}` })} />
                    </div>
                  )}
                </div>

                {/* Preferred Time — only show for 7-day dates, not custom */}
                {form.date && dates.find(d => d.date === form.date) && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Preferred Time</label>
                    <Select value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}>
                      <option value="Morning (5-8 AM)">🌅 Morning (5-8 AM)</option>
                      <option value="Late Morning (8-11 AM)">☀️ Late Morning (8-11 AM)</option>
                      <option value="Afternoon (12-3 PM)">🌤️ Afternoon (12-3 PM)</option>
                      <option value="Evening (3-6 PM)">🌇 Evening (3-6 PM)</option>
                      <option value="Night (6-9 PM)">🌙 Night (6-9 PM)</option>
                      <option value="Any Time">⏰ Any Time</option>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input required placeholder="Your name" className="pl-10" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile *</label>
                    <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input required type="tel" inputMode="numeric" placeholder="10-digit mobile" className="pl-10" value={form.customerMobile} onChange={(e) => setForm({ ...form, customerMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Pickup Point *</label>
                    <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      <Input required placeholder="e.g. Gangoh Market" className="pl-10" value={form.pickupPoint} onChange={(e) => setForm({ ...form, pickupPoint: e.target.value })} /></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Drop Point *</label>
                    <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                      <Input required placeholder="e.g. Delhi Airport" className="pl-10" value={form.dropPoint} onChange={(e) => setForm({ ...form, dropPoint: e.target.value })} /></div>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Submitting...</> : 'Submit Request'}
                </Button>
              </form>
            )}

            {done && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
                <p className="text-gray-600 mb-2">Your full car request is <span className="font-bold text-amber-600">Pending Admin Approval</span></p>
                <p className="text-sm text-gray-500">We&apos;ll notify you on WhatsApp once a vehicle is assigned.</p>
                <p className="text-sm text-gray-500 mt-1">For urgent requests, call: +91 7830673603</p>
                <Button onClick={reset} className="mt-6" variant="outline">Done</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </section>
  )
}
