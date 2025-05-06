import RestaurantImageSearch from "@/components/restaurant-image-search"

export const metadata = {
  title: "Restaurant Image Search | NYC Dining",
  description: "Search for restaurant images in New York City",
}

export default function RestaurantImagesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Restaurant Image Search</h1>
      <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
        Search for restaurant images in New York City. Enter a restaurant name and view images from Google.
        Our system automatically enhances your query to find the most relevant restaurant images.
        If Google API reaches its quota limit, the system will gracefully fall back to Unsplash images.
      </p>
      
      <RestaurantImageSearch />
    </div>
  )
} 