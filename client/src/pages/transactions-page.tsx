import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import TransactionForm from "@/components/transactions/transaction-form";
import TransactionTable from "@/components/transactions/transaction-table";
import { Product, Transaction, TransactionWithProduct } from "@shared/schema";

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("");

  // Get products for the form dropdown
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Get all transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<TransactionWithProduct[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter transactions based on selected filters
  const filteredTransactions = transactions?.filter(transaction => {
    // Filter by type
    if (filterType !== "all" && transaction.type !== filterType) {
      return false;
    }
    
    // Filter by month if selected
    if (filterMonth) {
      const transactionDate = new Date(transaction.date);
      const filterDate = new Date(filterMonth);
      
      if (
        transactionDate.getFullYear() !== filterDate.getFullYear() ||
        transactionDate.getMonth() !== filterDate.getMonth()
      ) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow">
          <MobileMenu />
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-500">Record and manage your farm transactions</p>
            </div>
            
            {/* Transaction Form */}
            <TransactionForm products={products || []} />
            
            {/* Transaction History */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="font-semibold text-lg text-gray-900">Transaction History</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Transactions</option>
                    <option value="sale">Sales</option>
                    <option value="purchase">Purchases</option>
                    <option value="order">Orders</option>
                  </select>
                  <input
                    type="month"
                    className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  />
                </div>
              </div>
              
              <TransactionTable 
                transactions={filteredTransactions || []} 
                isLoading={isLoadingTransactions} 
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
