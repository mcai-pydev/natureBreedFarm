import { useEffect, useState } from "react";
import { Leaf, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

interface EcoTip {
  id: number;
  title: string;
  description: string;
  icon: "leaf" | "info";
}

const ecoTips: EcoTip[] = [
  {
    id: 1,
    title: "Compost Your Packaging",
    description: "Many of our packaging materials are compostable! Add them to your compost pile to reduce waste and create nutrient-rich soil for your garden.",
    icon: "leaf"
  },
  {
    id: 2,
    title: "Save Seeds For Next Season",
    description: "Our produce contains seeds that can be saved for planting. Dry them thoroughly and store in a cool, dark place for your next growing season.",
    icon: "leaf"
  },
  {
    id: 3,
    title: "Create a Food Scrap Garden",
    description: "Some vegetable scraps like carrot tops and lettuce bases can be regrown in water. Place them in a shallow dish and watch them sprout new growth!",
    icon: "info"
  },
  {
    id: 4,
    title: "Sustainable Water Usage",
    description: "Collect rainwater in barrels to water your garden. This conserves tap water and provides plants with natural, chemical-free hydration.",
    icon: "leaf"
  },
  {
    id: 5,
    title: "Support Local Pollinators",
    description: "Plant native wildflowers near your garden to attract bees and butterflies. These pollinators help increase crop yields and promote biodiversity.",
    icon: "leaf"
  },
  {
    id: 6,
    title: "Crop Rotation Benefits",
    description: "Rotating your crops each season helps maintain soil health and prevents pest buildup. Try alternating between root crops, leafy greens, and fruiting plants.",
    icon: "info"
  }
];

export function EcoTips() {
  const { t } = useTranslation();
  const [tip, setTip] = useState<EcoTip | null>(null);
  
  useEffect(() => {
    // Select a random tip
    const randomTip = ecoTips[Math.floor(Math.random() * ecoTips.length)];
    setTip(randomTip);
  }, []);
  
  if (!tip) return null;
  
  return (
    <Card className="w-full mt-8 border-green-100 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 dark:bg-green-800/30 p-2 rounded-full mt-1">
            {tip.icon === "leaf" ? (
              <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Info className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-sm text-green-800 dark:text-green-300">
              {t(`shop.ecoTips.${tip.id}.title`) || tip.title}
            </h3>
            <p className="text-sm text-green-700/90 dark:text-green-400/90 mt-1">
              {t(`shop.ecoTips.${tip.id}.description`) || tip.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}