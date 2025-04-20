"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import RestaurantCard from "./restaurant-card"
import { RESTAURANT_QUERIES } from "@/lib/unsplash"

// Sample restaurant data with Unsplash images
const restaurants = [
  {
    id: 1,
    name: "Le Bernardin",
    image: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=300&h=180&fit=crop",
    description: "Upscale French seafood restaurant with elegant atmosphere and impeccable service.",
  },
  {
    id: 2,
    name: "Eleven Madison Park",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&h=180&fit=crop",
    description: "Sophisticated tasting menus featuring seasonal ingredients in an art deco space.",
  },
  {
    id: 3,
    name: "Gramercy Tavern",
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=300&h=180&fit=crop",
    description: "Seasonal American cuisine in a rustic, elegant setting with exceptional service.",
  },
  {
    id: 4,
    name: "Per Se",
    image: "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=300&h=180&fit=crop",
    description: "Chef Thomas Keller's New American restaurant offering prix fixe menus with city views.",
  },
  {
    id: 5,
    name: "Daniel",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=180&fit=crop",
    description: "Refined French cuisine served in an elegant setting with exceptional attention to detail.",
  },
  {
    id: 6,
    name: "Masa",
    image: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=300&h=180&fit=crop",
    description: "Exclusive sushi experience with Chef Masa Takayama's omakase menu.",
  },
]

export default function RestaurantCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)

  // Function to check scroll position and update arrow visibility
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current
    if (!container) return

    // Show left arrow if scrolled to the right
    setShowLeftArrow(container.scrollLeft > 20)

    // Show right arrow if not scrolled all the way to the right
    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 20
    setShowRightArrow(!isAtEnd)
  }

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollPosition)
      // Initial check
      checkScrollPosition()
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollPosition)
      }
    }
  }, [])

  // Scroll right function
  const scrollRight = () => {
    if (scrollContainerRef.current && !isScrolling) {
      setIsScrolling(true)
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: "smooth",
      })
      setTimeout(() => setIsScrolling(false), 500)
    }
  }

  // Scroll left function
  const scrollLeft = () => {
    if (scrollContainerRef.current && !isScrolling) {
      setIsScrolling(true)
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: "smooth",
      })
      setTimeout(() => setIsScrolling(false), 500)
    }
  }

  return (
    <div className="relative w-full py-8">
      <h2 className="text-2xl font-light mb-6 text-center">Featured</h2>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="snap-start">
              <RestaurantCard name={restaurant.name} image={restaurant.image} description={restaurant.description} />
            </div>
          ))}
        </div>

        {/* Left arrow - only visible when scrolled right */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute -left-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md border-[0.1px] border-gray-200/30 hover:bg-white transition-colors z-10"
            aria-label="See previous restaurants"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}

        {/* Right arrow - only visible when not at the end */}
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md border-[0.1px] border-gray-200/30 hover:bg-white transition-colors z-10"
            aria-label="See more restaurants"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  )
}
