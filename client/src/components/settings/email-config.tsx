import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, Mail, AlertTriangle, X } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
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

// Email config form schema
const emailConfigSchema = z.object({
  host: z.string().min(2, "Host is required"),
  port: z.coerce.number().int().min(1, "Port is required"),
  secure: z.boolean().default(true),
  user: z.string().min(1, "Username is required"),
  pass: z.string().min(1, "Password is required"),
});

type EmailConfigFormValues = z.infer<typeof emailConfigSchema>;

export function EmailConfigForm() {
  const { toast } = useToast();

  // Get current email configuration status
  const {
    data: emailStatus,
    isLoading: statusLoading,
    isError: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["/api/settings/email/status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings/email/status");
      return await response.json();
    },
  });

  // Form definition
  const form = useForm<EmailConfigFormValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      host: "",
      port: 465,
      secure: true,
      user: "",
      pass: "",
    },
  });

  // Mutation to update email configuration
  const configMutation = useMutation({
    mutationFn: async (data: EmailConfigFormValues) => {
      const response = await apiRequest("POST", "/api/settings/email", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email configuration updated",
        description: "Email service has been successfully configured.",
      });
      // Refetch status to update the badge
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Configuration failed",
        description: error.message || "Please check your email server settings.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: EmailConfigFormValues) {
    configMutation.mutate(data);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Email Configuration</CardTitle>
          {!statusLoading && !statusError && (
            <Badge variant={emailStatus?.configured ? "default" : "destructive"} className={emailStatus?.configured ? "bg-green-500" : ""}>
              {emailStatus?.configured ? (
                <span className="flex items-center gap-1">
                  <Check size={14} /> Configured
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <X size={14} /> Not Configured
                </span>
              )}
            </Badge>
          )}
        </div>
        <CardDescription>
          Configure the email service to enable newsletter verification and product information emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statusLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : statusError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to fetch email service status. Please try again later.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        The hostname of your SMTP server
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="465"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Common ports: 25, 465 (SSL), 587 (TLS)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="secure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Use SSL/TLS</FormLabel>
                      <FormDescription>
                        Enable secure connection (recommended for ports 465/587)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="user"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        SMTP account username
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>
                        SMTP account password
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={configMutation.isPending}
                className="w-full md:w-auto"
              >
                {configMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-muted-foreground">
        <p>
          Note: Email credentials are stored temporarily and will be reset when the server restarts.
          For production use, configure environment variables instead.
        </p>
      </CardFooter>
    </Card>
  );
}