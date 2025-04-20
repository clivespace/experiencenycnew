import Link from "next/link"
import { Instagram, Twitter, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100/50 py-8 mt-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand Column */}
          <div>
            <Link href="/" className="text-black text-xl font-brutalist tracking-widest flex items-center">
              EXPERIENCE <span className="ml-1">NYC</span>
            </Link>
            <p className="mt-3 text-xs text-gray-600">Your guide to dining and social experiences in New York City.</p>
          </div>

          {/* Connect */}
          <div className="flex flex-col items-end">
            <div className="flex space-x-4 mb-3">
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@experiencenyc.com"
                className="text-gray-400 hover:text-[#D4AF37] transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
            <p className="text-xs text-gray-500">
              <a href="mailto:info@experiencenyc.com" className="hover:text-[#D4AF37] transition-colors">
                info@experiencenyc.com
              </a>
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100/50 mt-6 pt-6 text-center">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} ExperienceNYC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
