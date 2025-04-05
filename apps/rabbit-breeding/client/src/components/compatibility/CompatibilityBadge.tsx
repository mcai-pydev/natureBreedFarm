import React from 'react';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

// Types of risk levels
type RiskLevel = 'none' | 'low' | 'medium' | 'high';

/**
 * Get appropriate color class based on risk level
 */
const getRiskLevelClass = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'none':
      return 'bg-green-500';
    case 'low':
      return 'bg-blue-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'high':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Get appropriate icon based on risk level
 */
const getRiskLevelIcon = (riskLevel: RiskLevel) => {
  switch (riskLevel) {
    case 'none':
      return <CheckCircle className="h-3 w-3 mr-1" />;
    case 'low':
      return <CheckCircle className="h-3 w-3 mr-1" />;
    case 'medium':
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    case 'high':
      return <AlertCircle className="h-3 w-3 mr-1" />;
    default:
      return null;
  }
};

/**
 * Get human-readable display text for risk level
 */
const getRiskLevelText = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'none':
      return 'Compatible';
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    default:
      return 'Unknown';
  }
};

interface CompatibilityBadgeProps {
  riskLevel: RiskLevel;
  tooltip?: string;
  showIcon?: boolean;
}

/**
 * A reusable badge component to display breeding compatibility risk levels
 */
export default function CompatibilityBadge({ 
  riskLevel, 
  tooltip, 
  showIcon = true 
}: CompatibilityBadgeProps) {
  const BadgeContent = (
    <Badge className={getRiskLevelClass(riskLevel)}>
      {showIcon && getRiskLevelIcon(riskLevel)}
      {getRiskLevelText(riskLevel)}
    </Badge>
  );

  // If tooltip is provided, wrap the badge in a tooltip
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {BadgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Otherwise, just return the badge
  return BadgeContent;
}