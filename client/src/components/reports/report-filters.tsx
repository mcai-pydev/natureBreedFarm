import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface ReportFiltersProps {
  reportType: string;
  setReportType: (type: any) => void;
  reportPeriod: string;
  setReportPeriod: (period: any) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onGenerateReport: () => void;
  onResetFilters: () => void;
}

export default function ReportFilters({
  reportType,
  setReportType,
  reportPeriod,
  setReportPeriod,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onGenerateReport,
  onResetFilters,
}: ReportFiltersProps) {
  // Set date range based on selected period
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    switch (reportPeriod) {
      case "month":
        // Current month
        setStartDate(new Date(year, month, 1).toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        break;
      case "quarter":
        // Current quarter
        const quarterMonth = Math.floor(month / 3) * 3;
        setStartDate(new Date(year, quarterMonth, 1).toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        break;
      case "year":
        // Current year
        setStartDate(new Date(year, 0, 1).toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        break;
      case "custom":
        // Custom range - don't change dates
        break;
    }
  }, [reportPeriod]);

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardContent className="pt-6">
        <CardTitle className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          Report Settings
        </CardTitle>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales Report</SelectItem>
                <SelectItem value="purchases">Purchases Report</SelectItem>
                <SelectItem value="inventory">Inventory Report</SelectItem>
                <SelectItem value="profit">Profit & Loss</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="report-period" className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
                max={endDate}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
                min={startDate}
              />
            </div>
          </div>
          
          <div className="md:col-span-4 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onResetFilters}
              className="text-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={onGenerateReport}>
              Generate Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
