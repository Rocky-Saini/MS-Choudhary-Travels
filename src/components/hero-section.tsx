'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Users, Shield } from 'lucide-react'

export function HeroSection() {
  const [stats, setStats] = useState({ todayTrips: 0, totalVehicles: 0, fare: 350 })

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background - Bus/highway image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&q=80&auto=format"
          alt="Bus on highway"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        {/* Mobile Ertiga image - shows first on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:hidden mb-8 relative"
        >
          <img
            src="/maruti-ertiga-tour11_600x400.png"
            alt="Maruti Suzuki Ertiga White"
            className="w-full rounded-2xl shadow-xl"
          />
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
            <p className="text-xs text-gray-500">Starting from</p>
            <p className="text-xl font-extrabold text-indigo-600">₹{stats.fare}<span className="text-xs text-gray-400 font-normal">/seat</span></p>
          </div>
          <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white rounded-lg px-3 py-1 shadow-lg">
            <p className="text-[10px] font-bold">7 Seater MPV</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
              <Shield className="w-4 h-4 text-emerald-400" />
              Safe & Reliable Intercity Travel
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              MS Choudhary
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 mt-2">Travels</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-lg">
              Premium intercity cab & bus service. Travel comfortably in our Maruti Suzuki Ertiga fleet between Gangoh and Delhi. Daily service at just ₹{stats.fare} per seat.
            </p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: MapPin, label: 'Door Pickup', value: 'Available' },
                { icon: Clock, label: 'Daily Service', value: `${stats.todayTrips} Trips` },
                { icon: Users, label: 'Fleet Size', value: `${stats.totalVehicles} Vehicles` },
                { icon: Shield, label: 'Per Seat', value: `₹${stats.fare}` },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <item.icon className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-400">{item.label}</p>
                  <p className="text-sm font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Book Now CTA */}
            <a
              href="#trips"
              className="mt-8 w-full sm:w-auto flex sm:inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 text-base"
            >
              Book Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Ertiga car image */}
              <img
                src="/maruti-ertiga-tour11_600x400.png"
                alt="Maruti Suzuki Ertiga White"
                className="w-full rounded-2xl shadow-2xl shadow-black/50"
              />
              {/* Floating price badge */}
              <div className="absolute -bottom-4 left-8 bg-white rounded-2xl p-4 shadow-2xl">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Starting from</p>
                <p className="text-3xl font-extrabold text-indigo-600">₹{stats.fare}</p>
                <p className="text-xs text-gray-500">per seat</p>
              </div>
              {/* Vehicle badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white rounded-xl px-4 py-2 shadow-lg">
                <p className="text-xs font-bold">7 Seater MPV</p>
                <p className="text-[10px] opacity-80">Maruti Suzuki Ertiga</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
