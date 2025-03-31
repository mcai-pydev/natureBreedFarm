import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Check, X, Loader2, Search, Users, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Type for newsletter subscriber from the shared schema
interface NewsletterSubscriber {
  id: number;
  email: string;
  name: string | null;
  subscribed: boolean;
  verified: boolean;
  createdAt: string;
}

export function NewsletterSubscriberList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Get all newsletter subscribers
  const {
    data: subscribers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/newsletter"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/newsletter");
      return await response.json();
    },
  });

  // Filter subscribers based on search term
  const filteredSubscribers = React.useMemo(() => {
    if (!subscribers) return [];
    return subscribers.filter((subscriber: NewsletterSubscriber) => {
      return (
        subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subscriber.name && 
          subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [subscribers, searchTerm]);

  // Mutation to update subscription status
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({
      id,
      subscribed,
    }: {
      id: number;
      subscribed: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/newsletter/${id}`,
        { subscribed }
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter"] });
      toast({
        title: "Subscription updated",
        description: "Subscriber status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle toggling subscription status
  const handleToggleSubscription = (id: number, currentStatus: boolean) => {
    updateSubscriptionMutation.mutate({
      id,
      subscribed: !currentStatus,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Newsletter Subscribers</CardTitle>
            <CardDescription>
              Manage your newsletter subscribers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscribers..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive">
            Failed to load subscribers. Please try again.
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No matching subscribers found." : "No subscribers yet."}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]">Verified</TableHead>
                  <TableHead className="w-[100px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber: NewsletterSubscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>{subscriber.name || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={subscriber.subscribed ? "default" : "secondary"}
                      >
                        {subscriber.subscribed ? "Subscribed" : "Unsubscribed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {subscriber.verified ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={subscriber.subscribed ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleSubscription(
                          subscriber.id,
                          subscriber.subscribed
                        )}
                        disabled={updateSubscriptionMutation.isPending}
                      >
                        {updateSubscriptionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : subscriber.subscribed ? (
                          "Unsubscribe"
                        ) : (
                          "Subscribe"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {filteredSubscribers.length} {filteredSubscribers.length === 1 ? "subscriber" : "subscribers"}
            {searchTerm && " (filtered)"}
          </span>
        </div>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>
            {subscribers?.filter((s: NewsletterSubscriber) => s.verified).length} verified
          </span>
          <span>•</span>
          <span>
            {subscribers?.filter((s: NewsletterSubscriber) => s.subscribed).length} active
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}