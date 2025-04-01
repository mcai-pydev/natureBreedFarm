import { formatLocalCurrency } from "@/lib/i18n";
import { useTranslation } from "react-i18next";

interface CurrencyDisplayProps {
  amount: number;
  withSymbol?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  withSymbol = true,
  className = "",
}: CurrencyDisplayProps) {
  const { i18n } = useTranslation();
  
  return (
    <span className={className}>
      {withSymbol 
        ? formatLocalCurrency(amount, i18n.language)
        : new Intl.NumberFormat(i18n.language).format(amount)
      }
    </span>
  );
}