import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: "primary" | "green" | "yellow" | "brown";
  isLoading?: boolean;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  color = "primary",
  isLoading = false
}: StatsCardProps) {
  // Define background and text colors based on the color prop
  const colorStyles = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary"
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600"
    },
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-700"
    },
    brown: {
      bg: "bg-amber-100",
      text: "text-amber-800"
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={cn("p-3 rounded-full", colorStyles[color].bg, colorStyles[color].text)}>
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <Skeleton className="h-7 w-24 mt-1" />
          ) : (
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
