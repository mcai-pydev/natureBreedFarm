import { OpenAI } from "openai";
import { log } from "./vite";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import * as htmlToText from "html-to-text";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AgricultureKnowledge {
  topic: string;
  content: string;
}

// Hardcoded knowledge base for farm/agriculture topics
const agricultureKnowledgeBase: AgricultureKnowledge[] = [
  {
    topic: "goat-farming",
    content: `Goat Farming Best Practices:
    1. Housing: Provide clean, dry, and well-ventilated shelters with at least 15-20 sq ft per adult goat.
    2. Nutrition: Feed a balanced diet of forage (grass/hay), browse (leaves/shrubs), and concentrates.
    3. Health management: Regular deworming every 3-4 months, vaccination against enterotoxemia and tetanus.
    4. Breeding: Females reach breeding age at 7-10 months; pregnancy lasts 145-155 days.
    5. Common breeds: Boer (meat), Saanen (dairy), Nubian (dual-purpose), Nigerian Dwarf (small dairy).
    6. Water requirements: Clean, fresh water should always be available, about 1-3 gallons per day depending on size.
    7. Common diseases: Pneumonia, enterotoxemia, parasites, foot rot, and CAE (Caprine Arthritis Encephalitis).`
  },
  {
    topic: "fish-farming",
    content: `Fish Farming Best Practices:
    1. Water quality: Maintain pH 6.5-9.0, oxygen levels above 5mg/L, ammonia below 0.02mg/L.
    2. Stocking density: Typically 1-3 kg fish per cubic meter for extensive systems, 15-40 kg/m³ for intensive.
    3. Feeding: Feed 2-5% of body weight daily, adjust based on temperature and fish size.
    4. Common species: Tilapia, catfish, trout, carp, and salmon.
    5. Systems: Pond culture, raceways, recirculating aquaculture systems (RAS), cage culture.
    6. Disease management: Regular monitoring, proper quarantine of new stock, maintaining optimal water conditions.
    7. Harvesting: Typically when fish reach market size, using nets or draining ponds.`
  },
  {
    topic: "duck-farming",
    content: `Duck Farming Best Practices:
    1. Housing: Minimum 4 sq ft per duck indoors, access to outdoor space and swimming water.
    2. Nutrition: Feed 16-20% protein starter feed for ducklings, 14-16% for adults, plus greens.
    3. Water: Ducks need water for drinking and cleaning their bills and eyes; provide water deep enough to submerge their heads.
    4. Common breeds: Pekin (meat), Khaki Campbell (eggs), Indian Runner (eggs), Muscovy (meat).
    5. Egg production: Good laying breeds produce 250-300 eggs annually.
    6. Health: Ducks are generally hardy but watch for niacin deficiency in ducklings, botulism, and parasites.
    7. Predator protection: Secure housing at night against foxes, raccoons, and other predators.`
  },
  {
    topic: "chicken-farming",
    content: `Chicken Farming Best Practices:
    1. Housing: 2-3 sq ft per bird inside coop, 8-10 sq ft per bird in run area.
    2. Feeding: Chicks need starter feed (18-20% protein), layers need layer feed (16-18% protein) plus calcium supplement.
    3. Egg production: Most laying hens begin producing at 5-6 months, averaging 250-300 eggs in first year.
    4. Common breeds: Leghorn (eggs), Rhode Island Red (dual), Cornish Cross (meat), Orpington (dual).
    5. Health management: Regular deworming, vaccination against Marek's disease, Newcastle disease, and infectious bronchitis.
    6. Lighting: Layers need 14-16 hours of light daily for optimal production.
    7. Common issues: Mites, lice, respiratory infections, egg binding.`
  },
  {
    topic: "crop-farming",
    content: `Crop Farming Best Practices:
    1. Soil preparation: Test soil pH and nutrient levels, aim for pH 6.0-7.0 for most crops.
    2. Crop rotation: Rotate crop families to prevent disease buildup and maintain soil health.
    3. Irrigation: Most crops need 1-1.5 inches of water weekly from rain or irrigation.
    4. Pest management: Integrated Pest Management (IPM) combines cultural, biological, and chemical controls.
    5. Fertilization: Apply based on soil tests and crop requirements, typically N-P-K plus micronutrients.
    6. Weed control: Mulching, cultivation, crop rotation, and selective herbicides as needed.
    7. Harvest timing: Crops have specific maturity indicators; harvesting at peak quality maximizes value.`
  },
  {
    topic: "sustainable-farming",
    content: `Sustainable Farming Practices:
    1. Cover cropping: Plant non-cash crops to build soil, prevent erosion, and suppress weeds.
    2. Composting: Convert farm waste into valuable soil amendments.
    3. Polyculture: Growing multiple crops together to increase biodiversity and resilience.
    4. Water conservation: Drip irrigation, rainwater harvesting, and soil moisture monitoring.
    5. Integrated livestock: Animals provide manure for fertilizer and can utilize crop residues.
    6. Reduced tillage: Minimizing soil disturbance preserves soil structure and carbon.
    7. Natural pest control: Encouraging beneficial insects, companion planting, and biological controls.`
  },
  {
    topic: "farm-business",
    content: `Farm Business Management:
    1. Record keeping: Track expenses, income, production data, and labor hours.
    2. Marketing: Direct-to-consumer, wholesale, farmers markets, CSAs, or co-ops.
    3. Value-added products: Processing raw farm products into higher-value items (cheese, preserves, etc.).
    4. Diversification: Multiple revenue streams protect against market/crop failures.
    5. Financial planning: Cash flow projections, enterprise budgets, and long-term investment strategies.
    6. Risk management: Crop insurance, forward contracts, futures/options, and emergency funds.
    7. Labor management: Fair compensation, clear expectations, and proper training.`
  },
  {
    topic: "animal-health",
    content: `Farm Animal Health Management:
    1. Preventive care: Regular vaccinations, parasite control, and health screenings.
    2. Biosecurity: Protocols for visitors, new animals, equipment, and feed to prevent disease introduction.
    3. Nutrition: Species-appropriate, balanced rations that adjust with growth stage and production level.
    4. Housing: Clean, dry, well-ventilated facilities with appropriate space allowances.
    5. Stress reduction: Minimize handling stress, provide environmental enrichment, maintain consistent routines.
    6. Record keeping: Track treatments, vaccinations, and health events for each animal or group.
    7. Working with veterinarians: Establish a relationship before emergencies, follow veterinary protocols.`
  }
];

class OpenAIService {
  private client: OpenAI;
  private isConfigured: boolean = false;

  constructor() {
    // Initialize with API key if available in environment
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isConfigured = true;
      log("OpenAI service initialized", "openai");
    } else {
      log("OpenAI service not configured - missing API key", "openai");
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Get a response from OpenAI for the given messages
   */
  async getCompletion(messages: Message[]): Promise<string> {
    if (!this.isConfigured) {
      return "OpenAI service is not configured. Please provide an API key.";
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0].message.content || "No response generated.";
    } catch (error: any) {
      log(`OpenAI error: ${error.message}`, "openai");
      return `I'm sorry, I encountered an error: ${error.message}`;
    }
  }

  /**
   * Search the knowledge base for relevant information about a topic
   */
  searchKnowledgeBase(query: string): string[] {
    // Convert query to lowercase for case-insensitive matching
    const lowerQuery = query.toLowerCase();
    
    // Search for exact topic matches first
    const exactMatches = agricultureKnowledgeBase.filter(item => 
      item.topic.toLowerCase() === lowerQuery
    );
    
    if (exactMatches.length > 0) {
      return exactMatches.map(item => item.content);
    }
    
    // If no exact matches, look for partial matches in topics and content
    const partialMatches = agricultureKnowledgeBase.filter(item => 
      item.topic.toLowerCase().includes(lowerQuery) || 
      item.content.toLowerCase().includes(lowerQuery)
    );
    
    return partialMatches.map(item => item.content);
  }

  /**
   * Scrape text content from a webpage
   */
  async scrapeWebpage(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove script and style elements
      $('script, style, nav, footer, header, .navigation, .footer, .header, .ads').remove();
      
      // Get text content
      const text = htmlToText.convert($.html(), {
        wordwrap: false,
        selectors: [
          { selector: 'a', options: { ignoreHref: true } },
          { selector: 'img', options: { ignoreHref: true } }
        ]
      });
      
      // Return a clean, truncated version
      return text.substring(0, 3000).trim();
    } catch (error: any) {
      log(`Error scraping webpage: ${error.message}`, "openai");
      return "";
    }
  }
  
  /**
   * Search for relevant information on the web
   */
  async searchWeb(query: string): Promise<string[]> {
    try {
      // For agricultural queries, we can search reliable sources
      const agricultureKeywords = [
        "goat farming", "fish farming", "duck farming", "chicken farming", 
        "poultry", "livestock", "agriculture", "farming practices", "sustainable farming",
        "crop management", "animal health", "farm management"
      ];
      
      // Check if query is related to agriculture
      const isAgricultureQuery = agricultureKeywords.some(keyword => 
        query.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (!isAgricultureQuery) {
        // If not directly related to agriculture, skip web search to stay on topic
        return [];
      }
      
      // A basic web search implementation would connect to a search API
      // For now, we'll hardcode some reliable agricultural URLs based on common topics
      const relevantUrls = [];
      
      if (query.toLowerCase().includes("goat")) {
        relevantUrls.push("https://www.boergoats.com/clean/articles.php?art=960");
      }
      
      if (query.toLowerCase().includes("fish") || query.toLowerCase().includes("aquaculture")) {
        relevantUrls.push("https://www.fao.org/fishery/en/aquaculture/en");
      }
      
      if (query.toLowerCase().includes("duck")) {
        relevantUrls.push("https://www.freedomrangerhatchery.com/duck-care-guide");
      }
      
      if (query.toLowerCase().includes("chicken") || query.toLowerCase().includes("poultry")) {
        relevantUrls.push("https://poultry.extension.org/articles/poultry-management/");
      }
      
      if (query.toLowerCase().includes("crop") || query.toLowerCase().includes("plant")) {
        relevantUrls.push("https://extension.psu.edu/plants-and-crops");
      }
      
      // Only scrape a maximum of 2 URLs to keep responses timely
      const webContent: string[] = [];
      for (const url of relevantUrls.slice(0, 2)) {
        const content = await this.scrapeWebpage(url);
        if (content) {
          webContent.push(`From ${url}:\n${content}`);
        }
      }
      
      return webContent;
    } catch (error: any) {
      log(`Error searching web: ${error.message}`, "openai");
      return [];
    }
  }

  /**
   * Get a farm-specific answer with context from the knowledge base and web search
   */
  async getFarmAnswer(query: string): Promise<string> {
    // Search knowledge base for relevant information
    const relevantContexts = this.searchKnowledgeBase(query);
    
    // Search web for additional relevant information
    const webResults = await this.searchWeb(query);
    
    // Combine local knowledge and web results
    const allContexts = [...relevantContexts, ...webResults];
    
    // Create system message with the context
    const systemMessage = {
      role: "system",
      content: `You are a helpful farm management assistant for Nature Breed Farm. 
      You provide expert advice on agriculture topics including goat farming, fish farming, 
      duck farming, chicken farming, crop farming, sustainable practices, farm business, 
      and animal health. Answer questions concisely and practically.
      
      Here is some relevant information about the query:
      ${allContexts.join('\n\n')}
      
      If you don't know something, admit it clearly rather than making up information.
      If you use information from web sources, attribute the source in your answer by saying "According to [source]..."
      Always focus your response on agricultural best practices and farm management.`
    };
    
    // Create the messages array
    const messages: Message[] = [
      systemMessage,
      { role: "user", content: query }
    ];
    
    // Get completion from OpenAI
    return this.getCompletion(messages);
  }

  /**
   * Fallback response when OpenAI is not available
   */
  getFallbackResponse(query: string): string {
    // Search knowledge base for relevant information
    const relevantContexts = this.searchKnowledgeBase(query);
    
    if (relevantContexts.length > 0) {
      // Return the first relevant content if found
      return `Based on my knowledge: ${relevantContexts[0]}`;
    }
    
    // Default fallback responses if no relevant content is found
    const fallbackResponses = [
      "I don't have specific information on that topic. For accurate advice on this matter, I recommend consulting with a local agricultural extension service or farm advisor.",
      "That's beyond my current knowledge base. For detailed guidance, consider reaching out to Nature Breed Farm's management team directly.",
      "I can't provide specific advice on that topic. For best results with your farm operations, consulting with specialists in that particular area would be beneficial.",
      "I don't have enough information to answer that question confidently. Would you like information about our goat, fish, duck, or chicken farming practices instead?"
    ];
    
    // Return a random fallback response
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

export const openaiService = new OpenAIService();