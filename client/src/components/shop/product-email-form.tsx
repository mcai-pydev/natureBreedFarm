import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Mail } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Email form schema
const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface ProductEmailFormProps {
  productId: number;
  productName: string;
}

export function ProductEmailForm({ productId, productName }: ProductEmailFormProps) {
  const { toast } = useToast();

  // Form definition
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  // Mutation to send product info via email
  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormValues) => {
      const response = await apiRequest("POST", `/api/products/${productId}/send-info`, {
        email: data.email,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent!",
        description: `Information about ${productName} has been sent to your email.`,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: EmailFormValues) {
    sendEmailMutation.mutate(data);
  }

  return (
    <div className="mt-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email product information</FormLabel>
                <div className="flex items-start gap-2">
                  <FormControl>
                    <Input placeholder="your@email.com" {...field} />
                  </FormControl>
                  <Button 
                    type="submit" 
                    disabled={sendEmailMutation.isPending}
                    size="sm"
                  >
                    {sendEmailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormDescription>
                  Get detailed information about this product sent to your email.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}