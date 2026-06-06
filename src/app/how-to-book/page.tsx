'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { MapPin, Phone, Users, CreditCard, CheckCircle, Clock, Car, Search, MessageCircle } from 'lucide-react'

const steps = [
  {
    num: 1,
    title: 'Choose Your Route',
    desc: 'Select Gangoh → Delhi or Delhi → Gangoh from the route toggle buttons on homepage.',
    icon: MapPin,
    color: 'from-indigo-500 to-blue-500',
    visual: (
      <div className="flex gap-2 mt-3">
        <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">Gangoh → Delhi</div>
        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Delhi → Gangoh</div>
      </div>
    ),
  },
  {
    num: 2,
    title: 'Select Travel Date',
    desc: 'Pick any date from Today to 7 days ahead. Trips are shown for the selected date.',
    icon: Clock,
    color: 'from-purple-500 to-pink-500',
    visual: (
      <div className="flex gap-2 mt-3 overflow-x-auto max-w-full pb-1">
        {['Today', 'Tmrw', '8 Jun', '9 Jun'].map((d, i) => (
          <div key={d} className={`px-3 py-2 rounded-xl text-xs font-bold min-w-[55px] text-center shrink-0 ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{d}</div>
        ))}
      </div>
    ),
  },
  {
    num: 3,
    title: 'Choose a Vehicle',
    desc: 'Each vehicle card shows driver name, departure time, available seats, fare ₹350/seat, and tags.',
    icon: Car,
    color: 'from-emerald-500 to-teal-500',
    visual: (
      <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-sm">UP14 AB 1001</p>
            <p className="text-xs text-gray-500">Driver: Rajesh • 05:00 AM</p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">5 seats left</span>
        </div>
        <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full w-[30%] bg-emerald-500 rounded-full" /></div>
      </div>
    ),
  },
  {
    num: 4,
    title: 'Click "Book Now"',
    desc: 'Tap the Book Now button on your preferred vehicle to open the booking form.',
    icon: CreditCard,
    color: 'from-amber-500 to-orange-500',
    visual: (
      <div className="mt-3">
        <div className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium text-center">Book Now</div>
      </div>
    ),
  },
  {
    num: 5,
    title: 'Fill Your Details',
    desc: 'Enter name, 10-digit mobile, select pickup & drop points from dropdown, and number of seats.',
    icon: Users,
    color: 'from-cyan-500 to-blue-500',
    visual: (
      <div className="mt-3 space-y-2">
        <div className="h-9 bg-gray-100 rounded-lg flex items-center px-3 text-xs text-gray-400">👤 Your Name</div>
        <div className="h-9 bg-gray-100 rounded-lg flex items-center px-3 text-xs text-gray-400">📱 10-digit Mobile</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 bg-gray-100 rounded-lg flex items-center px-3 text-xs text-gray-400">📍 Pickup</div>
          <div className="h-9 bg-gray-100 rounded-lg flex items-center px-3 text-xs text-gray-400">📍 Drop</div>
        </div>
      </div>
    ),
  },
  {
    num: 6,
    title: 'Confirm Booking',
    desc: 'Review fare, then confirm. If advance is OFF → instant booking! Pay fare to driver after journey.',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-500',
    visual: (
      <div className="mt-3 p-3 bg-emerald-50 rounded-xl text-center">
        <p className="text-emerald-700 font-bold text-sm">✅ Booking Confirmed!</p>
        <p className="text-xs text-emerald-600 mt-1">Pay ₹350 to driver after journey</p>
      </div>
    ),
  },
  {
    num: 7,
    title: 'Get WhatsApp Confirmation',
    desc: 'After booking, click the green WhatsApp button to receive full booking details with vehicle & driver info.',
    icon: MessageCircle,
    color: 'from-green-600 to-green-500',
    visual: (
      <div className="mt-3">
        <div className="w-full py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          Get Booking on WhatsApp
        </div>
      </div>
    ),
  },
  {
    num: 8,
    title: 'Track Your Booking',
    desc: 'Visit "Track Booking" page, enter your mobile or booking code to check status, driver & vehicle details anytime.',
    icon: Search,
    color: 'from-indigo-500 to-purple-500',
    visual: (
      <div className="mt-3 flex gap-2">
        <div className="flex-1 h-9 bg-gray-100 rounded-lg flex items-center px-3 text-xs text-gray-400">Mobile / Booking Code</div>
        <div className="px-4 h-9 bg-indigo-600 text-white rounded-lg text-xs font-medium flex items-center">Track</div>
      </div>
    ),
  },
]

export default function HowToBook() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-emerald-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">How to Book Your Seat</h1>
          <p className="text-gray-600 mt-3 text-lg">Simple 8-step guide to book your trip with MS Choudhary Travels</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" /> Takes less than 2 minutes
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <div className="flex gap-4">
                {/* Step number + line */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {step.num}
                  </div>
                  {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
                </div>

                {/* Content card */}
                <div className="flex-1 pb-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                      <step.icon className="w-5 h-5 text-gray-700" />
                      <h3 className="font-bold text-gray-900 text-lg">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                    {step.visual}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Extra info */}
        <div className="mt-12 space-y-4">
          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-2">⏳ Seats Full? Join Waiting List</h3>
            <p className="text-sm text-amber-700">If all vehicles are full, a "Join Waiting List" banner will appear. Add your details and we&apos;ll contact you when a seat opens up.</p>
          </div>

          <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">🚗 Need Full Car?</h3>
            <p className="text-sm text-purple-700">Book the entire vehicle! Scroll down on homepage → "Book Full Car" → Submit request → Admin approves with vehicle & driver.</p>
          </div>

          <div className="p-5 bg-orange-50 rounded-2xl border border-orange-200">
            <h3 className="font-bold text-orange-800 mb-2">🚌 Bus Service Available</h3>
            <p className="text-sm text-orange-700">Tourist Luxury Coach (Full AC, LED TV) — Gangoh→Delhi 6:00 AM, Delhi→Gangoh 5:00 PM. Call to book: +91 7830673603</p>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-10 text-center space-y-4">
          <a href="/#trips" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all">
            <Car className="w-5 h-5" /> Book Now
          </a>
          <p className="text-gray-500 text-sm">Need help? Call us</p>
          <a href="tel:7830673603" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
            <Phone className="w-4 h-4" /> +91 7830673603
          </a>
        </div>
      </div>
    </main>
  )
}
