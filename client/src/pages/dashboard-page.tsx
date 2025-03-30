import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import StatsCard from "@/components/dashboard/stats-card";
import ChartCard from "@/components/dashboard/chart-card";
import { useAuth } from "@/hooks/use-auth";
import { 
  Coins, 
  ShoppingBag, 
  Users, 
  CheckCircle 
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionWithProduct } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<TransactionWithProduct[]>({
    queryKey: ["/api/transactions"],
  });

  // Calculate statistics
  const stats = {
    revenue: transactions
      ?.filter(t => t.type === "sale")
      .reduce((sum, t) => sum + (t.price * t.quantity), 0) || 0,
    products: products?.length || 0,
    customers: [...new Set(transactions
      ?.filter(t => t.type === "sale" && t.customer)
      .map(t => t.customer))].length || 0,
    completed: transactions
      ?.filter(t => t.type === "sale" || t.type === "purchase").length || 0
  };

  // Get recent transactions for the table
  const recentTransactions = transactions
    ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5) || [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow">
          <MobileMenu />
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Farm Dashboard</h1>
              <p className="text-gray-500">Welcome back, {user?.name}! Here's an overview of your farm's performance.</p>
            </div>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard 
                title="Revenue (Monthly)"
                value={formatCurrency(stats.revenue)}
                icon={<Coins className="h-6 w-6" />}
                color="primary"
                isLoading={isLoadingTransactions}
              />
              <StatsCard 
                title="Products"
                value={stats.products.toString()}
                icon={<ShoppingBag className="h-6 w-6" />}
                color="yellow"
                isLoading={isLoadingProducts}
              />
              <StatsCard 
                title="Customers"
                value={stats.customers.toString()}
                icon={<Users className="h-6 w-6" />}
                color="brown"
                isLoading={isLoadingTransactions}
              />
              <StatsCard 
                title="Transactions Completed"
                value={stats.completed.toString()}
                icon={<CheckCircle className="h-6 w-6" />}
                color="green"
                isLoading={isLoadingTransactions}
              />
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard 
                title="Monthly Revenue" 
                type="line"
                isLoading={isLoadingTransactions}
                transactions={transactions}
              />
              <ChartCard 
                title="Product Distribution" 
                type="doughnut"
                isLoading={isLoadingProducts || isLoadingTransactions}
                products={products}
                transactions={transactions}
              />
            </div>
            
            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-lg text-gray-900">Recent Transactions</h2>
              </div>
              <div className="overflow-x-auto">
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
                    {isLoadingTransactions ? (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          </TableRow>
                        ))}
                      </>
                    ) : recentTransactions.length > 0 ? (
                      <>
                        {recentTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(new Date(transaction.date))}</TableCell>
                            <TableCell>{transaction.product.name}</TableCell>
                            <TableCell>
                              <Badge variant={transaction.type === "sale" ? "success" : transaction.type === "purchase" ? "destructive" : "outline"}>
                                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{transaction.quantity} {transaction.product.unit}</TableCell>
                            <TableCell>
                              {transaction.type === "purchase" ? "- " : ""}
                              {formatCurrency(transaction.price * transaction.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No transactions found. Create your first transaction.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="p-4 border-t border-gray-200 text-right">
                <Link to="/transactions" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80">
                  View all transactions
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
