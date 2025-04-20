"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import RestaurantCarousel from "@/components/restaurant-carousel"
import UnifiedChatInterface from "@/components/unified-chat-interface"
import Footer from "@/components/footer"

export default function Home() {
  const [resetKey, setResetKey] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleFullReset = () => {
    setResetKey((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl flex-grow">
        <div className="flex flex-col items-center text-center mb-12 relative overflow-hidden">
          {/* Decorative elements */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] ${isLoaded ? "animate-scaleIn animate-delay-100" : "opacity-0"}`}
          >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
          </div>

          {/* Main heading with enhanced animations */}
          <div className="relative mb-6">
            {/* Experience */}
            <span
              className={`inline-block text-4xl md:text-5xl lg:text-6xl font-light tracking-tight ${isLoaded ? "animate-fadeInLeft animate-delay-200" : "opacity-0"}`}
            >
              <span className="text-gradient font-medium">Experience</span>
            </span>

            {/* the Best */}
            <span
              className={`inline-block text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mx-3 ${isLoaded ? "animate-fadeInUp animate-delay-300" : "opacity-0"}`}
            >
              <span className="fancy-underline">the Best</span>
            </span>

            {/* of */}
            <span
              className={`inline-block text-4xl md:text-5xl lg:text-6xl font-light tracking-tight ${isLoaded ? "animate-fadeInUp animate-delay-400" : "opacity-0"}`}
            >
              of
            </span>

            {/* New York City with special effects */}
            <div className={`mt-2 ${isLoaded ? "animate-fadeInRight animate-delay-500" : "opacity-0"}`}>
              <span className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-shadow">
                <span className="highlight-container">
                  New <span className="text-shimmer">York</span> City
                  <span className="highlight animate-float"></span>
                </span>
              </span>
            </div>

            {/* Decorative dots */}
            <div className={`mt-4 ${isLoaded ? "animate-fadeInUp animate-delay-600" : "opacity-0"}`}>
              <span className="decorative-dot text-[#D4AF37]"></span>
            </div>
          </div>

          {/* Animated subheading with typewriter effect */}
          <p
            className={`text-lg md:text-xl text-gray-600 mb-8 font-light max-w-3xl relative ${isLoaded ? "animate-fadeInUp animate-delay-700" : "opacity-0"}`}
          >
            Discover the best <span className="text-[#D4AF37] font-medium">restaurants</span>,{" "}
            <span className="text-[#D4AF37] font-medium">bars</span>, and{" "}
            <span className="text-[#D4AF37] font-medium">social clubs</span> in New York City with the help of our AI
            Assistant
          </p>

          {/* Decorative line with enhanced animation */}
          <div className={`relative ${isLoaded ? "animate-scaleIn animate-delay-800" : "opacity-0"}`}>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse-slow"></div>
          </div>
        </div>

        {/* Unified Chat Interface Container with overflow handling */}
        <div className="w-full overflow-hidden mx-auto mb-12 flex justify-center">
          <div className="w-full max-w-3xl">
            <UnifiedChatInterface key={resetKey} initialHeight="500px" onReset={handleFullReset} />
          </div>
        </div>

        {/* Restaurant Carousel */}
        <RestaurantCarousel />
      </div>

      <Footer />
    </main>
  )
}
