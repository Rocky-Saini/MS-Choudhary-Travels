'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Phone, MapPin, Users, CreditCard, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

// Stops for each city
const GANGOH_STOPS = ['Gangoh', 'Chandpura', 'Fatehpur', 'Titron', 'Jalalabad', 'Baghpat']
const DELHI_STOPS = ['Loni', 'Kashmere Gate Metro Station Gate 4', 'Kashmere Gate Metro Station Gate 3', 'Kashmere Gate Metro Station Gate 1']

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  trip: {
    id: string
    vehicleNumber: string
    driverName: string
    route: string
    fare: number
    availableSeats: number
    departureTime: string
    advanceRequired: boolean
  } | null
}

export function BookingModal({ isOpen, onClose, trip }: BookingModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerMobile: '',
    pickupPoint: '',
    dropPoint: '',
    seats: 1,
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [bookingCode, setBookingCode] = useState('')
  const [whatsappLink, setWhatsappLink] = useState('')

  if (!trip) return null

  const totalFare = formData.seats * trip.fare

  // Determine pickup/drop options based on route direction
  const isGangohToDelhi = trip.route.startsWith('Gangoh')
  const pickupOptions = isGangohToDelhi ? GANGOH_STOPS : DELHI_STOPS
  const dropOptions = isGangohToDelhi ? DELHI_STOPS : GANGOH_STOPS


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.customerMobile.length !== 10) {
      alert('Please enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          ...formData,
        }),
      })

      const data = await res.json()

      if (data.success) {
        if (!data.requiresPayment) {
          // Direct booking — no payment needed
          setBookingCode(data.booking.bookingCode)
          setWhatsappLink(data.whatsappLink || '')
          setStep('success')
        } else {
          // Razorpay payment flow
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: data.order.amount,
            currency: 'INR',
            name: 'MS Choudhary Travels',
            description: `Advance: ${formData.seats} seat(s) - ${trip.route}`,
            order_id: data.order.id,
            handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
              await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId: data.booking.id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })
              setBookingCode(data.booking.bookingCode)
              setStep('success')
            },
            prefill: {
              name: formData.customerName,
              contact: formData.customerMobile,
            },
            theme: { color: '#4f46e5' },
          }

          const razorpay = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay(options)
          razorpay.open()
        }
      }
    } catch (error) {
      console.error('Booking error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('form')
    setFormData({ customerName: '', customerMobile: '', pickupPoint: '', dropPoint: '', seats: 1 })
    setBookingCode('')
    setWhatsappLink('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Book Your Seat</h2>
                  <p className="text-sm text-gray-500">{trip.route}</p>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {step === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input required placeholder="Enter your name" className="pl-10" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile Number</label>
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
                        <option value="">Select pickup point</option>
                        {pickupOptions.map((stop) => (
                          <option key={stop} value={stop}>{stop}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Drop Point</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 z-10" />
                      <Select required className="pl-10" value={formData.dropPoint} onChange={(e) => setFormData({ ...formData, dropPoint: e.target.value })}>
                        <option value="">Select drop point</option>
                        {dropOptions.map((stop) => (
                          <option key={stop} value={stop}>{stop}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Number of Seats</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input required type="number" min={1} max={trip.availableSeats} className="pl-10" value={formData.seats} onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{trip.availableSeats} seats available</p>
                  </div>

                  {/* Fare Info */}
                  <div className="bg-indigo-50/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Fare ({formData.seats} × ₹{trip.fare})</span>
                      <span className="font-medium">₹{totalFare}</span>
                    </div>
                    {trip.advanceRequired ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Advance Payment</span>
                          <span className="font-medium text-indigo-600">₹{formData.seats * 100}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-indigo-100 pt-2">
                          <span className="text-gray-600">Remaining (pay to driver)</span>
                          <span className="font-medium">₹{totalFare - formData.seats * 100}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-sm border-t border-indigo-100 pt-2">
                        <span className="text-gray-600">Payment</span>
                        <span className="font-medium text-emerald-600">Pay after journey ✓</span>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {trip.advanceRequired ? (
                      <><CreditCard className="w-4 h-4 mr-2" />{loading ? 'Processing...' : `Pay ₹${formData.seats * 100} Advance`}</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 mr-2" />{loading ? 'Booking...' : 'Confirm Booking'}</>
                    )}
                  </Button>
                </form>
              )}

              {step === 'success' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-2">Your seat has been booked successfully.</p>
                  {bookingCode && (
                    <p className="text-sm text-indigo-600 font-mono bg-indigo-50 px-3 py-1 rounded-lg inline-block mb-4">
                      Code: {bookingCode}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-4">
                    {trip.advanceRequired ? 'Pay remaining to driver.' : 'Pay fare to driver after journey.'}
                  </p>

                  {/* WhatsApp confirmation */}
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-green-500/25 mb-4"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Get Booking Details on WhatsApp
                    </a>
                  )}

                  <div><Button onClick={handleClose} variant="outline">Close</Button></div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
