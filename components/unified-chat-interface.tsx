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
    cuisine: "Italian",
    location: "New York City",
    priceRange: "$$$",
    rating: 4.8,
    image: "/images/placeholder-restaurant.jpg",
    description: "A cozy spot known for authentic cuisine and excellent service.",
    website: "https://www.google.com/search?q=restaurant+reservation",
    isOpen: true,
    status: "Operational"
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch restaurant data when the component mounts
  useEffect(() => {
    async function fetchRestaurantData() {
      try {
        setIsLoading(true);
        
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
            
            setRestaurant({
              name: found.name,
              cuisine: found.cuisine || "NYC Cuisine",
              location: found.neighborhood || found.location || "New York City",
              priceRange: found.priceRange || "$$$",
              rating: found.rating || 4.5,
              image: found.images?.[0] || found.image || found.imageUrl || "/images/placeholder-restaurant.jpg",
              description: found.description || "A fantastic NYC restaurant.",
              website: websiteUrl,
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
            
            setRestaurant(prev => ({
              ...prev,
              name: restaurantName,
              website: websiteUrl,
              isOpen,
              status
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

  // Determine reservation button style
  const getReservationButton = () => {
    return {
      text: "Make A Reservation",
      class: "flex-1 bg-[#D4AF37] hover:bg-[#BF9F30] text-white py-2 px-3 rounded-md text-center transition-colors flex items-center justify-center text-sm",
      disabled: false
    };
  };
  
  const reservationBtn = getReservationButton();

  return (
    <div className="mt-3 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4AF37]"></div>
        </div>
      ) : (
        <>
          {/* Restaurant image - remove grayscale filter */}
          <div className="w-full h-40 rounded-md overflow-hidden mb-3">
            <img 
              src={restaurant.image} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback image if the restaurant image fails to load
                (e.target as HTMLImageElement).src = '/images/placeholder-restaurant.jpg';
              }}
            />
          </div>
          
          {/* Restaurant Header with Rating - remove status label */}
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {restaurant.name}
              </h3>
              <p className="text-xs text-gray-600">
                {restaurant.cuisine} • {restaurant.priceRange}
              </p>
            </div>
            <div className="flex items-center">
              <span className="bg-green-100 text-green-800 text-xs font-medium py-0.5 px-1.5 rounded-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="w-3 h-3 mr-0.5 text-yellow-500">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                {restaurant.rating}
              </span>
            </div>
          </div>

          {/* Restaurant Description */}
          <p className="text-sm text-gray-700 mb-4">{restaurant.description}</p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className={reservationBtn.class}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
              Make A Reservation
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.name + ' ' + restaurant.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md text-center transition-colors flex items-center justify-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              View on Map
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
    if (inputLower.includes('details') || inputLower.includes('reservation') || 
        inputLower.includes('show me') || inputLower.includes('tell me about') ||
        (inputLower.includes('yes') && processedMessages.length > 0) ||
        inputLower.includes('share more')) {
      
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
