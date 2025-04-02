import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2, Clock, AlertTriangle, Bell, MessageSquare, Package, Users } from 'lucide-react';
import { useResponsive } from '@/contexts/responsive-context';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';

// Notification type definition
export type NotificationType = 'success' | 'warning' | 'info' | 'alert';
export type ActivityType = 'all' | 'comments' | 'orders' | 'system' | 'users';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
  activityType: ActivityType;
}

interface ActivityFeedProps {
  notifications: Notification[];
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  className?: string;
  maxHeight?: string;
  emptyStateProps?: {
    title: string;
    description: string;
  };
}

export function ActivityFeed({
  notifications = [],
  onMarkAllRead,
  onClearAll,
  className,
  maxHeight = "400px",
  emptyStateProps = {
    title: "No notifications yet",
    description: "When you receive notifications, they will appear here",
  }
}: ActivityFeedProps) {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState<ActivityType>('all');
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => 
    activeTab === 'all' || notification.activityType === activeTab
  );
  
  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'alert':
        return <Bell className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };
  
  // Get activity type icon
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'comments':
        return <MessageSquare className="h-4 w-4" />;
      case 'orders':
        return <Package className="h-4 w-4" />;
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'system':
      case 'all':
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex justify-between items-center">
          <span>Activity Feed</span>
          {notifications.length > 0 && (
            <Badge variant="outline" className="ml-2 text-sm">
              {filteredNotifications.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Recent activity and system notifications
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as ActivityType)}>
        <div className="px-4">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">Comments</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab} className="pt-1 pb-1">
          <ScrollArea className={cn("py-1", maxHeight ? `max-h-[${maxHeight}]` : '')}>
            <CardContent className="p-0">
              {filteredNotifications.length > 0 ? (
                <div className="space-y-3 px-4">
                  {filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 rounded-md p-3 transition-colors",
                        notification.read 
                          ? "bg-background hover:bg-muted/40" 
                          : "bg-muted/50 hover:bg-muted/70"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm font-medium leading-none",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8">
                  <EmptyState
                    icon={<Bell />}
                    title={emptyStateProps.title}
                    description={emptyStateProps.description}
                    compact={isMobile}
                  />
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {notifications.length > 0 && (
        <CardFooter className="flex justify-between border-t p-4 pt-3">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={onMarkAllRead}
          >
            Mark all read
          </Button>
          <Button 
            variant="ghost" 
            size={isMobile ? "sm" : "default"}
            onClick={onClearAll}
          >
            Clear all
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}