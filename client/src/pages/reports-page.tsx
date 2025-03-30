import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import ReportFilters from "@/components/reports/report-filters";
import ReportCharts from "@/components/reports/report-charts";
import { Product, TransactionWithProduct } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Report types
type ReportType = "sales" | "purchases" | "inventory" | "profit";
type ReportPeriod = "month" | "quarter" | "year" | "custom";

export default function ReportsPage() {
  // Report filters state
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("month");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showReport, setShowReport] = useState<boolean>(false);

  // Get data for reports
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: transactions } = useQuery<TransactionWithProduct[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter transactions based on the selected date range
  const filteredTransactions = transactions?.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59); // Include the entire end day
    
    return transactionDate >= start && transactionDate <= end;
  });

  // Filter transactions based on report type
  const reportTransactions = filteredTransactions?.filter(transaction => {
    if (reportType === "sales") return transaction.type === "sale";
    if (reportType === "purchases") return transaction.type === "purchase";
    if (reportType === "profit") return ["sale", "purchase"].includes(transaction.type);
    return true; // For inventory report, include all
  });

  // Calculate summary statistics for the report
  const calculateSummary = () => {
    if (!reportTransactions) return null;
    
    const totalAmount = reportTransactions.reduce((sum, t) => {
      const amount = t.price * t.quantity;
      return t.type === "purchase" ? sum - amount : sum + amount;
    }, 0);
    
    const totalQuantity = reportTransactions.reduce((sum, t) => sum + t.quantity, 0);
    
    const orderCount = reportTransactions.length;
    
    const avgOrderValue = orderCount > 0 ? totalAmount / orderCount : 0;
    
    // Group transactions by product for the sales by product table
    const productSummary = reportTransactions.reduce((acc, t) => {
      const productId = t.productId;
      if (!acc[productId]) {
        acc[productId] = {
          name: t.product.name,
          quantity: 0,
          revenue: 0,
          percentOfTotal: 0
        };
      }
      
      acc[productId].quantity += t.quantity;
      const amount = t.price * t.quantity;
      acc[productId].revenue += t.type === "purchase" ? -amount : amount;
      
      return acc;
    }, {} as Record<number, { name: string; quantity: number; revenue: number; percentOfTotal: number }>);
    
    // Calculate percentage of total for each product
    const absTotal = Math.abs(totalAmount);
    Object.values(productSummary).forEach(product => {
      product.percentOfTotal = absTotal > 0 ? (Math.abs(product.revenue) / absTotal) * 100 : 0;
    });
    
    return {
      totalAmount,
      totalQuantity,
      orderCount,
      avgOrderValue,
      productSummary: Object.values(productSummary).sort((a, b) => b.revenue - a.revenue)
    };
  };

  const summary = calculateSummary();

  // Handle generating report
  const generateReport = () => {
    setShowReport(true);
  };

  // Reset report filters
  const resetFilters = () => {
    setReportType("sales");
    setReportPeriod("month");
    setStartDate(new Date(new Date().setDate(1)).toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setShowReport(false);
  };

  // Get human-readable report title
  const getReportTitle = () => {
    const typeLabel = {
      sales: "Sales",
      purchases: "Purchases",
      inventory: "Inventory",
      profit: "Profit & Loss"
    }[reportType];
    
    const dateRange = (() => {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      const startMonth = startDateObj.toLocaleString('default', { month: 'long' });
      const endMonth = endDateObj.toLocaleString('default', { month: 'long' });
      const startYear = startDateObj.getFullYear();
      const endYear = endDateObj.getFullYear();
      
      if (startMonth === endMonth && startYear === endYear) {
        return `${startMonth} ${startYear}`;
      } else if (startYear === endYear) {
        return `${startMonth} - ${endMonth} ${startYear}`;
      } else {
        return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
      }
    })();
    
    return `${typeLabel} Report (${dateRange})`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow">
          <MobileMenu />
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-500">View and generate farm performance reports</p>
            </div>
            
            {/* Report Filters */}
            <ReportFilters 
              reportType={reportType}
              setReportType={setReportType}
              reportPeriod={reportPeriod}
              setReportPeriod={setReportPeriod}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onGenerateReport={generateReport}
              onResetFilters={resetFilters}
            />
            
            {/* Generated Report */}
            {showReport && summary && (
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-semibold text-lg text-gray-900">{getReportTitle()}</h2>
                  <Button variant="default" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
                
                {/* Charts */}
                <ReportCharts 
                  reportType={reportType}
                  transactions={reportTransactions || []}
                  products={products || []}
                  startDate={startDate}
                  endDate={endDate}
                />
                
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-t border-gray-200">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      {reportType === "sales" ? "Total Sales" : 
                       reportType === "purchases" ? "Total Purchases" : 
                       reportType === "profit" ? "Net Profit" : "Total Value"}
                    </h4>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Total Quantity</h4>
                    <p className="text-2xl font-semibold text-gray-900">{summary.totalQuantity.toFixed(2)} units</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      {reportType === "inventory" ? "Stock Value" : "Avg. Transaction Value"}
                    </h4>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.avgOrderValue)}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Number of Transactions</h4>
                    <p className="text-2xl font-semibold text-gray-900">{summary.orderCount}</p>
                  </div>
                </div>
                
                {/* Detailed Data Table */}
                <div className="p-6 border-t border-gray-200">
                  <h3 className="font-semibold text-base text-gray-900 mb-4">
                    {reportType === "sales" ? "Sales by Product" : 
                     reportType === "purchases" ? "Purchases by Product" : 
                     reportType === "profit" ? "Profit by Product" : "Inventory Value by Product"}
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>
                            {reportType === "sales" ? "Revenue" : 
                             reportType === "purchases" ? "Cost" : 
                             reportType === "profit" ? "Profit/Loss" : "Value"}
                          </TableHead>
                          <TableHead>% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.productSummary.length > 0 ? (
                          summary.productSummary.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{product.quantity.toFixed(2)}</TableCell>
                              <TableCell className={reportType === "profit" && product.revenue < 0 ? "text-red-600" : ""}>
                                {formatCurrency(product.revenue)}
                              </TableCell>
                              <TableCell>{product.percentOfTotal.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                              No data available for the selected period.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
