import { Animal } from '@shared/schema';

export interface ParentCompatibilityResult {
  compatible: boolean;
  reason?: string;
  riskLevel?: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Validates if two rabbits can be safely paired for breeding
 * by checking for genetic relationships that could lead to inbreeding
 */
export function validatePairing(male: Animal, female: Animal): ParentCompatibilityResult {
  // Basic validation - can't breed the same animal with itself
  if (male.id === female.id) {
    return {
      compatible: false,
      reason: 'Cannot breed an animal with itself',
      riskLevel: 'high'
    };
  }

  // Check for direct parent-child relationship (first degree relatives)
  if (male.id === female.parentMaleId || female.id === male.parentFemaleId) {
    return {
      compatible: false,
      reason: 'Parent-child breeding is not allowed due to high inbreeding risk',
      riskLevel: 'high'
    };
  }

  // Check if they're siblings (same parents)
  if (male.parentMaleId && female.parentMaleId && male.parentMaleId === female.parentMaleId) {
    // Full siblings
    if (male.parentFemaleId && female.parentFemaleId && male.parentFemaleId === female.parentFemaleId) {
      return {
        compatible: false,
        reason: 'Siblings breeding is not allowed due to high inbreeding risk',
        riskLevel: 'high'
      };
    }
    
    // Half siblings (same father, different mother)
    return {
      compatible: false,
      reason: 'Half-siblings breeding is not allowed due to moderate inbreeding risk',
      riskLevel: 'high'
    };
  }

  // Check if they're half-siblings from maternal side
  if (male.parentFemaleId && female.parentFemaleId && male.parentFemaleId === female.parentFemaleId) {
    return {
      compatible: false,
      reason: 'Half-siblings breeding is not allowed due to moderate inbreeding risk',
      riskLevel: 'high'
    };
  }

  // Check for shared ancestry if available
  if (Array.isArray(male.ancestry) && Array.isArray(female.ancestry) && 
      male.ancestry.length > 0 && female.ancestry.length > 0) {
    
    // Check for shared ancestors
    const sharedAncestors = male.ancestry.filter(maleAncestor => 
      female.ancestry && female.ancestry.includes(maleAncestor)
    );
    
    if (sharedAncestors.length > 0) {
      return {
        compatible: false,
        reason: `Shared ancestry detected: ${sharedAncestors.join(', ')}. This increases inbreeding risk.`,
        riskLevel: 'medium'
      };
    }
  }

  // Passed all checks
  return {
    compatible: true,
    riskLevel: 'none'
  };
}

/**
 * Asynchronous version that calls the API to verify compatibility
 * Can be extended to include more complex checks in the future
 */
export async function checkParentCompatibilityApi(
  maleId: number,
  femaleId: number
): Promise<ParentCompatibilityResult> {
  try {
    const response = await fetch(`/api/breeding/compatibility-check?maleId=${maleId}&femaleId=${femaleId}`);
    if (!response.ok) {
      throw new Error('Failed to check compatibility');
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking breeding compatibility:', error);
    return {
      compatible: false,
      reason: 'Error checking compatibility. Please try again.',
      riskLevel: 'high'
    };
  }
}