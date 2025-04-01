import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "../components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Bell,
  ExternalLink
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Sample chart component
const SampleChart = ({ className }: { className?: string }) => (
  <div className={`w-full h-[200px] ${className}`}>
    <div className="h-full flex items-end">
      {[35, 45, 20, 60, 90, 45, 70, 80, 55, 40, 65, 75].map((height, i) => (
        <div key={i} className="flex-1 mx-1">
          <div
            className="bg-primary/80 hover:bg-primary rounded-t transition-all"
            style={{ height: `${height}%` }}
          ></div>
        </div>
      ))}
    </div>
    <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
      <span>Jan</span>
      <span>Feb</span>
      <span>Mar</span>
      <span>Apr</span>
      <span>May</span>
      <span>Jun</span>
      <span>Jul</span>
      <span>Aug</span>
      <span>Sep</span>
      <span>Oct</span>
      <span>Nov</span>
      <span>Dec</span>
    </div>
  </div>
);

// Sample donut chart component for inventory breakdown
const InventoryDonutChart = () => {
  const data = [
    { name: "Goats", value: 35, color: "bg-blue-500" },
    { name: "Fish", value: 20, color: "bg-green-500" },
    { name: "Ducks", value: 15, color: "bg-yellow-500" },
    { name: "Chickens", value: 25, color: "bg-red-500" },
    { name: "Rabbits", value: 15, color: "bg-purple-500" },
  ];
  
  return (
    <div className="relative h-60 w-60 mx-auto">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-background rounded-full h-24 w-24"></div>
      </div>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {data.map((segment, i) => {
          const startAngle = data.slice(0, i).reduce((sum, d) => sum + d.value, 0) / 100 * 360;
          const endAngle = startAngle + segment.value / 100 * 360;
          
          // Convert angles to radians
          const startRad = (startAngle - 90) * Math.PI / 180;
          const endRad = (endAngle - 90) * Math.PI / 180;
          
          // Calculate the path
          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);
          
          // Determine if the arc should be drawn the long way around
          const largeArcFlag = segment.value > 50 ? 1 : 0;
          
          const pathData = [
            `M 50 50`,
            `L ${x1} ${y1}`,
            `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
          ].join(' ');
          
          return (
            <path
              key={i}
              d={pathData}
              className={segment.color + " hover:opacity-80 transition-opacity cursor-pointer"}
            />
          );
        })}
      </svg>
      {/* Legend */}
      <div className="absolute inset-x-0 -bottom-24 grid grid-cols-3 gap-2 text-xs">
        {data.map((segment, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-full ${segment.color}`}></div>
            <span>{segment.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  // You can fetch actual data here
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  // Sample data for dashboard stats
  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(54231.89),
      change: "+12.5%",
      changeType: "positive",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "New Orders",
      value: "485",
      change: "+5.2%",
      changeType: "positive",
      icon: <Package className="h-4 w-4" />,
    },
    {
      title: "Active Customers",
      value: "1,294",
      change: "+18.7%",
      changeType: "positive",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Avg. Order Value",
      value: formatCurrency(112.34),
      change: "-3.1%",
      changeType: "negative",
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];

  // Sample recent orders data
  const recentOrders = [
    { id: "ORD-7851", customer: "John Smith", date: "2h ago", amount: 135.99, status: "Completed" },
    { id: "ORD-7850", customer: "Sarah Johnson", date: "5h ago", amount: 246.50, status: "Processing" },
    { id: "ORD-7849", customer: "Michael Brown", date: "Yesterday", amount: 189.99, status: "Completed" },
    { id: "ORD-7848", customer: "Emily Davis", date: "Yesterday", amount: 87.25, status: "Shipped" },
    { id: "ORD-7847", customer: "David Wilson", date: "2 days ago", amount: 325.00, status: "Completed" },
  ];

  // Sample recent activities
  const recentActivities = [
    { icon: <Package className="h-4 w-4" />, title: "New order #ORD-7851 received", time: "2 hours ago" },
    { icon: <DollarSign className="h-4 w-4" />, title: "Payment of $246.50 confirmed", time: "5 hours ago" },
    { icon: <Users className="h-4 w-4" />, title: "New customer registered: Sarah Johnson", time: "6 hours ago" },
    { icon: <Bell className="h-4 w-4" />, title: "Low stock alert: Rhode Island Red Chickens", time: "Yesterday" },
    { icon: <Calendar className="h-4 w-4" />, title: "Breeding event scheduled: Angora Rabbits", time: "Yesterday" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back to your farm management dashboard.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>April 2025</span>
            </Button>
            <Button>
              <span>Generate Report</span>
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-full ${
                    stat.changeType === "positive" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-xs font-medium ${
                    stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                  }`}>
                    {stat.change}
                  </span>
                  <ArrowUpRight className={`h-3 w-3 ml-1 ${
                    stat.changeType === "positive" ? "text-green-600" : "text-red-600 rotate-180"
                  }`} />
                  <span className="text-xs text-muted-foreground ml-2">vs last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the current year</CardDescription>
            </CardHeader>
            <CardContent>
              <SampleChart />
            </CardContent>
          </Card>

          {/* Inventory breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Breakdown</CardTitle>
              <CardDescription>Distribution by animal type</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <InventoryDonutChart />
            </CardContent>
          </Card>

          {/* Tabs with recent orders and activities */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <Tabs defaultValue="orders">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <TabsList>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="activities">Activities</TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="orders">
                <TabsContent value="orders" className="m-0">
                  <div className="space-y-6">
                    <div className="rounded-md border">
                      <div className="grid grid-cols-5 p-3 text-sm font-medium border-b bg-muted/50">
                        <div>Order ID</div>
                        <div>Customer</div>
                        <div>Date</div>
                        <div>Amount</div>
                        <div>Status</div>
                      </div>
                      {recentOrders.map((order, i) => (
                        <div 
                          key={i} 
                          className={`grid grid-cols-5 p-3 text-sm ${
                            i !== recentOrders.length - 1 ? "border-b" : ""
                          }`}
                        >
                          <div className="font-medium">{order.id}</div>
                          <div>{order.customer}</div>
                          <div className="text-muted-foreground">{order.date}</div>
                          <div>{formatCurrency(order.amount)}</div>
                          <div>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              order.status === "Completed" ? "bg-green-100 text-green-700" :
                              order.status === "Processing" ? "bg-blue-100 text-blue-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" className="gap-1">
                        <span>View All Orders</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="activities" className="m-0">
                  <div className="space-y-2">
                    {recentActivities.map((activity, i) => (
                      <div 
                        key={i} 
                        className={`flex items-start gap-4 py-3 ${
                          i !== recentActivities.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <div className="mt-1 bg-primary/10 p-2 rounded-full">
                          {activity.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button variant="outline" size="sm" className="gap-1">
                      <span>View All Activities</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick actions card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                <span>Add New Product</span>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                <span>View Customers</span>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>Sales Report</span>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Schedule Breeding</span>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                <span>View Notifications</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}