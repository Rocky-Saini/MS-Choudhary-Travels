import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'bus-services.json')

export interface BusServiceData {
  id: string
  name: string
  routeFrom: string
  routeTo: string
  departureTime: string
  contactNumber: string
  fare: string
  description: string
  isActive: boolean
}

const DEFAULT_DATA: BusServiceData[] = [
  {
    id: 'bus-gangoh-delhi',
    name: 'Tourist Luxury Coach',
    routeFrom: 'Gangoh',
    routeTo: 'Delhi',
    departureTime: '6:00 AM',
    contactNumber: '9027437997',
    fare: '₹500 per seat',
    description: 'Full AC | LED TV | Luxury Coach | Bus No: UP 11 DT 8397 | Daily Service | Comfortable & Safe Travel',
    isActive: true,
  },
  {
    id: 'bus-delhi-gangoh',
    name: 'Tourist Luxury Coach',
    routeFrom: 'Delhi',
    routeTo: 'Gangoh',
    departureTime: '6:00 PM',
    contactNumber: '9027437997',
    fare: '₹500 per seat',
    description: 'Full AC | LED TV | Luxury Coach | Bus No: UP 11 DT 8397 | Daily Service | Comfortable & Safe Travel',
    isActive: true,
  },
]

export function getBusServices(): BusServiceData[] {
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2))
    return DEFAULT_DATA
  }
  return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
}

export function saveBusServices(services: BusServiceData[]) {
  writeFileSync(DATA_FILE, JSON.stringify(services, null, 2))
}

export function addBusService(data: Omit<BusServiceData, 'id'>): BusServiceData {
  const services = getBusServices()
  const newService: BusServiceData = { ...data, id: `bus-${Date.now()}` }
  services.push(newService)
  saveBusServices(services)
  return newService
}

export function updateBusService(id: string, data: Partial<BusServiceData>): BusServiceData | null {
  const services = getBusServices()
  const index = services.findIndex(s => s.id === id)
  if (index === -1) return null
  services[index] = { ...services[index], ...data }
  saveBusServices(services)
  return services[index]
}

export function deleteBusService(id: string): boolean {
  const services = getBusServices()
  const filtered = services.filter(s => s.id !== id)
  if (filtered.length === services.length) return false
  saveBusServices(filtered)
  return true
}
