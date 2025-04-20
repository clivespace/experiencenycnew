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
  "What are the best romantic restaurants in Manhattan?",
  "Where can I find authentic Italian food in Little Italy?",
]

interface ProcessedMessage extends Message {
  restaurantRecommendation?: RestaurantRecommendation;
}

function hasRecommendation(message: ProcessedMessage): message is ProcessedMessage & { restaurantRecommendation: RestaurantRecommendation } {
  return message.restaurantRecommendation !== undefined;
}

export default function UnifiedChatInterface({ initialHeight = "400px", onReset }: UnifiedChatInterfaceProps) {
  // Replace useChat with our own state management
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Log for debugging
      console.log('API response:', data);
      
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
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // You could add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking on a sample prompt
  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    handleSubmit(undefined, { data: { messages: [{ content: prompt, role: 'user' }] } });
  };

  const [isExpanded, setIsExpanded] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Process each message to extract restaurant data if present
  const processedMessages = messages.map((message: Message): ProcessedMessage => {
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
      
      const restaurantData = parseRestaurantData(message.content);
      if (restaurantData) {
        console.log('Restaurant data parsed successfully:', restaurantData.name);
        return {
          ...message,
          content: cleanedContent, // Use cleaned content without JSON
          restaurantRecommendation: restaurantData
        };
      }
      
      // Even if no restaurant data was found, return cleaned content
      return {
        ...message,
        content: cleanedContent
      };
    }
    return message;
  });

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
    if (messages.length > 0 && !isExpanded) {
      // Wait for the bot response to be added before expanding
      if (messages.some((msg) => msg.role === "assistant")) {
        setIsExpanded(true)
      }
    }
  }, [messages, isExpanded])

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsExpanded(true);
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-center w-full">
        <div
          className={`bg-white rounded-xl overflow-hidden shadow-md border-[0.5px] border-gray-200/50 flex flex-col transition-all duration-700 ease-in-out ${
            isExpanded ? "w-[135%]" : "w-full"
          }`}
          style={{ height: initialHeight }}
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
                        key={index}
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
                {processedMessages.map((message, index) => (
                  <div key={index}>
                    {/* Message bubble */}
                    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm ${
                          message.role === "user" ? "bg-[#D4AF37]/10 text-gray-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>

                    {/* Restaurant Recommendation */}
                    {hasRecommendation(message) && (
                      <div className="mt-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Restaurant Images Gallery */}
                        <div className="mb-3">
                          {message.restaurantRecommendation.images && message.restaurantRecommendation.images.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1">
                              {message.restaurantRecommendation.images.map((image, index) => (
                                <div key={index} className="relative h-24">
                                  <Image 
                                    src={image} 
                                    alt={`${message.restaurantRecommendation.name} - ${index === 0 ? 'Interior' : index === 1 ? 'Food' : 'Ambiance'}`}
                                    fill
                                    className="object-cover rounded-md"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-24 bg-gray-200 flex items-center justify-center rounded-md">
                              <p className="text-gray-500 text-xs">No images available</p>
                            </div>
                          )}
                        </div>

                        {/* Restaurant Header with Rating */}
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{message.restaurantRecommendation.name}</h3>
                            <p className="text-xs text-gray-600">{message.restaurantRecommendation.cuisine} • {message.restaurantRecommendation.type}</p>
                          </div>
                          <div className="flex items-center">
                            <span className="bg-green-100 text-green-800 text-xs font-medium py-0.5 px-1.5 rounded-md flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="w-3 h-3 mr-0.5 text-yellow-500">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                              </svg>
                              {message.restaurantRecommendation.rating}
                            </span>
                          </div>
                        </div>

                        {/* Restaurant Description */}
                        <p className="text-xs text-gray-700 mb-3">{message.restaurantRecommendation.description}</p>

                        {/* Restaurant Details */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1 text-gray-600 mt-0.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span className="text-xs text-gray-700">{message.restaurantRecommendation.location}</span>
                          </div>
                          <div className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1 text-gray-600 mt-0.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-gray-700">{message.restaurantRecommendation.openHours}</span>
                          </div>
                          <div className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1 text-gray-600 mt-0.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                            <span className="text-xs text-gray-700">{message.restaurantRecommendation.priceRange}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {message.restaurantRecommendation.website && (
                            <a
                              href={message.restaurantRecommendation.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-2 rounded-md text-center transition-colors flex items-center justify-center text-xs"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Make Reservation
                            </a>
                          )}
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(message.restaurantRecommendation.name + ' ' + message.restaurantRecommendation.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-2 rounded-md text-center transition-colors flex items-center justify-center text-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            View on Map
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-4 py-2.5 rounded-lg text-sm bg-gray-100">
                      <span className="animate-pulse">Searching for the perfect spot...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleFormSubmit} className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-[#D4AF37]/20 focus-within:border-[#D4AF37]/50 focus-within:shadow-md transition-all duration-300">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face" 
                  alt="User" 
                />
                <AvatarFallback className="bg-[#D4AF37]/10 text-[#D4AF37]">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>

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
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full"
                  aria-label="Reset chat"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
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
