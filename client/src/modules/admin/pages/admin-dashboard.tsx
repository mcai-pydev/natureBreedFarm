import React, { useState } from 'react';
import { AdminLayout } from '../components/admin-layout';
import { ResponsiveContainer } from '@/components/layout/responsive-container';
import { useResponsiveGrid } from '@/hooks/use-responsive-grid';
import { useResponsive } from '@/contexts/responsive-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { PullToRefresh } from '@/components/layout/pull-to-refresh';
import { SwipeableContainer } from '@/components/layout/swipeable-container';
import { CollapsibleSection, CollapsibleGroup } from '@/components/layout/collapsible-section';
import { StickyActionBar, ActionBarButtonsContainer } from '@/components/navigation/sticky-action-bar';
import { EmptyState, LoadingState } from '@/components/ui/empty-state';
import { ActivityFeed } from '@/components/notifications/activity-feed';
import {
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart,
  Activity,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  Filter,
  Download,
  PieChart,
  BarChart,
  ListPlus,
  Bell
} from 'lucide-react';

function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'increase', 
  icon: Icon
}: { 
  title: string; 
  value: string; 
  change: string; 
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ElementType;
}) {
  const { isMobile } = useResponsive();
  
  const changeColor = changeType === 'increase' 
    ? 'text-green-500' 
    : changeType === 'decrease' 
      ? 'text-red-500' 
      : 'text-muted-foreground';
  
  const ChangeIcon = changeType === 'increase' 
    ? ArrowUpRight 
    : changeType === 'decrease' 
      ? ArrowDownRight 
      : TrendingUp;
  
  // Mobile optimized version with horizontal layout and better touch targets
  if (isMobile) {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-stretch">
          <div className={`w-2 ${changeType === 'increase' ? 'bg-green-500' : changeType === 'decrease' ? 'bg-red-500' : 'bg-blue-500'}`} />
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">{title}</p>
              </div>
              <div className={`flex items-center text-xs ${changeColor} bg-muted/50 rounded-full px-2 py-1`}>
                <ChangeIcon className="mr-1 h-3 w-3" />
                {change}
              </div>
            </div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        </div>
      </Card>
    );
  }
  
  // Desktop version
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs ${changeColor}`}>
          <ChangeIcon className="mr-1 h-3 w-3" />
          {change}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Filter Chip component
interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

function FilterChip({ label, active = false, onClick, icon }: FilterChipProps) {
  return (
    <button
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        transition-colors whitespace-nowrap
        ${active 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
        }
      `}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function RecentSalesItem({ 
  name, 
  email, 
  amount 
}: { 
  name: string; 
  email: string; 
  amount: string;
}) {
  return (
    <div className="flex items-center py-3">
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{name}</p>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>
      <div className="font-medium">{amount}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { isMobile, isTablet } = useResponsive();
  const ResponsiveGrid = useResponsiveGrid();
  
  // State for the filter chips
  const [activeTimeFilter, setActiveTimeFilter] = useState('today');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);
  
  // Filter data definitions
  const timeFilterOptions = [
    { id: 'today', label: t('Today'), icon: null },
    { id: 'week', label: t('This Week'), icon: null },
    { id: 'month', label: t('This Month'), icon: null },
    { id: 'year', label: t('This Year'), icon: null },
  ];
  
  const statusFilterOptions = [
    { id: 'all', label: t('All Status'), icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'active', label: t('Active'), icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: 'pending', label: t('Pending'), icon: <Package className="h-3.5 w-3.5" /> },
  ];
  
  // Handle refresh action
  const handleRefresh = async () => {
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Dashboard refreshed');
  };
  
  return (
    <AdminLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 pb-20"> {/* Added padding at bottom for sticky bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">{t('Dashboard')}</h2>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Button variant="outline">{t('Download')}</Button>
                <Button>{t('Add New')}</Button>
              </div>
            )}
          </div>
          
          {/* Quick Filter Section */}
          <div className="bg-card rounded-lg p-3 border shadow-sm">
            <div className="flex flex-col gap-3">
              {/* Time range filters */}
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-2">
                  {timeFilterOptions.map(option => (
                    <FilterChip 
                      key={option.id}
                      label={option.label}
                      icon={option.icon}
                      active={activeTimeFilter === option.id}
                      onClick={() => setActiveTimeFilter(option.id)}
                    />
                  ))}
                </div>
              </div>
              
              {/* Status filters */}
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-2">
                  {statusFilterOptions.map(option => (
                    <FilterChip 
                      key={option.id}
                      label={option.label}
                      icon={option.icon}
                      active={activeStatusFilter === option.id}
                      onClick={() => setActiveStatusFilter(
                        activeStatusFilter === option.id ? null : option.id
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full overflow-x-auto flex-nowrap">
              <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
              <TabsTrigger value="analytics">{t('Analytics')}</TabsTrigger>
              <TabsTrigger value="reports">{t('Reports')}</TabsTrigger>
              <TabsTrigger value="notifications">{t('Notifications')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards - Using ResponsiveGrid */}
              <ResponsiveGrid 
                mobileColumns={1} 
                tabletColumns={2} 
                desktopColumns={4} 
                gap="md"
              >
                <StatCard 
                  title={t('Total Revenue')} 
                  value="$45,231.89" 
                  change="+20.1% from last month" 
                  changeType="increase"
                  icon={DollarSign} 
                />
                <StatCard 
                  title={t('New Customers')} 
                  value="117" 
                  change="+5.4% from last month" 
                  changeType="increase"
                  icon={Users} 
                />
                <StatCard 
                  title={t('Products Sold')} 
                  value="573" 
                  change="+12.8% from last month" 
                  changeType="increase"
                  icon={Package} 
                />
                <StatCard 
                  title={t('Active Orders')} 
                  value="24" 
                  change="-2.5% from last month" 
                  changeType="decrease"
                  icon={ShoppingCart} 
                />
              </ResponsiveGrid>
              
              {/* Revenue and Recent Sales - Using SwipeableContainer for mobile */}
              {isMobile ? (
                <SwipeableContainer
                  showIndicator={true}
                  showArrows={false}
                  className="min-h-[400px]"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{t('Revenue Over Time')}</CardTitle>
                      <CardDescription>
                        {t('Daily revenue for the past 30 days')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <EmptyState
                        icon={<BarChart />}
                        title={t('Revenue Trends')}
                        description={t('Your revenue data will be visualized here')}
                        compact={true}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{t('Recent Sales')}</CardTitle>
                      <CardDescription>
                        {t('You made 30 sales today')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RecentSalesItem 
                        name="Adamu Ibrahim" 
                        email="adamu@example.com" 
                        amount="$250.00" 
                      />
                      <RecentSalesItem 
                        name="Chinwe Okafor" 
                        email="chinwe@example.com" 
                        amount="$150.00" 
                      />
                      <RecentSalesItem 
                        name="Mohammed Ali" 
                        email="ali@example.com" 
                        amount="$350.00" 
                      />
                      <RecentSalesItem 
                        name="Sarah Johnson" 
                        email="sarah@example.com" 
                        amount="$450.00" 
                      />
                      <RecentSalesItem 
                        name="John Mutua" 
                        email="john@example.com" 
                        amount="$550.00" 
                      />
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        {t('View All')}
                      </Button>
                    </CardFooter>
                  </Card>
                </SwipeableContainer>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  <Card className="md:col-span-4">
                    <CardHeader>
                      <CardTitle>{t('Revenue Over Time')}</CardTitle>
                      <CardDescription>
                        {t('Daily revenue for the past 30 days')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <EmptyState
                        icon={<BarChart />}
                        title={t('Revenue Analytics')}
                        description={t('Your revenue data will be visualized here')}
                        compact={false}
                      />
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-3">
                    <CardHeader>
                      <CardTitle>{t('Recent Sales')}</CardTitle>
                      <CardDescription>
                        {t('You made 30 sales today')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RecentSalesItem 
                        name="Adamu Ibrahim" 
                        email="adamu@example.com" 
                        amount="$250.00" 
                      />
                      <RecentSalesItem 
                        name="Chinwe Okafor" 
                        email="chinwe@example.com" 
                        amount="$150.00" 
                      />
                      <RecentSalesItem 
                        name="Mohammed Ali" 
                        email="ali@example.com" 
                        amount="$350.00" 
                      />
                      <RecentSalesItem 
                        name="Sarah Johnson" 
                        email="sarah@example.com" 
                        amount="$450.00" 
                      />
                      <RecentSalesItem 
                        name="John Mutua" 
                        email="john@example.com" 
                        amount="$550.00" 
                      />
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        {t('View All')}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
              
              {/* Product and Inventory Cards - Using CollapsibleSection on mobile */}
              {isMobile ? (
                <CollapsibleGroup>
                  <CollapsibleSection 
                    title={t('Inventory Status')}
                    defaultOpen={true}
                    icon={<Package className="h-4 w-4" />}
                  >
                    <div className="h-[250px] flex items-center justify-center border-2 border-dashed rounded-md">
                      <div className="text-muted-foreground">
                        {t('Inventory chart would be displayed here')}
                      </div>
                    </div>
                  </CollapsibleSection>
                  
                  <CollapsibleSection
                    title={t('Popular Products')}
                    icon={<Activity className="h-4 w-4" />}
                  >
                    <div className="h-[250px] flex items-center justify-center border-2 border-dashed rounded-md">
                      <div className="text-muted-foreground">
                        {t('Product chart would be displayed here')}
                      </div>
                    </div>
                  </CollapsibleSection>
                </CollapsibleGroup>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('Inventory Status')}</CardTitle>
                      <CardDescription>
                        {t('Current stock levels by category')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md">
                      <div className="text-muted-foreground">
                        {t('Inventory chart would be displayed here')}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('Popular Products')}</CardTitle>
                      <CardDescription>
                        {t('Most sold products this month')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md">
                      <div className="text-muted-foreground">
                        {t('Product chart would be displayed here')}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analytics" className="h-[400px]">
              <EmptyState
                icon={<BarChart />}
                title={t('Analytics')}
                description={t('View detailed farm performance metrics and trends')}
                action={{
                  label: t('Generate Analytics'),
                  onClick: () => console.log('Generate analytics clicked')
                }}
                compact={true}
              />
            </TabsContent>
            
            <TabsContent value="reports" className="h-[400px]">
              <EmptyState
                icon={<PieChart />}
                title={t('Reports')}
                description={t('Create custom reports to track farm performance')}
                action={{
                  label: t('Create Report'),
                  onClick: () => console.log('Create report clicked')
                }}
                compact={true}
              />
            </TabsContent>
            
            <TabsContent value="notifications" className="min-h-[400px]">
              {/* Activity Feed Component */}
              <ActivityFeed 
                notifications={[
                  {
                    id: '1',
                    title: 'New Order Received',
                    message: 'You received a new order for 5 bags of feed',
                    time: '2 minutes ago',
                    read: false,
                    type: 'success',
                    activityType: 'orders'
                  },
                  {
                    id: '2',
                    title: 'Payment Successful',
                    message: 'Payment of $120.00 was received from John Mutua',
                    time: '45 minutes ago',
                    read: false,
                    type: 'success',
                    activityType: 'orders'
                  },
                  {
                    id: '3',
                    title: 'Inventory Alert',
                    message: 'Goat feed is running low (5 units remaining)',
                    time: '3 hours ago',
                    read: true,
                    type: 'warning',
                    activityType: 'system'
                  },
                  {
                    id: '4',
                    title: 'New Comment',
                    message: 'Sarah left a comment on your last post',
                    time: '1 day ago',
                    read: true,
                    type: 'info',
                    activityType: 'comments'
                  },
                  {
                    id: '5',
                    title: 'System Update',
                    message: 'The system will undergo maintenance in 2 days',
                    time: '2 days ago',
                    read: true,
                    type: 'info',
                    activityType: 'system'
                  }
                ]}
                onMarkAllRead={() => console.log('Marked all as read')}
                onClearAll={() => console.log('Cleared all notifications')}
                maxHeight={isMobile ? "300px" : "400px"}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PullToRefresh>
      
      {/* Sticky action bar - visible only on mobile */}
      {isMobile && (
        <StickyActionBar position="bottom" showShadow>
          <ActionBarButtonsContainer spaced>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="ml-auto"
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('Add New')}
            </Button>
          </ActionBarButtonsContainer>
        </StickyActionBar>
      )}
    </AdminLayout>
  );
}