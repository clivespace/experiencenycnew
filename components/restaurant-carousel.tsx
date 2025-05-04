"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import RestaurantCard from "./restaurant-card"
import { type Restaurant, enhanceRestaurantsWithRealImages } from "@/lib/restaurant-helpers"

// Sample restaurant data with placeholder images
const initialRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "Le Bernardin",
    cuisine: "French",
    address: "155 W 51st St",
    rating: 4.8,
    priceRange: "$$$",
    images: ["/images/placeholder-restaurant.jpg"],
    description: "Upscale French seafood restaurant with elegant atmosphere and impeccable service.",
    location: "Midtown, Manhattan"
  },
  {
    id: 2,
    name: "Eleven Madison Park",
    cuisine: "American",
    address: "11 Madison Ave",
    rating: 4.9,
    priceRange: "$$$$",
    images: ["/images/placeholder-restaurant.jpg"],
    description: "Sophisticated tasting menus featuring seasonal ingredients in an art deco space.",
    location: "Flatiron, Manhattan"
  },
  {
    id: 3,
    name: "Gramercy Tavern",
    cuisine: "American",
    address: "42 E 20th St",
    rating: 4.7,
    priceRange: "$$$",
    images: ["/images/placeholder-restaurant.jpg"],
    description: "Seasonal American cuisine in a rustic, elegant setting with exceptional service.",
    location: "Gramercy, Manhattan"
  },
  {
    id: 4,
    name: "Per Se",
    cuisine: "French",
    address: "10 Columbus Circle",
    rating: 4.8,
    priceRange: "$$$$",
    images: ["/images/placeholder-restaurant.jpg"],
    description: "Chef Thomas Keller's New American restaurant offering prix fixe menus with city views.",
    location: "Columbus Circle, Manhattan"
  },
  {
    id: 5,
    name: "Daniel",
    cuisine: "French",
    address: "60 E 65th St",
    rating: 4.8,
    priceRange: "$$$$",
    images: ["/images/placeholder-restaurant.jpg"],
    description: "Refined French cuisine served in an elegant setting with exceptional attention to detail.",
    location: "Upper East Side, Manhattan"
  },
  {
    id: 6,
    name: "Masa",
    cuisine: "Japanese",
    address: "10 Columbus Circle",
    rating: 4.9,
    priceRange: "$$$$",
    images: ["/images/placeholder-restaurant.jpg"],
    description: "Exclusive sushi experience with Chef Masa Takayama's omakase menu.",
    location: "Columbus Circle, Manhattan"
  },
]

export default function RestaurantCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants)

  // Function to fetch real images for restaurants
  useEffect(() => {
    // This will only run on the server during SSR
    if (typeof window === 'undefined') {
      return;
    }
    
    // Only run this effect once on the client
    const fetchRealImages = async () => {
      try {
        console.log('Fetching real restaurant images...');
        const response = await fetch('/api/restaurant-images');
        
        if (response.ok) {
          const data = await response.json();
          
          // The API now returns the array directly, not inside a "restaurants" object
          if (Array.isArray(data)) {
            console.log('Got enhanced restaurants with real images:', data.length);
            setRestaurants(data);
          } else if (data.restaurants && Array.isArray(data.restaurants)) {
            // Fallback for backward compatibility
            console.log('Got enhanced restaurants with real images (legacy format):', data.restaurants.length);
            setRestaurants(data.restaurants);
          } else {
            console.error('Invalid restaurant data format:', data);
          }
        } else {
          console.error('Failed to fetch real restaurant images:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching real restaurant images:', error);
      }
    };
    
    fetchRealImages();
  }, []);

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
              <RestaurantCard 
                name={restaurant.name} 
                image={restaurant.images?.[0] || restaurant.image} 
                description={restaurant.description || ''} 
              />
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
