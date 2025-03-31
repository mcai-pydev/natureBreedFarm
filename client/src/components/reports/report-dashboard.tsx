import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product, TransactionWithProduct } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import ReportCharts from "./report-charts";
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  ArrowUp, 
  ArrowDown, 
  DollarSign, 
  ShoppingCart,
  Package,
  TrendingUp,
  CalendarClock
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ReportDashboardProps {
  reportType: string;
  transactions: TransactionWithProduct[];
  products: Product[];
  startDate: string;
  endDate: string;
  summary: {
    totalAmount: number;
    totalQuantity: number;
    orderCount: number;
    avgOrderValue: number;
    productSummary: Array<{
      name: string;
      quantity: number;
      revenue: number;
      percentOfTotal: number;
    }>;
  };
}

export default function ReportDashboard({
  reportType,
  transactions,
  products,
  startDate,
  endDate,
  summary,
}: ReportDashboardProps) {
  // Get icon based on report type
  const getReportTypeIcon = () => {
    switch (reportType) {
      case "sales":
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case "purchases":
        return <ShoppingCart className="h-5 w-5 text-blue-600" />;
      case "inventory":
        return <Package className="h-5 w-5 text-orange-600" />;
      case "profit":
        return <TrendingUp className="h-5 w-5 text-indigo-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get trend information
  const getTrendInfo = () => {
    if (transactions.length < 2) return { trend: 0, isUp: false };
    
    // Split transactions into two halves to compare trends
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const midpoint = Math.floor(sortedTransactions.length / 2);
    const firstHalf = sortedTransactions.slice(0, midpoint);
    const secondHalf = sortedTransactions.slice(midpoint);
    
    let firstValue = 0;
    let secondValue = 0;
    
    if (reportType === "sales") {
      firstValue = firstHalf
        .filter(t => t.type === "sale")
        .reduce((sum, t) => sum + t.price * t.quantity, 0);
      secondValue = secondHalf
        .filter(t => t.type === "sale")
        .reduce((sum, t) => sum + t.price * t.quantity, 0);
    } else if (reportType === "purchases") {
      firstValue = firstHalf
        .filter(t => t.type === "purchase")
        .reduce((sum, t) => sum + t.price * t.quantity, 0);
      secondValue = secondHalf
        .filter(t => t.type === "purchase")
        .reduce((sum, t) => sum + t.price * t.quantity, 0);
    } else if (reportType === "profit") {
      const firstSales = firstHalf
        .filter(t => t.type === "sale")
        .reduce((sum, t) => sum + t.price * t.quantity, 0);
      const firstPurchases = firstHalf
        .filter(t => t.type === "purchase")
        .reduce((sum, t) => sum + t.price * t.quantity, 0);
      firstValue = firstSales - firstPurchases;
      
      const secondSales = secondHalf
        .filter(t => t.type === "sale")
        .reduce((sum, t) => sum + t.price * t.quantity, 0);
      const secondPurchases = secondHalf
        .filter(t => t.type === "purchase")
        .reduce((sum, t) => sum + t.price * t.quantity, 0);
      secondValue = secondSales - secondPurchases;
    }
    
    if (firstValue === 0) return { trend: 100, isUp: secondValue > 0 };
    
    const percentChange = ((secondValue - firstValue) / Math.abs(firstValue)) * 100;
    return {
      trend: Math.abs(Math.round(percentChange)),
      isUp: percentChange > 0,
    };
  };
  
  const { trend, isUp } = getTrendInfo();

  // Get latest transactions
  const latestTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Get transaction badge by type
  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "sale":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Sale</Badge>;
      case "purchase":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Purchase</Badge>;
      case "order":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Order</Badge>;
      case "auction":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Auction</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get title based on report type
  const getTitle = () => {
    switch (reportType) {
      case "sales":
        return "Sales Report";
      case "purchases":
        return "Purchases Report";  
      case "inventory":
        return "Inventory Report";
      case "profit":
        return "Profit & Loss Report";
      default:
        return "Report";
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getReportTypeIcon()}
          <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <CalendarClock className="h-4 w-4 mr-1" />
          <span>
            {formatDate(new Date(startDate))} - {formatDate(new Date(endDate))}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-gray-500">
                {reportType === "sales" ? "Total Sales" : 
                 reportType === "purchases" ? "Total Purchases" : 
                 reportType === "profit" ? "Net Profit" : "Total Inventory Value"}
              </p>
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</h3>
              {trend > 0 && (
                <div className={`flex items-center text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                  {isUp ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                  {trend}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-gray-500">
                {reportType === "inventory" ? "Total Products" : "Transaction Count"}
              </p>
              <ShoppingCart className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-baseline">
              <h3 className="text-2xl font-bold">{summary.orderCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-gray-500">Total Quantity</p>
              <Package className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-baseline">
              <h3 className="text-2xl font-bold">{summary.totalQuantity.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-gray-500">
                {reportType === "inventory" ? "Avg. Price" : "Avg. Transaction Value"}
              </p>
              <BarChart3 className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-baseline">
              <h3 className="text-2xl font-bold">{formatCurrency(summary.avgOrderValue)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <ReportCharts 
        reportType={reportType}
        transactions={transactions}
        products={products}
        startDate={startDate}
        endDate={endDate}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Report Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                {reportType === "sales" 
                  ? `This report shows total sales of ${formatCurrency(summary.totalAmount)} from ${summary.orderCount} transactions between ${formatDate(new Date(startDate))} and ${formatDate(new Date(endDate))}.` 
                  : reportType === "purchases"
                  ? `This report shows total purchases of ${formatCurrency(summary.totalAmount)} from ${summary.orderCount} transactions between ${formatDate(new Date(startDate))} and ${formatDate(new Date(endDate))}.`
                  : reportType === "profit"
                  ? `This report shows a net ${summary.totalAmount >= 0 ? 'profit' : 'loss'} of ${formatCurrency(Math.abs(summary.totalAmount))} from operations between ${formatDate(new Date(startDate))} and ${formatDate(new Date(endDate))}.`
                  : `This report shows the current inventory valued at ${formatCurrency(summary.totalAmount)} with ${summary.totalQuantity.toFixed(2)} units across ${products.filter(p => p.stock > 0).length} products.`
                }
              </p>
              
              <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div>
                    <span className="font-medium text-gray-500">Start Date:</span> {formatDate(new Date(startDate))}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">End Date:</span> {formatDate(new Date(endDate))}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Total Quantity:</span> {summary.totalQuantity.toFixed(2)} units
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Average Value:</span> {formatCurrency(summary.avgOrderValue)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                {reportType === "sales" ? "Sales by Product" : 
                 reportType === "purchases" ? "Purchases by Product" : 
                 reportType === "profit" ? "Profit by Product" : "Inventory Value by Product"}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestTransactions.length > 0 ? (
                    latestTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(new Date(transaction.date))}</TableCell>
                        <TableCell>{transaction.product.name}</TableCell>
                        <TableCell>{getTransactionBadge(transaction.type)}</TableCell>
                        <TableCell>{transaction.quantity} {transaction.product.unit}</TableCell>
                        <TableCell>{formatCurrency(transaction.price * transaction.quantity)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No transactions available for the selected period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}