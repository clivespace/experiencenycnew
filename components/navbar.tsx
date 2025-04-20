"use client"
import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="py-6 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end h-16">
          {/* Logo with space between words - now right-justified */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              href="/"
              className="text-black text-3xl font-brutalist tracking-widest flex items-center drop-shadow-md"
            >
              EXPERIENCE <span className="ml-1">NYC</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
