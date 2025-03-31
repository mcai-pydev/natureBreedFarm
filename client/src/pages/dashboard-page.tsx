import { useQuery } from "@tanstack/react-query";
import { Product, Transaction } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, BarChart3, LineChart, Package, ShoppingCart, TrendingUp, TruckIcon } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import LowStockAlerts from "@/components/dashboard/low-stock-alerts";

// Dashboard overview showing farm operation stats
export default function DashboardPage() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState("week");
  
  // Get recent transactions
  const { data: recentTransactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return await response.json();
    }
  });

  // Get farm produce stats
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return await response.json();
    }
  });
  
  // Calculate summary data
  const salesTransactions = recentTransactions?.filter(t => t.type === "sale") || [];
  const totalSales = salesTransactions.reduce((sum, t) => sum + (t.price * t.quantity), 0);
  const purchaseTransactions = recentTransactions?.filter(t => t.type === "purchase") || [];
  const totalPurchases = purchaseTransactions.reduce((sum, t) => sum + (t.price * t.quantity), 0);
  const orderTransactions = recentTransactions?.filter(t => t.type === "order") || [];
  const totalOrders = orderTransactions.reduce((sum, t) => sum + (t.price * t.quantity), 0);
  
  // Prepare chart data for sales trend
  const salesTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
    
    // Sum up sales for this day
    const dayTotal = salesTransactions
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getDate() === date.getDate() && 
               tDate.getMonth() === date.getMonth() && 
               tDate.getFullYear() === date.getFullYear();
      })
      .reduce((sum, t) => sum + (t.price * t.quantity), 0);
      
    return { name: dayStr, value: dayTotal };
  });
  
  // Prepare inventory by category
  const productCategoryData = products ? 
    Object.entries(
      products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";
        if (!acc[category]) acc[category] = 0;
        acc[category] += 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }))
    : [];
    
  // Prepare inventory value chart
  const inventoryValueData = products ? 
    Object.entries(
      products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";
        if (!acc[category]) acc[category] = 0;
        acc[category] += (product.price * product.stock);
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }))
    : [];
  
  // For Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9370DB', '#3CB371', '#B22222', '#4682B4'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'Farm Manager'}!
          </p>
        </div>
        <Link href="/reports">
          <Button className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Reports
          </Button>
        </Link>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              {salesTransactions.length} sales transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orders
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOrders)}</div>
            <p className="text-xs text-muted-foreground">
              {orderTransactions.length} pending orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Purchases
            </CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchases)}</div>
            <p className="text-xs text-muted-foreground">
              {purchaseTransactions.length} purchase transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales - totalPurchases)}</div>
            <p className={`text-xs ${(totalSales - totalPurchases) > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(totalSales - totalPurchases) > 0 ? '+' : ''}{(((totalSales - totalPurchases) / totalPurchases * 100) || 0).toFixed(1)}% from purchases
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main dashboard content */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Daily sales over the past week</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip formatter={(value) => [`${formatCurrency(Number(value))}`, "Sales"]} />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="category" className="md:col-span-1">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Inventory Analysis</CardTitle>
              <TabsList>
                <TabsTrigger value="category">By Category</TabsTrigger>
                <TabsTrigger value="value">By Value</TabsTrigger>
              </TabsList>
            </div>
            <CardDescription>
              Product distribution across farm categories
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <TabsContent value="category" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {productCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Products"]} />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="value" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={inventoryValueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`${formatCurrency(Number(value))}`, "Inventory Value"]} />
                  <Bar dataKey="value" fill="#00C49F" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </TabsContent>
          </CardContent>
        </Tabs>
      </div>
      
      {/* Low stock alerts section */}
      <div className="grid grid-cols-1">
        <LowStockAlerts />
      </div>
      
      {/* Recent transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest activity across the farm</CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingTransactions ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-md animate-pulse">
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-muted rounded"></div>
                      <div className="h-3 w-32 bg-muted rounded"></div>
                    </div>
                    <div className="h-4 w-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map(transaction => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <Badge variant="outline" className={
                            transaction.type === 'sale' ? 'bg-green-100 text-green-800' :
                            transaction.type === 'purchase' ? 'bg-blue-100 text-blue-800' : 
                            transaction.type === 'order' ? 'bg-amber-100 text-amber-800' :
                            'bg-purple-100 text-purple-800'
                          }>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </Badge>
                          {/* Product name would come from joined data in a real app */}
                          {transaction.productId} 
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()} • {transaction.quantity} units
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(transaction.price * transaction.quantity)}
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent transactions found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}