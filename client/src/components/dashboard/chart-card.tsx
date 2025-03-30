import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Product, TransactionWithProduct } from "@shared/schema";
import Chart from "chart.js/auto";

interface ChartCardProps {
  title: string;
  type: "line" | "doughnut";
  isLoading?: boolean;
  products?: Product[];
  transactions?: TransactionWithProduct[];
}

export default function ChartCard({ 
  title, 
  type, 
  isLoading = false,
  products,
  transactions
}: ChartCardProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Cleanup function to destroy chart instance on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading || !transactions || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Create chart based on type
    if (type === "line") {
      // Generate monthly revenue data for the last 6 months
      const today = new Date();
      const monthlyData = [];
      const labels = [];

      // Get data for the last 6 months
      for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = month.toLocaleString('default', { month: 'short' });
        labels.push(monthName);
        
        // Calculate revenue for this month
        const monthRevenue = transactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === month.getMonth() && 
                  transactionDate.getFullYear() === month.getFullYear() &&
                  t.type === "sale";
          })
          .reduce((sum, t) => sum + (t.price * t.quantity), 0);
          
        monthlyData.push(monthRevenue);
      }

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Revenue',
            data: monthlyData,
            backgroundColor: 'rgba(46, 125, 50, 0.2)',
            borderColor: 'rgba(46, 125, 50, 1)',
            borderWidth: 2,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    } else if (type === "doughnut" && products) {
      // Calculate product distribution data
      const productData = products.map(product => {
        const productTransactions = transactions.filter(t => t.productId === product.id && t.type === "sale");
        const totalSales = productTransactions.reduce((sum, t) => sum + (t.price * t.quantity), 0);
        return {
          name: product.name,
          value: totalSales
        };
      });
      
      // Sort by value and take top 5
      productData.sort((a, b) => b.value - a.value);
      const topProducts = productData.slice(0, 4);
      
      // If there are more than 4 products, add an "Others" category
      if (productData.length > 4) {
        const othersValue = productData.slice(4).reduce((sum, item) => sum + item.value, 0);
        topProducts.push({ name: 'Others', value: othersValue });
      }

      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: topProducts.map(p => p.name),
          datasets: [{
            data: topProducts.map(p => p.value),
            backgroundColor: [
              'rgba(76, 175, 80, 0.7)',
              'rgba(255, 193, 7, 0.7)',
              'rgba(156, 204, 101, 0.7)',
              'rgba(121, 85, 72, 0.7)',
              'rgba(158, 158, 158, 0.7)'
            ],
            borderColor: [
              'rgba(76, 175, 80, 1)',
              'rgba(255, 193, 7, 1)',
              'rgba(156, 204, 101, 1)',
              'rgba(121, 85, 72, 1)',
              'rgba(158, 158, 158, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12
              }
            }
          }
        }
      });
    }
  }, [isLoading, type, products, transactions]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="h-64">
            <canvas ref={chartRef}></canvas>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
