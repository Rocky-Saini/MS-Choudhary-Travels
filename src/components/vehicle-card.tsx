'use client'

import { motion } from 'framer-motion'
import { Phone, Clock, Users, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface VehicleCardProps {
  trip: {
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
  }
  onBook: (tripId: string) => void
}

export function VehicleCard({ trip, onBook }: VehicleCardProps) {
  const availableSeats = trip.totalSeats - trip.bookedSeats
  const isFull = availableSeats === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
        <div className={`h-1.5 ${isFull ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'}`} />

        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{trip.vehicleNumber}</h3>
              <p className="text-sm text-gray-500">Maruti Suzuki Ertiga</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={isFull ? 'destructive' : 'secondary'}>
                {isFull ? 'Full' : `${availableSeats} seats left`}
              </Badge>
              {trip.tag && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-[10px] shadow-sm">
                  ⚡ {trip.tag}
                </Badge>
              )}
              {trip.advanceRequired && (
                <Badge variant="warning" className="text-[10px]">Advance Required</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50/50 rounded-xl">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">{trip.route}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Driver</p>
                <p className="text-sm font-medium text-gray-900">{trip.driverName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Contact</p>
                <p className="text-sm font-medium text-gray-900">{trip.driverMobile}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Departure</p>
                <p className="text-sm font-medium text-gray-900">{trip.departureTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600">₹</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Per Seat</p>
                <p className="text-sm font-bold text-gray-900">₹{trip.fare}</p>
              </div>
            </div>
          </div>

          {/* Seat counter */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Seat Occupancy</span>
              <span>{trip.bookedSeats}/{trip.totalSeats}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : trip.bookedSeats > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${(trip.bookedSeats / trip.totalSeats) * 100}%` }}
              />
            </div>
          </div>

          <Button className="w-full" disabled={isFull} onClick={() => onBook(trip.id)} variant={isFull ? 'outline' : 'default'}>
            {isFull ? 'No Seats Available' : trip.advanceRequired ? 'Book Now (Advance)' : 'Book Now'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
