import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Mail, AlertTriangle, Send, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Promotional email form schema
const promotionalEmailSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  ctaText: z.string().optional(),
  ctaLink: z.string().url("Must be a valid URL").optional(),
});

type PromotionalEmailValues = z.infer<typeof promotionalEmailSchema>;

export function NewsletterBlastForm() {
  const { toast } = useToast();

  // Get subscribers count
  const {
    data: subscribersData,
    isLoading: subscribersLoading,
    isError: subscribersError,
  } = useQuery({
    queryKey: ["/api/newsletter/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/newsletter/stats");
      return await response.json();
    },
  });

  // Form definition
  const form = useForm<PromotionalEmailValues>({
    resolver: zodResolver(promotionalEmailSchema),
    defaultValues: {
      subject: "",
      title: "",
      content: "",
      ctaText: "Shop Now",
      ctaLink: "",
    },
  });

  // Mutation to send promotional email
  const sendEmailMutation = useMutation({
    mutationFn: async (data: PromotionalEmailValues) => {
      const response = await apiRequest("POST", "/api/newsletter/promotional", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Promotional email sent",
        description: "Email has been sent to all subscribed users.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send promotional email",
        description: error.message || "Please check your email content and try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: PromotionalEmailValues) {
    sendEmailMutation.mutate(data);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Send Newsletter</CardTitle>
          {!subscribersLoading && !subscribersError && subscribersData?.count > 0 && (
            <Badge variant="outline">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> 
                {subscribersData.count} Subscribers
              </span>
            </Badge>
          )}
        </div>
        <CardDescription>
          Send a promotional email to all verified newsletter subscribers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {subscribersLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : subscribersError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to fetch subscriber information. Please try again later.
            </AlertDescription>
          </Alert>
        ) : subscribersData?.count === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No subscribers</AlertTitle>
            <AlertDescription>
              There are no verified subscribers to send newsletters to.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="March Sale: 20% Off All Products" {...field} />
                    </FormControl>
                    <FormDescription>
                      Subject line of the email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Spring Promotion" {...field} />
                    </FormControl>
                    <FormDescription>
                      Main headline displayed in the email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={6}
                        placeholder="We're excited to announce our spring promotion with 20% off all products until the end of the month. Visit our shop now to browse our selection of farm-fresh products." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Main content of the email (HTML formatting is supported)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ctaText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Text (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Shop Now" {...field} />
                      </FormControl>
                      <FormDescription>
                        Text for the call-to-action button
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ctaLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Link (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://naturebreedfarm.com/shop" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL for the call-to-action button
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={sendEmailMutation.isPending}
                className="w-full md:w-auto"
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Megaphone className="mr-2 h-4 w-4" />
                    Send Newsletter
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-muted-foreground">
        <p>
          Note: Emails will only be sent to subscribers who have verified their email address.
        </p>
      </CardFooter>
    </Card>
  );
}