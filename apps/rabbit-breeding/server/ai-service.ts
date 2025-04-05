import { Animal } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

// Interface for AI Compatibility Advice
export interface CompatibilityAdvice {
  compatible: boolean;
  recommendationScore: number; // 0-100 score
  reasoning: string;
  breedingRecommendations: string[];
  healthConsiderations: string[];
  timestamp: string;
}

// Interface for AI Compatibility Query Logging
interface CompatibilityQuery {
  timestamp: string;
  maleId: number;
  maleAnimalId: string;
  maleName: string;
  femaleId: number;
  femaleAnimalId: string;
  femaleName: string;
  advice: CompatibilityAdvice;
}

const AI_HISTORY_PATH = path.join(process.cwd(), '../../ai-history.json');

/**
 * Get AI-based compatibility advice for a pair of rabbits
 */
export async function getCompatibilityAdvice(male: Animal, female: Animal): Promise<CompatibilityAdvice> {
  try {
    // If OpenAI API key is available, use the API
    if (process.env.OPENAI_API_KEY) {
      return await getAdviceFromOpenAI(male, female);
    } else {
      // Otherwise, use rule-based fallback
      return getFallbackAdvice(male, female);
    }
  } catch (error) {
    console.error('Error getting AI compatibility advice:', error);
    return getFallbackAdvice(male, female);
  }
}

/**
 * Get compatibility advice from OpenAI API
 */
async function getAdviceFromOpenAI(male: Animal, female: Animal): Promise<CompatibilityAdvice> {
  try {
    // Check if OpenAI module is available
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Create a prompt with the rabbit details
    const prompt = `
    I need scientific breeding advice for pairing these two rabbits:
    
    Male Rabbit (${male.animalId}):
    - Name: ${male.name}
    - Breed: ${male.breed || 'Unknown'}
    - Age: ${male.dateOfBirth ? calculateAge(male.dateOfBirth) : 'Unknown'}
    - Health score: ${male.health || 'Unknown'}
    - Weight: ${male.weight || 'Unknown'} kg
    
    Female Rabbit (${female.animalId}):
    - Name: ${female.name}
    - Breed: ${female.breed || 'Unknown'}
    - Age: ${female.dateOfBirth ? calculateAge(female.dateOfBirth) : 'Unknown'}
    - Health score: ${female.health || 'Unknown'}
    - Weight: ${female.weight || 'Unknown'} kg
    
    Additional context:
    - Male parent ID: ${male.parentMaleId || 'Unknown'}
    - Female parent ID: ${female.parentMaleId || 'Unknown'}
    
    Based on scientific breeding principles for rabbits, provide:
    1. Whether they are compatible (yes/no)
    2. A compatibility score from 0-100
    3. Scientific reasoning for the recommendation
    4. 2-3 specific breeding recommendations
    5. 2-3 health considerations for this pairing
    
    Response format should be JSON as follows:
    {
      "compatible": boolean,
      "recommendationScore": number,
      "reasoning": "string",
      "breedingRecommendations": ["string", "string", "string"],
      "healthConsiderations": ["string", "string", "string"]
    }`;

    // Call OpenAI API with JSON format requested
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a scientific rabbit breeding advisor providing evidence-based advice." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const advice = JSON.parse(response.choices[0].message.content);
    
    // Add timestamp
    const result: CompatibilityAdvice = {
      ...advice,
      timestamp: new Date().toISOString()
    };

    // Log the AI query
    logAIQuery(male, female, result);
    
    return result;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return getFallbackAdvice(male, female);
  }
}

/**
 * Get rule-based fallback advice when AI is not available
 */
function getFallbackAdvice(male: Animal, female: Animal): CompatibilityAdvice {
  // Basic compatibility checks
  let compatible = true;
  let recommendationScore = 85; // Default good score
  let reasoning = "Basic compatibility assessment based on standard breeding guidelines.";
  
  // Check if they're the same breed (better for purebred breeding)
  if (male.breed && female.breed && male.breed !== female.breed) {
    recommendationScore -= 10;
    reasoning = "Cross-breeding different rabbit breeds can be done but may affect offspring traits.";
  }
  
  // Check for age compatibility
  const maleAge = male.dateOfBirth ? calculateAge(male.dateOfBirth) : null;
  const femaleAge = female.dateOfBirth ? calculateAge(female.dateOfBirth) : null;
  
  if (maleAge && maleAge < 6) {
    recommendationScore -= 20;
    compatible = false;
    reasoning = "Male rabbit is under 6 months old, which is too young for breeding.";
  }
  
  if (femaleAge && femaleAge < 6) {
    recommendationScore -= 20;
    compatible = false;
    reasoning = "Female rabbit is under 6 months old, which is too young for breeding.";
  }
  
  // Check health scores
  if (male.health && male.health < 70) {
    recommendationScore -= 20;
    compatible = false;
    reasoning = "Male rabbit has below average health score, not recommended for breeding.";
  }
  
  if (female.health && female.health < 70) {
    recommendationScore -= 20;
    compatible = false;
    reasoning = "Female rabbit has below average health score, not recommended for breeding.";
  }
  
  // Standard recommendations
  const breedingRecommendations = [
    "Ensure proper nutrition before and during breeding",
    "Provide a quiet, stress-free environment for breeding",
    "Monitor the health of both rabbits closely"
  ];
  
  // Standard health considerations
  const healthConsiderations = [
    "Check for any signs of respiratory issues before breeding",
    "Ensure both rabbits are parasite-free",
    "Monitor for pregnancy complications in the female"
  ];
  
  // Create the advice object
  const advice: CompatibilityAdvice = {
    compatible,
    recommendationScore: Math.max(0, recommendationScore), // Ensure score is not negative
    reasoning,
    breedingRecommendations,
    healthConsiderations,
    timestamp: new Date().toISOString()
  };
  
  // Log the AI query
  logAIQuery(male, female, advice);
  
  return advice;
}

/**
 * Log AI compatibility query to history file
 */
function logAIQuery(male: Animal, female: Animal, advice: CompatibilityAdvice): void {
  try {
    // Create a query log entry
    const queryLog: CompatibilityQuery = {
      timestamp: new Date().toISOString(),
      maleId: male.id,
      maleAnimalId: male.animalId,
      maleName: male.name,
      femaleId: female.id,
      femaleAnimalId: female.animalId,
      femaleName: female.name,
      advice
    };
    
    // Read existing history if available
    let history: CompatibilityQuery[] = [];
    if (fs.existsSync(AI_HISTORY_PATH)) {
      const historyData = fs.readFileSync(AI_HISTORY_PATH, 'utf-8');
      try {
        history = JSON.parse(historyData);
      } catch (error) {
        console.error('Error parsing AI history file:', error);
      }
    }
    
    // Add new entry to history
    history.unshift(queryLog);
    
    // Keep only the latest 100 entries to manage file size
    if (history.length > 100) {
      history = history.slice(0, 100);
    }
    
    // Write updated history to file
    fs.writeFileSync(AI_HISTORY_PATH, JSON.stringify(history, null, 2));
    
    console.log(`AI compatibility query logged for ${male.name} and ${female.name}`);
  } catch (error) {
    console.error('Error logging AI query:', error);
  }
}

/**
 * Calculate age in months from date of birth
 */
function calculateAge(dateOfBirth: Date | string): number {
  const birthDate = typeof dateOfBirth === 'string' 
    ? new Date(dateOfBirth) 
    : dateOfBirth;
  
  const now = new Date();
  const diffTime = now.getTime() - birthDate.getTime();
  const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average month length
  
  return Math.floor(diffMonths);
}