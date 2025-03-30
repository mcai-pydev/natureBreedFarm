import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Product, TransactionWithProduct } from "@shared/schema";
import Chart from "chart.js/auto";
import { formatCurrency } from "@/lib/utils";

interface ReportChartsProps {
  reportType: string;
  transactions: TransactionWithProduct[];
  products: Product[];
  startDate: string;
  endDate: string;
}

export default function ReportCharts({
  reportType,
  transactions,
  products,
  startDate,
  endDate,
}: ReportChartsProps) {
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartInstance = useRef<Chart | null>(null);
  const barChartInstance = useRef<Chart | null>(null);

  // Helper to generate colors for charts
  const generateColors = (count: number) => {
    const baseColors = [
      ['rgba(76, 175, 80, 0.7)', 'rgba(76, 175, 80, 1)'],
      ['rgba(255, 193, 7, 0.7)', 'rgba(255, 193, 7, 1)'],
      ['rgba(156, 204, 101, 0.7)', 'rgba(156, 204, 101, 1)'],
      ['rgba(121, 85, 72, 0.7)', 'rgba(121, 85, 72, 1)'],
      ['rgba(158, 158, 158, 0.7)', 'rgba(158, 158, 158, 1)'],
    ];
    
    // If we need more colors than we have in the base set, we'll generate random ones
    const backgroundColors = [];
    const borderColors = [];
    
    for (let i = 0; i < count; i++) {
      if (i < baseColors.length) {
        backgroundColors.push(baseColors[i][0]);
        borderColors.push(baseColors[i][1]);
      } else {
        // Generate a random color for extras
        const r = Math.floor(Math.random() * 200) + 55;
        const g = Math.floor(Math.random() * 200) + 55;
        const b = Math.floor(Math.random() * 200) + 55;
        backgroundColors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
        borderColors.push(`rgba(${r}, ${g}, ${b}, 1)`);
      }
    }
    
    return { backgroundColors, borderColors };
  };

  // Initialize and update charts
  useEffect(() => {
    if (transactions.length === 0) return;

    // Clean up on unmount or before re-rendering
    return () => {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (transactions.length === 0) return;

    // Prepare data based on report type
    const prepareData = () => {
      if (reportType === "sales" || reportType === "purchases") {
        // Filter transactions by type
        const filteredTransactions = transactions.filter(
          (t) => t.type === (reportType === "sales" ? "sale" : "purchase")
        );

        // Group transactions by product for pie chart
        const productData = products.map((product) => {
          const productTransactions = filteredTransactions.filter(
            (t) => t.productId === product.id
          );
          const total = productTransactions.reduce(
            (sum, t) => sum + t.price * t.quantity,
            0
          );
          return {
            name: product.name,
            value: total,
          };
        }).filter(item => item.value > 0);

        // Sort by value and get top 5
        productData.sort((a, b) => b.value - a.value);
        const topProducts = productData.slice(0, 5);
        
        // If there are more than 5 products, combine the rest into "Others"
        if (productData.length > 5) {
          const othersValue = productData
            .slice(5)
            .reduce((sum, item) => sum + item.value, 0);
          if (othersValue > 0) {
            topProducts.push({ name: "Others", value: othersValue });
          }
        }

        // Generate colors
        const { backgroundColors, borderColors } = generateColors(topProducts.length);

        // Create pie chart
        const pieCtx = pieChartRef.current?.getContext("2d");
        if (pieCtx && topProducts.length > 0) {
          if (pieChartInstance.current) {
            pieChartInstance.current.destroy();
          }

          pieChartInstance.current = new Chart(pieCtx, {
            type: "pie",
            data: {
              labels: topProducts.map((p) => p.name),
              datasets: [
                {
                  data: topProducts.map((p) => p.value),
                  backgroundColor: backgroundColors,
                  borderColor: borderColors,
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    boxWidth: 12,
                    font: {
                      size: 11,
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const value = context.raw as number;
                      const total = (context.dataset.data as number[]).reduce(
                        (sum: number, val: number) => sum + val,
                        0
                      );
                      const percentage = Math.round((value / total) * 100);
                      return `${formatCurrency(value)} (${percentage}%)`;
                    },
                  },
                },
              },
            },
          });
        }

        // Group transactions by date for trend chart
        const dateRange = [];
        const currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // Create weekly ranges
        while (currentDate <= endDateObj) {
          const weekStart = new Date(currentDate);
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          if (weekEnd > endDateObj) {
            dateRange.push({
              start: new Date(currentDate),
              end: new Date(endDateObj),
              label: `${currentDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${endDateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`,
            });
          } else {
            dateRange.push({
              start: new Date(currentDate),
              end: new Date(weekEnd),
              label: `${weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`,
            });
          }
          
          currentDate.setDate(currentDate.getDate() + 7);
        }
        
        // Calculate totals for each date range
        const trendData = dateRange.map((range) => {
          const rangeTransactions = filteredTransactions.filter((t) => {
            const transactionDate = new Date(t.date);
            return transactionDate >= range.start && transactionDate <= range.end;
          });
          return {
            label: range.label,
            value: rangeTransactions.reduce(
              (sum, t) => sum + t.price * t.quantity,
              0
            ),
          };
        });

        // Create bar chart
        const barCtx = barChartRef.current?.getContext("2d");
        if (barCtx) {
          if (barChartInstance.current) {
            barChartInstance.current.destroy();
          }

          barChartInstance.current = new Chart(barCtx, {
            type: "bar",
            data: {
              labels: trendData.map((d) => d.label),
              datasets: [
                {
                  label: reportType === "sales" ? "Sales" : "Purchases",
                  data: trendData.map((d) => d.value),
                  backgroundColor: "rgba(46, 125, 50, 0.7)",
                  borderColor: "rgba(46, 125, 50, 1)",
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return "$" + value.toString();
                    },
                  },
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      return formatCurrency(context.raw as number);
                    },
                  },
                },
              },
            },
          });
        }
      } else if (reportType === "profit") {
        // Group transactions by product for profit analysis
        const productProfitData = products.map((product) => {
          const salesTransactions = transactions.filter(
            (t) => t.productId === product.id && t.type === "sale"
          );
          const purchaseTransactions = transactions.filter(
            (t) => t.productId === product.id && t.type === "purchase"
          );
          
          const salesTotal = salesTransactions.reduce(
            (sum, t) => sum + t.price * t.quantity,
            0
          );
          const purchaseTotal = purchaseTransactions.reduce(
            (sum, t) => sum + t.price * t.quantity,
            0
          );
          
          const profit = salesTotal - purchaseTotal;
          
          return {
            name: product.name,
            value: profit,
          };
        }).filter(item => item.value !== 0);
        
        // Sort by absolute value for the pie chart
        productProfitData.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
        const topProducts = productProfitData.slice(0, 5);
        
        // Generate colors - green for profit, red for loss
        const backgroundColors = topProducts.map(p => 
          p.value >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'
        );
        const borderColors = topProducts.map(p => 
          p.value >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)'
        );

        // Create pie chart
        const pieCtx = pieChartRef.current?.getContext("2d");
        if (pieCtx && topProducts.length > 0) {
          if (pieChartInstance.current) {
            pieChartInstance.current.destroy();
          }

          pieChartInstance.current = new Chart(pieCtx, {
            type: "pie",
            data: {
              labels: topProducts.map((p) => p.name),
              datasets: [
                {
                  data: topProducts.map((p) => Math.abs(p.value)),
                  backgroundColor: backgroundColors,
                  borderColor: borderColors,
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    boxWidth: 12,
                    font: {
                      size: 11,
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const index = context.dataIndex;
                      const value = topProducts[index].value;
                      const absValue = Math.abs(value);
                      const prefix = value >= 0 ? "Profit: " : "Loss: ";
                      return `${prefix}${formatCurrency(absValue)}`;
                    },
                  },
                },
              },
            },
          });
        }
        
        // Group data by time periods for the trend chart
        const dateRange = [];
        const currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // Create weekly ranges
        while (currentDate <= endDateObj) {
          const weekStart = new Date(currentDate);
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          if (weekEnd > endDateObj) {
            dateRange.push({
              start: new Date(currentDate),
              end: new Date(endDateObj),
              label: `${currentDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${endDateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`,
            });
          } else {
            dateRange.push({
              start: new Date(currentDate),
              end: new Date(weekEnd),
              label: `${weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`,
            });
          }
          
          currentDate.setDate(currentDate.getDate() + 7);
        }
        
        // Calculate profit/loss for each period
        const profitTrendData = dateRange.map((range) => {
          const rangeTransactions = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            return transactionDate >= range.start && transactionDate <= range.end;
          });
          
          const salesTotal = rangeTransactions
            .filter(t => t.type === "sale")
            .reduce((sum, t) => sum + t.price * t.quantity, 0);
          
          const purchaseTotal = rangeTransactions
            .filter(t => t.type === "purchase")
            .reduce((sum, t) => sum + t.price * t.quantity, 0);
          
          return {
            label: range.label,
            value: salesTotal - purchaseTotal,
          };
        });
        
        // Create bar chart
        const barCtx = barChartRef.current?.getContext("2d");
        if (barCtx) {
          if (barChartInstance.current) {
            barChartInstance.current.destroy();
          }

          barChartInstance.current = new Chart(barCtx, {
            type: "bar",
            data: {
              labels: profitTrendData.map((d) => d.label),
              datasets: [
                {
                  label: "Profit/Loss",
                  data: profitTrendData.map((d) => d.value),
                  backgroundColor: profitTrendData.map(d => 
                    d.value >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'
                  ),
                  borderColor: profitTrendData.map(d => 
                    d.value >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)'
                  ),
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return "$" + value.toString();
                    },
                  },
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const value = context.raw as number;
                      return (value >= 0 ? "Profit: " : "Loss: ") + formatCurrency(Math.abs(value));
                    },
                  },
                },
              },
            },
          });
        }
      } else if (reportType === "inventory") {
        // Display current inventory value by product
        const inventoryData = products.map((product) => ({
          name: product.name,
          value: product.price * product.stock,
        })).filter(item => item.value > 0);
        
        // Sort by value and take top items
        inventoryData.sort((a, b) => b.value - a.value);
        const topProducts = inventoryData.slice(0, 5);
        
        // If there are more than 5 products, combine the rest into "Others"
        if (inventoryData.length > 5) {
          const othersValue = inventoryData
            .slice(5)
            .reduce((sum, item) => sum + item.value, 0);
          if (othersValue > 0) {
            topProducts.push({ name: "Others", value: othersValue });
          }
        }
        
        // Generate colors
        const { backgroundColors, borderColors } = generateColors(topProducts.length);
        
        // Create pie chart for inventory value distribution
        const pieCtx = pieChartRef.current?.getContext("2d");
        if (pieCtx && topProducts.length > 0) {
          if (pieChartInstance.current) {
            pieChartInstance.current.destroy();
          }

          pieChartInstance.current = new Chart(pieCtx, {
            type: "pie",
            data: {
              labels: topProducts.map((p) => p.name),
              datasets: [
                {
                  data: topProducts.map((p) => p.value),
                  backgroundColor: backgroundColors,
                  borderColor: borderColors,
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    boxWidth: 12,
                    font: {
                      size: 11,
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const value = context.raw as number;
                      const total = (context.dataset.data as number[]).reduce(
                        (sum: number, val: number) => sum + val,
                        0
                      );
                      const percentage = Math.round((value / total) * 100);
                      return `${formatCurrency(value)} (${percentage}%)`;
                    },
                  },
                },
              },
            },
          });
        }
        
        // Create bar chart for inventory quantity by product
        const quantityData = products
          .filter(p => p.stock > 0)
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 10);
        
        const barCtx = barChartRef.current?.getContext("2d");
        if (barCtx && quantityData.length > 0) {
          if (barChartInstance.current) {
            barChartInstance.current.destroy();
          }

          barChartInstance.current = new Chart(barCtx, {
            type: "bar",
            data: {
              labels: quantityData.map((p) => p.name),
              datasets: [
                {
                  label: "Quantity",
                  data: quantityData.map((p) => p.stock),
                  backgroundColor: "rgba(121, 85, 72, 0.7)",
                  borderColor: "rgba(121, 85, 72, 1)",
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              scales: {
                x: {
                  beginAtZero: true,
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const index = context.dataIndex;
                      const value = context.raw as number;
                      const unit = quantityData[index].unit;
                      return `${value} ${unit}`;
                    },
                  },
                },
              },
            },
          });
        }
      }
    };

    prepareData();
  }, [reportType, transactions, products, startDate, endDate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium text-base text-gray-900 mb-4">
            {reportType === "sales" ? "Sales by Product" : 
             reportType === "purchases" ? "Purchases by Product" : 
             reportType === "profit" ? "Profit by Product" : "Inventory Value by Product"}
          </h3>
          <div className="h-64">
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No data available for the selected period</p>
              </div>
            ) : (
              <canvas ref={pieChartRef}></canvas>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium text-base text-gray-900 mb-4">
            {reportType === "sales" ? "Sales Trend" : 
             reportType === "purchases" ? "Purchases Trend" : 
             reportType === "profit" ? "Profit Trend" : "Inventory Quantity by Product"}
          </h3>
          <div className="h-64">
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No data available for the selected period</p>
              </div>
            ) : (
              <canvas ref={barChartRef}></canvas>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
