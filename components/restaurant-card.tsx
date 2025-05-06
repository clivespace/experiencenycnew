import Image from "next/image"
import { useState } from "react"

interface RestaurantCardProps {
  name: string
  image?: string
  description: string
}

export default function RestaurantCard({ name, image, description }: RestaurantCardProps) {
  // Default image if not provided
  const defaultImage = "/images/restaurant-1.jpg";
  
  // State to track image loading errors
  const [imageError, setImageError] = useState(false);
  
  // Determine the image source - use proxy for external URLs
  const getImageSrc = () => {
    if (!image || imageError) {
      return defaultImage;
    }
    
    // Check if this is a remote URL that needs proxying
    if (image.startsWith('http')) {
      // For external images, use our proxy
      return `/api/image-proxy/image?url=${encodeURIComponent(image)}`;
    }
    
    // For internal images, use directly
    return image;
  };

  // Determine if the image is an external URL
  const isExternal = image?.startsWith('http');
  
  // Determine if we should use Next.js Image or regular img tag
  const useNextImage = !isExternal || (isExternal && !imageError);
  
  return (
    <div className="min-w-[300px] max-w-[300px] bg-white rounded-lg overflow-hidden shadow-sm border-[0.1px] border-gray-200/30 flex-shrink-0 mx-2">
      <div className="p-3 border-b border-gray-100/20">
        <h3 className="font-medium text-lg">{name}</h3>
      </div>
      <div className="relative h-[180px] w-full">
        {/* Handle image display based on source */}
        <img 
          src={getImageSrc()} 
          alt={name} 
          className="object-cover w-full h-full"
          onError={() => setImageError(true)}
        />
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
