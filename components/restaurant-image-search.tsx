"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ImageResult {
  title: string
  imageLink: string
  thumbnailLink: string
  contextLink: string
  source?: 'google' | 'unsplash' | 'fallback'
}

export default function RestaurantImageSearch() {
  const [query, setQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<ImageResult[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState("")

  // Function to fetch images
  const fetchImages = useCallback(async (searchTerm: string, pageNum: number) => {
    if (!searchTerm) return
    
    setIsLoading(true)
    setError("")
    
    try {
      const res = await fetch(`/api/image-proxy?q=${encodeURIComponent(searchTerm)}&page=${pageNum}`)
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`)
      }
      
      const imgs = await res.json() as ImageResult[]
      
      if (pageNum === 1) {
        // Replace images on new search
        setImages(imgs)
      } else {
        // Append images on pagination
        setImages(prev => [...prev, ...imgs])
      }
      
      // If we got 10 images, assume there might be more
      setHasMore(imgs.length === 10)
    } catch (err) {
      setError(`Failed to fetch images: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    // Reset page to 1 when starting a new search
    setPage(1)
    setSearchQuery(query.trim())
  }

  // Load more images
  const loadMore = () => {
    if (isLoading || !hasMore) return
    setPage(prev => prev + 1)
  }

  // Initial search and pagination effect
  useEffect(() => {
    if (searchQuery) {
      fetchImages(searchQuery, page)
    }
  }, [searchQuery, page, fetchImages])

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter restaurant name..."
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading && page === 1 ? "Searching..." : "Search"}
        </Button>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {images.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-4">Images for "{searchQuery}"</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div key={`${img.imageLink}-${index}`} className="relative rounded overflow-hidden border border-gray-200">
                <a href={img.contextLink} target="_blank" rel="noopener noreferrer" className="block aspect-square relative">
                  {/* We use the image proxy for external images */}
                  <img
                    src={`/api/image-proxy/image?url=${encodeURIComponent(img.imageLink)}`}
                    alt={img.title}
                    className="object-cover w-full h-full hover:opacity-90 transition-opacity"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).src = "/placeholder.jpg"
                    }}
                  />
                  {/* Source attribution badge */}
                  {img.source && (
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {img.source === 'google' ? 'Google' : 
                       img.source === 'unsplash' ? 'Unsplash' : ''}
                    </span>
                  )}
                </a>
                <div className="p-2 text-xs truncate bg-white">{img.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button 
            onClick={loadMore} 
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? "Loading..." : "Show More"}
          </Button>
        </div>
      )}

      {searchQuery && !isLoading && images.length === 0 && (
        <div className="text-center text-gray-500">
          No images found for "{searchQuery}". Try a different search term.
        </div>
      )}
    </div>
  )
} 