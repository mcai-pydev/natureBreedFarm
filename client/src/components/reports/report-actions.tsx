import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  LineChart,
  PieChart,
  Table,
  Download,
  FileDown,
  Calendar,
  Monitor,
  Printer,
  Share,
  Mail,
  AreaChart,
  BarChart2,
  Filter,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ShareButtons } from "@/components/social/social-media-links";

// Chart Type Selector Button
export type ChartType = "line" | "bar" | "pie" | "area" | "table";

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (value: ChartType) => void;
  available?: ChartType[];
  size?: "sm" | "default" | "lg";
}

export function ChartTypeSelector({
  value,
  onChange,
  available = ["line", "bar", "pie", "area", "table"],
  size = "default",
}: ChartTypeSelectorProps) {
  const iconMap: Record<ChartType, React.ReactNode> = {
    line: <LineChart className="h-4 w-4" />,
    bar: <BarChart className="h-4 w-4" />,
    pie: <PieChart className="h-4 w-4" />,
    area: <AreaChart className="h-4 w-4" />,
    table: <Table className="h-4 w-4" />,
  };

  const labelMap: Record<ChartType, string> = {
    line: "Line Chart",
    bar: "Bar Chart",
    pie: "Pie Chart",
    area: "Area Chart",
    table: "Table View",
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={size}>
                {iconMap[value]}
                <span className="sr-only">Toggle chart type</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change visualization</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Chart Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {available.map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onChange(type)}
            className={cn(type === value && "bg-muted")}
          >
            <span className="mr-2">{iconMap[type]}</span>
            {labelMap[type]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export Report Button
export type ExportFormat = "pdf" | "csv" | "excel" | "image";

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  formats?: ExportFormat[];
  isLoading?: boolean;
  size?: "sm" | "default" | "lg";
}

export function ExportReportButton({
  onExport,
  formats = ["pdf", "csv", "excel", "image"],
  isLoading = false,
  size = "default",
}: ExportButtonProps) {
  const formatIcons: Record<ExportFormat, React.ReactNode> = {
    pdf: <FileDown className="h-4 w-4" />,
    csv: <FileDown className="h-4 w-4" />,
    excel: <FileDown className="h-4 w-4" />,
    image: <Download className="h-4 w-4" />,
  };

  const formatLabels: Record<ExportFormat, string> = {
    pdf: "Export as PDF",
    csv: "Export as CSV",
    excel: "Export as Excel",
    image: "Save as Image",
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={size} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Export
                {isLoading && <span className="ml-2">...</span>}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export report data</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => onExport(format)}
            disabled={isLoading}
          >
            <span className="mr-2">{formatIcons[format]}</span>
            {formatLabels[format]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Date Range Selector
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangeSelectorProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  maxDate?: Date;
  minDate?: Date;
  size?: "sm" | "default" | "lg";
  showPresets?: boolean;
}

export function DateRangeSelector({
  range,
  onChange,
  maxDate = new Date(),
  minDate,
  size = "default",
  showPresets = true,
}: DateRangeSelectorProps) {
  const btnSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default";

  const getLastNDaysRange = (days: number): DateRange => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return { from, to };
  };

  const presets = [
    { label: "Last 7 days", range: getLastNDaysRange(7) },
    { label: "Last 30 days", range: getLastNDaysRange(30) },
    { label: "Last 90 days", range: getLastNDaysRange(90) },
  ];

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="outline" size={btnSize}>
                <Calendar className="mr-2 h-4 w-4" />
                {range.from ? (
                  range.to ? (
                    <>
                      {format(range.from, "MMM d, yyyy")} -{" "}
                      {format(range.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(range.from, "MMM d, yyyy")
                  )
                ) : (
                  "Select date range"
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Set date range for report</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-auto p-0" align="end">
        {showPresets && (
          <div className="border-b p-3">
            <div className="space-y-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onChange(preset.range)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        <DayPicker
          mode="range"
          defaultMonth={range.from}
          selected={range}
          onSelect={(range) => onChange(range || { from: undefined, to: undefined })}
          numberOfMonths={2}
          disabled={{ after: maxDate, before: minDate }}
        />
      </PopoverContent>
    </Popover>
  );
}

// Print Report Button
interface PrintReportButtonProps {
  onPrint: () => void;
  isLoading?: boolean;
  size?: "sm" | "default" | "lg";
}

export function PrintReportButton({
  onPrint,
  isLoading = false,
  size = "default",
}: PrintReportButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size={size} onClick={onPrint} disabled={isLoading}>
            <Printer className="h-4 w-4 mr-2" />
            Print
            {isLoading && <span className="ml-2">...</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Print report</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Share Report Button
interface ShareReportButtonProps {
  url?: string;
  title?: string;
  description?: string;
  onShare?: (platform: string) => void;
  size?: "sm" | "default" | "lg";
}

export function ShareReportButton({
  url = typeof window !== "undefined" ? window.location.href : "",
  title = "Farm Report",
  description = "Check out this report from Nature Breed Farm",
  onShare,
  size = "default",
}: ShareReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = (platform: string) => {
    onShare?.(platform);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="outline" size={size}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share this report</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-medium">Share Report</h4>
          <ShareButtons
            url={url}
            title={title}
            description={description}
            showLabel
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              navigator.clipboard.writeText(url);
              setIsOpen(false);
            }}
          >
            Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`;
              setIsOpen(false);
            }}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Report Action Bar - combines all the above buttons
interface ReportActionBarProps {
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onExport: (format: ExportFormat) => void;
  onPrint: () => void;
  onShare?: (platform: string) => void;
  availableChartTypes?: ChartType[];
  isExporting?: boolean;
  isPrinting?: boolean;
  className?: string;
}

export function ReportActionBar({
  chartType,
  onChartTypeChange,
  dateRange,
  onDateRangeChange,
  onExport,
  onPrint,
  onShare,
  availableChartTypes,
  isExporting = false,
  isPrinting = false,
  className,
}: ReportActionBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-2">
        <DateRangeSelector range={dateRange} onChange={onDateRangeChange} />
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <ChartTypeSelector
          value={chartType}
          onChange={onChartTypeChange}
          available={availableChartTypes}
        />
        <ExportReportButton onExport={onExport} isLoading={isExporting} />
        <PrintReportButton onPrint={onPrint} isLoading={isPrinting} />
        <ShareReportButton onShare={onShare} />
      </div>
    </div>
  );
}