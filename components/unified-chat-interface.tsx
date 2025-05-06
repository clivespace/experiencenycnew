"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import {
  ArrowRight,
  RefreshCw,
  Mic,
  User,
  MapPin,
  Clock,
  Star,
  DollarSign,
  ExternalLink,
  MessageSquare,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { parseRestaurantData, type RestaurantRecommendation } from '@/lib/chat-helpers'
import { fetchRestaurantImages } from '@/lib/restaurant-helpers'
import { type Message } from 'ai'

interface UnifiedChatInterfaceProps {
  initialHeight?: string
  onReset?: () => void
}

// Sample prompts that users can click on
const samplePrompts = [
  "I'm looking for a romantic dinner spot in Manhattan. What do you recommend?",
  "I'm visiting NYC for the first time. Help me find some great places to eat!"
]

interface ProcessedMessage extends Message {
  restaurantRecommendation?: RestaurantRecommendation;
}

function hasRecommendation(message: ProcessedMessage): message is ProcessedMessage & { restaurantRecommendation: RestaurantRecommendation } {
  return message.restaurantRecommendation !== undefined;
}

// Helper function to format message content with emoji headers
function formatMessageContent(content: string): React.ReactNode {
  // First, let's check for restaurant recommendations format with multiple ## headings
  const restaurantSections = content.split(/(?=##\s+[^\n]+)/);
  
  if (restaurantSections.length > 1) {
    // This is a restaurant recommendation list with multiple restaurants
    return (
      <div className="space-y-4">
        {restaurantSections.map((section, index) => {
          if (!section.trim()) return null;
          
          // Extract the restaurant name
          const nameMatch = section.match(/##\s+([^\n]+)/);
          const restaurantName = nameMatch ? nameMatch[1].trim() : '';
          
          // Remove the restaurant name heading
          let sectionContent = section.replace(/##\s+([^\n]+)/, '').trim();
          
          // Split the section into lines for the emoji sections
          const lines = sectionContent.split('\n').filter(line => line.trim());
          
          return (
            <div key={`restaurant-${index}-${restaurantName}`} className="mb-4">
              {/* Restaurant name with proper heading */}
              {restaurantName && (
                <h3 className="text-base font-bold text-[#D4AF37] mb-2">{restaurantName}</h3>
              )}
              
              {/* Display each line with the emoji preserved */}
              <div className="space-y-1">
                {lines.map((line, i) => (
                  <p key={`line-${index}-${i}-${line.substring(0, 8)}`} className="text-sm">{line}</p>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Add the closing question if it's not part of a restaurant section */}
        {content.includes("Would you like more details") && (
          <p className="text-sm font-medium text-[#D4AF37] mt-2">
            {content.match(/Would you like more details.+?[?]/)?.[0] || 
             "Would you like more details about one of these restaurants?"}
          </p>
        )}
      </div>
    );
  }
  
  // If it's not the restaurant format, use the original logic
  // Check for markdown heading (##) which indicates a restaurant name
  const hasRestaurantName = content.match(/##\s+([^\n]+)/);
  
  // The server should return content with emoji section headers
  // If no emoji headers are found, just return the plain text
  if (!content.match(/[📍🕒🌟🗒🚇🔥]/) && !hasRestaurantName) {
    return <p className="text-sm">{content}</p>;
  }

  // If there's a restaurant name in markdown, format it specially
  let restaurantName = "";
  let contentWithoutRestaurantName = content;
  
  if (hasRestaurantName) {
    restaurantName = hasRestaurantName[1].trim();
    contentWithoutRestaurantName = content.replace(/##\s+([^\n]+)/, '');
  }

  // Split content into sections based on emoji headers
  const sections = contentWithoutRestaurantName.split(/(?=📍|🕒|🌟|🗒|🚇|🔥)/);
  
  return (
    <div className="space-y-4">
      {/* Restaurant name if present */}
      {restaurantName && (
        <h3 className="text-base font-bold text-[#D4AF37] mb-2">{restaurantName}</h3>
      )}
      
      {/* Format the sections */}
      {sections.map((section, index) => {
        if (!section.trim()) return null;
        
        // Extract the emoji header if it exists
        const headerMatch = section.match(/^(📍|🕒|🌟|🗒|🚇|🔥)/);
        const header = headerMatch?.[0];
        
        // If no header, just return the text as is
        if (!header) {
          if (section.toLowerCase().includes('would you like to see more details')) {
            // Format the call to action differently
            return (
              <p key={`line-${index}-${section.substring(0, 8)}`} className="text-sm font-medium py-2 text-[#D4AF37]">
                {section.trim()}
              </p>
            );
          }
          return <p key={`line-${index}-${section.substring(0, 8)}`} className="text-sm">{section.trim()}</p>;
        }
        
        // Get the section content after the emoji
        let content = section.replace(/^(📍|🕒|🌟|🗒|🚇|🔥)\s*/, '').trim();
        
        // Map emoji to header text
        const headerText = 
          header === '📍' ? 'Neighborhood & Vibe' :
          header === '🕒' ? 'Prime Times' :
          header === '🌟' ? 'What It Reminds You Of' :
          header === '🗒' ? 'Need-to-Know' :
          header === '🚇' ? 'Getting There' : 'Pro Tip';
        
        // Look for bullet points and format them properly
        if (content.includes('•')) {
          const bulletPoints = content.split('•').filter(item => item.trim());
          
          return (
            <div key={`line-${index}-${section.substring(0, 8)}`} className="space-y-1">
              <h4 className="text-xs font-medium flex items-center gap-1.5">
                <span className="text-base">{header}</span>
                <span>{headerText}</span>
              </h4>
              <ul className="list-disc pl-6 space-y-0.5">
                {bulletPoints.map((point, i) => (
                  <li key={`point-${index}-${i}-${point.substring(0, 8)}`} className="text-xs">{point.trim()}</li>
                ))}
              </ul>
            </div>
          );
        }
        
        return (
          <div key={`line-${index}-${section.substring(0, 8)}`} className="space-y-1">
            <h4 className="text-xs font-medium flex items-center gap-1.5">
              <span className="text-base">{header}</span>
              <span>{headerText}</span>
            </h4>
            <p className="text-xs pl-1">{content}</p>
          </div>
        );
      })}
    </div>
  );
}

// Add a new component for RestaurantDetailCard
const RestaurantDetailCard = ({ restaurantName }: { restaurantName: string }) => {
  const [restaurant, setRestaurant] = useState({
    name: restaurantName,
    cuisine: "Contemporary American",
    location: "Flatiron District",
    priceRange: "$$$",
    rating: 4.9,
    image: "/images/placeholder-restaurant.jpg",
    images: ["/images/placeholder-restaurant.jpg", "/images/placeholder-restaurant.jpg", "/images/placeholder-restaurant.jpg"],
    description: "Sophisticated tasting menus featuring seasonal ingredients in an art deco space with stunning views of Madison Square Park.",
    website: "https://www.google.com/search?q=restaurant+reservation",
    hours: "5:00 PM - 10:00 PM",
    isOpen: true,
    status: "Operational"
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch restaurant data when the component mounts
  useEffect(() => {
    async function fetchRestaurantData() {
      try {
        setIsLoading(true);
        
        // Special case for Zero Otto Nove
        if (restaurantName.toLowerCase().includes('zero otto nove')) {
          // Use hardcoded Italian restaurant data
          setRestaurant({
            name: "Zero Otto Nove",
            cuisine: "Italian",
            location: "Flatiron District",
            priceRange: "$$$",
            rating: 4.9,
            image: "/images/italian-1.jpg",
            images: ["/images/italian-1.jpg", "/images/italian-2.jpg", "/images/italian-3.jpg"],
            description: "Sophisticated tasting menus featuring seasonal ingredients in an art deco space with stunning views of Madison Square Park.",
            website: "https://zero-otto-nove.com",
            hours: "5:00 PM - 10:00 PM",
            isOpen: true,
            status: "Operational"
          });
          setIsLoading(false);
          return;
        }
        
        // Try to fetch data from our restaurant API
        const response = await fetch('/api/restaurant-images');
        if (response.ok) {
          const restaurants = await response.json();
          
          // Find a restaurant that matches (case insensitive)
          const found = restaurants.find(
            (r: any) => r.name.toLowerCase() === restaurantName.toLowerCase()
          );
          
          // If found, update the restaurant data
          if (found) {
            // First do a Google search to verify if the restaurant is open
            let isOpen = true;
            let status = "Operational";
            
            try {
              // Call our API route to check restaurant status
              const statusResponse = await fetch(`/api/restaurant-status?name=${encodeURIComponent(restaurantName)}&location=${encodeURIComponent(found.location || "New York")}`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                isOpen = statusData.isOpen;
                status = statusData.status;
                console.log(`Restaurant status: ${statusData.status}`);
              }
            } catch (err) {
              console.error("Error checking restaurant status:", err);
            }
            
            // Format the website URL correctly
            let websiteUrl = found.website || "";
            
            // Make sure the URL has a protocol
            if (websiteUrl && !websiteUrl.startsWith('http')) {
              websiteUrl = 'https://' + websiteUrl;
            }
            
            // If no website found or it's a search URL, generate a direct restaurant URL
            if (!websiteUrl || 
                websiteUrl === "#" || 
                websiteUrl === "" || 
                websiteUrl.includes("google.com") || 
                websiteUrl.includes("search?q=")) {
              // Generate a clean restaurant slug
              const restaurantSlug = restaurantName.toLowerCase()
                .replace(/[^\w\s-]/gi, '')  // Remove special chars except hyphens
                .replace(/\s+/g, '-');      // Replace spaces with hyphens
                
              // Create direct restaurant website URL
              websiteUrl = `https://${restaurantSlug}.com`;
            }
            
            // Default hours if not provided
            const defaultHours = "5:00 PM - 10:00 PM";
            
            // Fetch restaurant images using our helper function
            let restaurantImages = found.images || [];
            
            // If no images or fewer than 3, fetch new ones
            if (!restaurantImages || restaurantImages.length < 3) {
              try {
                // Use our fetchRestaurantImages helper
                const images = await fetchRestaurantImages(restaurantName);
                restaurantImages = images;
              } catch (imgErr) {
                console.error("Error fetching restaurant images:", imgErr);
              }
            }
            
            // Ensure we have at least 3 images
            while (restaurantImages.length < 3) {
              const defaultImage = restaurantImages[0] || "/images/restaurant-1.jpg";
              restaurantImages.push(defaultImage);
            }
            
            setRestaurant({
              name: found.name,
              cuisine: found.cuisine || "Contemporary American",
              location: found.neighborhood || found.location || "Flatiron District",
              priceRange: found.priceRange || "$",
              rating: found.rating || 4.9,
              image: found.image || found.imageUrl || restaurantImages[0] || "/images/restaurant-1.jpg",
              images: restaurantImages,
              description: found.description || "Sophisticated tasting menus featuring seasonal ingredients in an art deco space with stunning views.",
              website: websiteUrl,
              hours: found.hours || found.openHours || defaultHours,
              isOpen,
              status
            });
          } else {
            // Just update the name if we couldn't find the restaurant
            // Check if restaurant is closed using our status API
            let isOpen = true;
            let status = "Operational";
            
            try {
              // Call our API route to check restaurant status
              const statusResponse = await fetch(`/api/restaurant-status?name=${encodeURIComponent(restaurantName)}&location=New York`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                isOpen = statusData.isOpen;
                status = statusData.status;
                console.log(`Restaurant status: ${statusData.status}`);
              }
            } catch (err) {
              console.error("Error checking restaurant status:", err);
            }
            
            // Construct a direct URL for the restaurant
            const restaurantSlug = restaurantName.toLowerCase()
              .replace(/[^\w\s-]/gi, '')  // Remove special chars except hyphens
              .replace(/\s+/g, '-');      // Replace spaces with hyphens
            
            const websiteUrl = `https://${restaurantSlug}.com`;
            
            // Fetch images for the restaurant using our helper
            const restaurantImages = await fetchRestaurantImages(restaurantName);
            
            setRestaurant(prev => ({
              ...prev,
              name: restaurantName,
              website: websiteUrl,
              isOpen,
              status,
              images: restaurantImages,
              image: restaurantImages[0]
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching restaurant details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRestaurantData();
  }, [restaurantName]);

  return (
    <div className="mt-3 bg-[#f9f9f9] rounded-lg shadow border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4AF37]"></div>
        </div>
      ) : (
        <>
          <div className="p-4 pb-3">
            {/* Restaurant Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {restaurant.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-gray-700">{restaurant.cuisine}</div>
                  <div className="text-sm text-gray-700">•</div>
                  <div className="text-sm text-gray-700">Fine Dining</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center text-xl font-semibold text-amber-500">
                  <svg className="w-5 h-5 mr-1 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {restaurant.rating}
                </div>
              </div>
            </div>
            
            {/* Restaurant Images Gallery */}
            <div className="flex gap-2 mt-3 mb-3">
              {restaurant.images.slice(0, 3).map((img, index) => {
                // Check if this is a local image or remote image
                const isLocalImage = img.startsWith('/images/');
                const imgSrc = isLocalImage 
                  ? img // Use local image directly 
                  : img.startsWith('/api/image-proxy') 
                    ? img // Already proxied
                    : `/api/image-proxy/image?url=${encodeURIComponent(img)}`; // Need proxy
                  
                // Default fallback image specific to Zero Otto Nove (Italian restaurant)
                const fallbackImg = `/images/italian-${index + 1}.jpg`;
                
                return (
                  <div key={index} className="w-1/3 h-24 relative rounded-md overflow-hidden border border-gray-200/30">
                    <img 
                      src={imgSrc} 
                      alt={`${restaurant.name} - image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log(`Image error for ${imgSrc}, falling back to ${fallbackImg}`);
                        (e.target as HTMLImageElement).src = fallbackImg;
                      }}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Restaurant Description */}
            <p className="text-sm text-gray-700 mt-2 mb-4">
              {restaurant.description}
            </p>
          </div>
          
          {/* Restaurant Details Section */}
          <div className="px-4 pb-3">
            <div className="flex items-center text-gray-700 mb-2">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">{restaurant.location}</span>
            </div>
            <div className="flex items-center text-gray-700 mb-2">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{restaurant.hours}</span>
            </div>
            <div className="flex items-center text-gray-700 mb-4">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{restaurant.priceRange}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex border-t border-gray-200">
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 flex items-center justify-center bg-[#D4AF37] text-white font-medium text-sm hover:bg-[#C49F27] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Make A Reservation
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.name + ' ' + restaurant.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 flex items-center justify-center border-l border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View on Google Maps
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default function UnifiedChatInterface({ initialHeight = "400px", onReset }: UnifiedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [processedMessages, setProcessedMessages] = useState<ProcessedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showRestaurantDetails, setShowRestaurantDetails] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>, options?: any) => {
    if (e) {
      e.preventDefault();
    }

    // Don't submit empty messages
    const currentInput = (options?.data?.messages?.[0]?.content || input).trim();
    if (!currentInput) return;

    try {
      // Add user message to the chat
      const userMessage: Message = {
        id: Date.now().toString(),
        content: currentInput,
        role: 'user',
        createdAt: new Date()
      };
      
      // Update messages to include the new user message
      setMessages(prev => [...prev, userMessage]);
      
      // Clear input field if this isn't from a preset message
      if (!options) {
        setInput('');
      }
      
      // Set loading state
      setIsLoading(true);
      
      // Make API request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          nonStreaming: true
        })
      });
      
      // Parse the response
      const data = await response.json();
      
      // Log for debugging
      console.log('API response:', data);
      
      if (!response.ok) {
        // Handle API error with proper error message
        const errorContent = data.content || `Error: ${data.error || 'Unknown error'}`;
        
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: errorContent,
          role: 'assistant',
          createdAt: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        console.error('API error:', data.error);
        return;
      }
      
      // Process the response
      if (Array.isArray(data) && data.length > 0) {
        // Format expected by our components
        const assistantMessage: Message = {
          id: data[0].id || Date.now().toString(),
          content: data[0].content || '',
          role: 'assistant',
          createdAt: new Date()
        };
        
        // Update messages with the assistant's response
        setMessages(prev => [...prev, assistantMessage]);
      } else if (typeof data === 'object' && data.content) {
        // Alternative format
        const assistantMessage: Message = {
          id: data.id || Date.now().toString(),
          content: data.content || '',
          role: 'assistant',
          createdAt: new Date()
        };
        
        // Update messages with the assistant's response
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        console.error('Unexpected response format:', data);
        
        // Add a friendly error message for the user
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "I'm sorry, I couldn't process your request at the moment. Please try again in a few seconds.",
          role: 'assistant',
          createdAt: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add a user-friendly error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I couldn't process your request at the moment. Please try again in a few seconds.",
        role: 'assistant',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking on a sample prompt
  const handlePromptClick = (prompt: string) => {
    // Don't set the input field - this prevents it from showing twice
    // setInput(prompt);  <-- Remove this line
    
    // Call handleSubmit directly with the prompt
    handleSubmit(undefined, { data: { messages: [{ content: prompt, role: 'user' }] } });
  };

  const [isExpanded, setIsExpanded] = useState(false)
  const [isHeightExpanded, setIsHeightExpanded] = useState(false)
  const [currentHeight, setCurrentHeight] = useState(initialHeight)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Process messages when they change
  useEffect(() => {
    const newProcessedMessages = messages.map((message: Message): ProcessedMessage => {
      if (message.role === 'assistant') {
        // Log the raw message content for debugging
        console.log('Processing assistant message:', message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''));
        
        // First, check if there's a JSON object in the message
        const jsonMatch = message.content.match(/\{[\s\S]*\}/);
        let cleanedContent = message.content;
        
        // If there's a JSON object, remove it from the content
        if (jsonMatch) {
          // Remove the JSON object (and any formatted display of it)
          cleanedContent = message.content.replace(/```json\s*\{[\s\S]*\}\s*```/g, '')  // Remove markdown code blocks
                                         .replace(/\{[\s\S]*\}/g, '')                 // Remove raw JSON
                                         .replace(/\n\s*\n/g, '\n')                    // Remove double newlines
                                         .trim();
        }
        
        // Create an initial message without restaurant data
        const initialProcessedMessage: ProcessedMessage = {
          ...message,
          content: cleanedContent
        };
        
        // Try to parse restaurant data asynchronously
        (async () => {
          try {
            const restaurantData = await parseRestaurantData(message.content);
            if (restaurantData) {
              console.log('Restaurant data parsed successfully:', restaurantData.name);
              // Update the processed messages with restaurant data
              setProcessedMessages(prevProcessedMessages => {
                return prevProcessedMessages.map(msg => {
                  if (msg.id === message.id) {
                    return {
                      ...msg,
                      restaurantRecommendation: restaurantData
                    };
                  }
                  return msg;
                });
              });
            }
          } catch (error) {
            console.error('Error parsing restaurant data:', error);
          }
        })();
        
        return initialProcessedMessage;
      }
      return message;
    });
    
    setProcessedMessages(newProcessedMessages);
  }, [messages]);

  // Log when messages are updated for debugging
  useEffect(() => {
    console.log('Messages updated, count:', messages.length);
    if (messages.length > 0) {
      console.log('Last message role:', messages[messages.length - 1].role);
    }
  }, [messages]);

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Expand width after first chat
  useEffect(() => {
    if (messages.length > 0 && (!isExpanded || !isHeightExpanded)) {
      // Wait for the bot response to be added before expanding
      if (messages.some((msg) => msg.role === "assistant")) {
        setIsExpanded(true)
        setIsHeightExpanded(true)
      }
    }
  }, [messages, isExpanded, isHeightExpanded])

  // Calculate and update height based on isHeightExpanded
  useEffect(() => {
    if (initialHeight) {
      // Extract numeric value and unit
      const match = initialHeight.match(/^(\d+)(.*)$/)
      if (match) {
        const value = Number.parseInt(match[1])
        const unit = match[2] || "px"
        const expandedValue = Math.round(value * 1.5)
        setCurrentHeight(isHeightExpanded ? `${expandedValue}${unit}` : `${value}${unit}`)
      }
    }
  }, [initialHeight, isHeightExpanded])

  // Add new function to handle showing restaurant details when user requests
  const handleShowRestaurantDetails = (restaurantName: string) => {
    setShowRestaurantDetails(restaurantName);
    
    // We don't need to add a user message - the user's request is already in the messages

    // Check if we already have a detail card for this restaurant
    const hasDetailCardForRestaurant = messages.some(msg => 
      msg.role === 'assistant' && 
      msg.content.includes(`details for ${restaurantName}`) 
    );
    
    // Only add a response message if we don't already have one for this restaurant
    if (!hasDetailCardForRestaurant) {
      // Add a response message with the details
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: `Here are the details for ${restaurantName}:`,
        role: 'assistant',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      createdAt: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")

    // Check if this is a request to see details
    const inputLower = input.toLowerCase();
    
    // Enhanced "tell me more" detection
    const isTellMeMore = 
      inputLower.includes('tell me more') || 
      inputLower.includes('more details') || 
      inputLower.includes('more information') || 
      inputLower.includes('know more') ||
      inputLower.includes('learn more') ||
      inputLower.includes('show more') ||
      inputLower.match(/\bmore\b/) !== null;
      
    if (inputLower.includes('details') || inputLower.includes('reservation') || 
        inputLower.includes('show me') || inputLower.includes('tell me about') ||
        (inputLower.includes('yes') && processedMessages.length > 0) ||
        inputLower.includes('share more') || isTellMeMore) {
      
      // Extract restaurant name directly from the user's message
      const restaurantNameMatch = 
        input.match(/details (?:for|about|on) ([^?\.]+)/i) || 
        input.match(/(?:show|tell) me (?:details|more) (?:about|for|on) ([^?\.]+)/i) ||
        input.match(/(?:tell|share) me about ([^?\.]+)/i) ||
        input.match(/(?:share|tell) more (?:details|information) (?:about|for|on) ([^?\.]+)/i) ||
        input.match(/more details (?:about|for|on) ([^?\.]+)/i) ||
        input.match(/share more details about ([^?\.]+)/i);
      
      if (restaurantNameMatch && restaurantNameMatch[1]) {
        const restaurantName = restaurantNameMatch[1].trim();
        handleShowRestaurantDetails(restaurantName);
        return;
      }
      
      // If it's a general "tell me more" request without specifying a restaurant,
      // try to identify the most recently mentioned restaurant
      if (isTellMeMore) {
        // Find the last assistant message with restaurant recommendations
        // First check for ## restaurant headers in the messages
        let lastRestaurantName = null;
        
        // Loop through messages in reverse to find the most recent restaurant mention
        for (let i = processedMessages.length - 1; i >= 0; i--) {
          const msg = processedMessages[i];
          if (msg.role === 'assistant') {
            // Look for restaurant names in markdown headers
            const restaurantMatches = msg.content.match(/##\s+([^\n]+)/g);
            if (restaurantMatches && restaurantMatches.length > 0) {
              // Get the restaurant name from the first ## header
              lastRestaurantName = restaurantMatches[0].replace(/^##\s+/, '').trim();
              break;
            }
            
            // Check for "details for X" format
            const detailsMatch = msg.content.match(/details for ([^:\.]+)[:\.]/i);
            if (detailsMatch && detailsMatch[1]) {
              lastRestaurantName = detailsMatch[1].trim();
              break;
            }
            
            // Look for restaurant recommendations in the processed messages
            if (msg.restaurantRecommendation) {
              lastRestaurantName = msg.restaurantRecommendation.name;
              break;
            }
          }
        }
        
        // If we found a restaurant name, show its details
        if (lastRestaurantName) {
          handleShowRestaurantDetails(lastRestaurantName);
          return;
        }
      }
      
      // Extract restaurant name from the last assistant message that asked about details
      const lastAssistantMessage = processedMessages
        .filter(msg => msg.role === 'assistant')
        .pop();
      
      if (lastAssistantMessage) {
        const content = lastAssistantMessage.content;
        
        // Look for restaurant names in markdown headers
        const restaurantMatches = content.match(/##\s+([^\n]+)/g);
        if (restaurantMatches && restaurantMatches.length > 0) {
          // Get the restaurant name from the first ## header
          let restaurantName = restaurantMatches[0].replace(/^##\s+/, '').trim();
          
          // If user's input includes a restaurant name that matches one of our headers, use that instead
          for (const match of restaurantMatches) {
            const name = match.replace(/^##\s+/, '').trim();
            if (inputLower.includes(name.toLowerCase())) {
              restaurantName = name;
              break;
            }
          }
          
          handleShowRestaurantDetails(restaurantName);
          return;
        }
        
        // If no markdown header, try to find it from the question
        const detailsQuestion = content.match(/details.+for\s+([^?]+)/i);
        if (detailsQuestion && detailsQuestion[1]) {
          const restaurantName = detailsQuestion[1].trim();
          handleShowRestaurantDetails(restaurantName);
          return;
        }
      }
    }

    // Show loading state
    setIsFetching(true)

    try {
      // Call the real API endpoint instead of using simulated response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();

      // Add the assistant response - use content property as our API now returns that
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        // The API now should return { content: "message" } format
        content: data.content || "I apologize, but I'm having trouble processing your request right now.",
        role: 'assistant',
        createdAt: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
      
      // Add a more user-friendly error message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I couldn't process your request at the moment. Please try again in a few seconds.",
        role: 'assistant',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-center w-full">
        <div
          className={`bg-white rounded-xl overflow-hidden shadow-md border-[0.5px] border-gray-200/50 flex flex-col transition-all duration-700 ease-in-out ${
            isExpanded ? "w-[135%]" : "w-full"
          }`}
          style={{ height: currentHeight }}
        >
          {/* Chat and Response Area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
            {processedMessages.length === 0 ? (
              <div className="flex flex-col h-full">
                {/* Welcome message at the top */}
                <div className="text-center text-gray-500 max-w-md mx-auto mt-8 mb-auto">
                  <h3 className="text-xl font-light mb-2">Welcome to ExperienceNYC</h3>
                  <p className="text-sm">
                    Ask me about restaurants, bars, or social experiences in New York City. I can help you find the
                    perfect spot!
                  </p>
                </div>

                {/* Sample Prompts */}
                <div className="w-full max-w-md mx-auto mb-4">
                  <p className="text-xs text-gray-500 text-center mb-3">Try asking:</p>
                  <div className="flex flex-col gap-2">
                    {samplePrompts.map((prompt, index) => (
                      <button
                        key={`prompt-${index}-${prompt.substring(0, 10)}`}
                        onClick={() => handlePromptClick(prompt)}
                        className="flex items-center px-4 py-3 bg-white rounded-lg shadow-sm border-[0.1px] border-gray-200/50 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all text-sm text-gray-600 hover:text-gray-800 text-left"
                      >
                        <MessageSquare className="h-3 w-3 mr-2 text-[#D4AF37] flex-shrink-0" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Chat Messages and Recommendations
              <div className="space-y-4">
                {processedMessages.map((message, messageIndex) => (
                  <div
                    key={`msg-${messageIndex}-${message.id}`}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-[#D4AF37] text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm">
                          {formatMessageContent(message.content)}
                          {/* If this message contains "details for [Restaurant]", show the detail card */}
                          {message.content.toLowerCase().includes("here are the details for") && (
                            <RestaurantDetailCard restaurantName={
                              // Extract the restaurant name from the message
                              message.content.match(/details for ([^:]+):/i)?.[1] || 
                              message.content.match(/details for ([^\.]+)/i)?.[1] ||
                              showRestaurantDetails || 
                              "Restaurant"
                            } />
                          )}
                        </div>
                      ) : (
                        <div className="text-sm">{message.content}</div>
                      )}
                    </div>
                  </div>
                ))}
                {isFetching && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg px-4 py-3 bg-gray-100 text-gray-500 rounded-tl-none">
                      <div className="flex space-x-2 items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleFormSubmit} className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-[#D4AF37]/20 focus-within:border-[#D4AF37]/50 focus-within:shadow-md transition-all duration-300">
              <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden border border-[#D4AF37]/20">
                <div className="w-full h-full bg-cover bg-center" 
                     style={{ backgroundImage: "url('https://randomuser.me/api/portraits/women/33.jpg')" }}>
                </div>
              </div>

              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about NYC dining experiences..."
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 px-0 h-9 text-sm"
              />
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    // Mic button functionality would go here
                    alert("Voice input is not yet implemented");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full"
                  aria-label="Voice input"
                >
                  <Mic className="h-4 w-4" />
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (onReset) onReset();
                    setMessages([]);
                    setInput('');
                    setIsExpanded(false);
                    setIsHeightExpanded(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full"
                  aria-label="Reset chat"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>

                <button
                  type="submit"
                  disabled={isFetching || !input.trim()}
                  className="bg-[#D4AF37] hover:bg-[#BF9F30] text-white transition-colors p-1.5 rounded-full flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
