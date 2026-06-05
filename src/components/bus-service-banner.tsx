'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bus, Clock, MapPin, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface BusService {
  id: string
  name: string
  routeFrom: string
  routeTo: string
  departureTime: string
  contactNumber: string | null
  fare: string | null
  description: string | null
  isActive: boolean
}

export function BusServiceBanner() {
  const [services, setServices] = useState<BusService[]>([])

  useEffect(() => {
    fetch('/api/bus-services')
      .then(r => r.json())
      .then(d => setServices(d.services || []))
      .catch(() => {})
  }, [])

  if (services.length === 0) return null

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🚌 Bus Service Also Available</h2>
          <p className="text-gray-600">Daily bus service between Gangoh and Delhi</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-400" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Bus className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{service.name}</h3>
                      <p className="text-sm text-gray-500">Daily Service</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-800">{service.routeFrom} → {service.routeTo}</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-800">Daily Departure: {service.departureTime}</span>
                  </div>

                  {service.fare && (
                    <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                      <span className="text-lg font-bold text-orange-600">₹</span>
                      <span className="text-sm font-bold text-gray-800">{service.fare}</span>
                    </div>
                  )}

                  {service.description && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {service.description.split('|').map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-white/80 rounded-full text-gray-700 border border-orange-200 font-medium">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {service.contactNumber && (
                    <a
                      href={`tel:${service.contactNumber}`}
                      className="flex items-center justify-center gap-2 w-full p-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call to Book: {service.contactNumber}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
