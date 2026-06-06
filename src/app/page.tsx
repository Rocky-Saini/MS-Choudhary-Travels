'use client'

import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { TripSection } from '@/components/trip-section'
import { BusServiceBanner } from '@/components/bus-service-banner'
import { FullCarSection } from '@/components/full-car-section'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <TripSection />
      <FullCarSection />
      <BusServiceBanner />

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">MS Choudhary Travels</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Premium intercity cab & bus service between Gangoh and Delhi. Safe, reliable, and comfortable travel in Maruti Suzuki Ertiga & Luxury Coach.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Our Routes</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">🚗 Gangoh → Delhi (Daily Cab)</li>
                <li className="flex items-center gap-2">🚗 Delhi → Gangoh (Daily Cab)</li>
                <li className="flex items-center gap-2">🚌 Gangoh → Delhi (Bus 6:00 AM)</li>
                <li className="flex items-center gap-2">🚌 Delhi → Gangoh (Bus 6:00 PM)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-indigo-400" /> +91 7830673603</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-400" /> adnanhasan01011988@gmail.com</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-400" /> Gangoh, Saharanpur, UP</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2026 MS Choudhary Travels. All rights reserved.
            </p>
            <div className="text-center md:text-right relative group">
              <p className="text-xs text-gray-600">
                Developed by{' '}
                <a href="https://www.instagram.com/thenameisrocky____?igsh=MWM0emxiYmRmaG8waA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer">
                  Rocky Saini
                </a>
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                <a href="https://codesefod.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                  Codesefod IT Solutions
                </a>
              </p>
              {/* Hover card */}
              <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="text-sm font-bold text-white">Rocky Saini</p>
                <p className="text-xs text-gray-400">Software Engineer</p>
                <p className="text-xs text-gray-400 mt-1">📞 9027437997</p>
                <a href="https://www.instagram.com/thenameisrocky____?igsh=MWM0emxiYmRmaG8waA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:text-pink-300 mt-1 inline-block">📸 Instagram</a>
                <div className="absolute bottom-0 right-4 translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
