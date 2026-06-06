'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/logo'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/"><Logo size="small" /></Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link href="/how-to-book" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              How to Book
            </Link>
            <Link href="/track" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Track Booking
            </Link>
            <Link href="/admin/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Admin
            </Link>
            <Link href="/driver/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Driver
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-100">
            <Link href="/" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 rounded-lg">
              Home
            </Link>
            <Link href="/how-to-book" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 rounded-lg">
              How to Book
            </Link>
            <Link href="/track" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 rounded-lg">
              Track Booking
            </Link>
            <Link href="/admin/login" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 rounded-lg">
              Admin
            </Link>
            <Link href="/driver/login" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 rounded-lg">
              Driver
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
