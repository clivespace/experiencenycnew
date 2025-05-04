/**
 * Request Queue System
 * 
 * Provides controlled, staggered execution of API requests to avoid rate limits
 */

import PQueue from 'p-queue';

/**
 * Queue system for API requests to prevent rate limiting
 * This helps to spread out requests over time
 */

// Create a request queue to limit concurrent API requests
// Only allow 1 request per second to avoid hitting rate limits
export const imageRequestQueue = new PQueue({
  concurrency: 1, // Only one request at a time
  interval: 1000, // 1 second between requests
  intervalCap: 1, // Only 1 request per interval
});

// Queue for general API requests with slightly higher capacity
export const apiRequestQueue = new PQueue({
  concurrency: 2, // Allow two concurrent requests
  interval: 1000, // 1 second between intervals
  intervalCap: 2, // Two requests per interval
});

// Define an interface that includes the enqueue method for proper typing
export interface QueueWithEnqueue {
  add: (fn: () => Promise<any>, options?: any) => Promise<any>;
}

/**
 * Queue for batching and staggering API requests
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = false;
  private concurrency: number;
  private delayBetweenRequests: number;
  
  /**
   * Creates a new request queue for controlled API access
   * @param concurrency Maximum number of concurrent requests
   * @param delayMs Delay in ms between each request
   */
  constructor(concurrency = 2, delayMs = 1000) {
    this.concurrency = concurrency;
    this.delayBetweenRequests = delayMs;
  }
  
  /**
   * Adds a request to the queue
   * @param requestFn Function that returns a promise for the request
   * @returns Promise that resolves with the request result
   */
  enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      
      // Start processing if not already running
      if (!this.running) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Process the queue with controlled concurrency and delay
   */
  private async processQueue() {
    if (this.running) return;
    this.running = true;
    
    while (this.queue.length > 0) {
      // Get up to `concurrency` items from the queue
      const batch = this.queue.splice(0, this.concurrency);
      
      // Process this batch concurrently
      try {
        await Promise.all(batch.map(async (requestFn, index) => {
          // Add staggered delay based on position in batch
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, index * this.delayBetweenRequests));
          }
          
          // Execute the request
          try {
            return await requestFn();
          } catch (error) {
            console.error('Error in queued request:', error);
            throw error;
          }
        }));
      } catch (error) {
        // Continue processing the queue even if some requests fail
        console.error('Error in batch processing:', error);
      }
      
      // Add delay between batches if there are more items
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests * this.concurrency));
      }
    }
    
    this.running = false;
  }
}

/**
 * Fetch multiple items in a controlled manner to avoid rate limits
 * @param items Array of items to process
 * @param processFn Function to process each item
 * @returns Promise that resolves with array of results
 */
export async function batchProcess<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  queue: PQueue | RequestQueue = imageRequestQueue
): Promise<R[]> {
  // Enqueue all items
  const promises = items.map(item => {
    if (queue instanceof PQueue) {
      return queue.add(() => processFn(item)) as Promise<R>;
    } else {
      return queue.enqueue(() => processFn(item));
    }
  });
  
  // Wait for all to complete
  return Promise.all(promises);
} 