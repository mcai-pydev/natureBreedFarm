import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { newsletterFormSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

type NewsletterFormValues = z.infer<typeof newsletterFormSchema>;

export function NewsletterForm() {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  
  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: {
      email: "",
      name: ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: NewsletterFormValues) => {
      const res = await apiRequest("POST", "/api/newsletter/subscribe", data);
      return await res.json();
    },
    onSuccess: (data) => {
      // Check if verification is needed (normal flow)
      if (data.verificationSent) {
        setVerificationNeeded(true);
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox to confirm your subscription.",
        });
      } 
      // Email service unavailable but subscription recorded
      else if (data.serviceUnavailable) {
        setServiceUnavailable(true);
        setIsSubscribed(true);
        toast({
          title: "Subscription Recorded",
          description: "Your subscription was recorded, but the verification email could not be sent due to service unavailability.",
        });
      } 
      // Default success case (shouldn't normally happen with verification flow)
      else {
        setIsSubscribed(true);
        toast({
          title: "Successfully subscribed!",
          description: "Thank you for subscribing to our newsletter.",
        });
      }
      form.reset();
    },
    onError: (error: any) => {
      // Email service unavailable with 503 status
      if (error.status === 503 && error.data?.serviceUnavailable) {
        setServiceUnavailable(true);
        setIsSubscribed(true);
        toast({
          title: "Subscription Recorded",
          description: error.data.message || "Your subscription was recorded, but the verification email could not be sent.",
        });
        form.reset();
      } else {
        toast({
          title: "Subscription failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  function onSubmit(data: NewsletterFormValues) {
    mutation.mutate(data);
  }

  // Different success/notification states
  if (verificationNeeded) {
    return (
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <h3 className="text-primary font-medium mb-2">Please verify your email</h3>
        <p className="text-sm text-gray-600">
          We've sent a verification link to your email address. 
          Please check your inbox and click the link to confirm your subscription.
        </p>
      </div>
    );
  }
  
  if (isSubscribed) {
    return (
      <div className={`${serviceUnavailable ? 'bg-yellow-50' : 'bg-green-50'} rounded-lg p-4 text-center`}>
        <h3 className="text-primary font-medium mb-2">Thank you for subscribing!</h3>
        <p className="text-sm text-gray-600">
          {serviceUnavailable 
            ? "Your subscription has been recorded, but we couldn't send a verification email due to technical issues. Our team will contact you soon." 
            : "You're now on our mailing list and will receive updates on new products, seasonal offers, and farming tips."}
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Your name (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Your email" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
    </Form>
  );
}