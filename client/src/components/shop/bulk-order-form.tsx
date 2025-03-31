import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  productId: z.number().optional(),
  quantity: z.number().min(1, {
    message: "Quantity must be at least 1.",
  }).optional(),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface BulkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedProductId?: number;
}

export function BulkOrderDialog({ 
  open, 
  onOpenChange,
  preselectedProductId
}: BulkOrderDialogProps) {
  const { toast } = useToast();
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  
  // Fetch products for dropdown
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: open, // Only fetch when dialog is open
  });
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      productId: preselectedProductId,
      quantity: undefined,
      message: "",
    },
  });
  
  // Reset form when dialog opens/closes
  useState(() => {
    if (open) {
      form.reset({
        name: "",
        email: "",
        phone: "",
        productId: preselectedProductId,
        quantity: undefined,
        message: "",
      });
    }
  });
  
  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/bulk-orders", data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Check if there was a reference number returned
      if (data.referenceNumber) {
        setReferenceNumber(data.referenceNumber);
      }
      
      // Check if email service was unavailable
      if (data.emailSent === false || data.serviceUnavailable) {
        setServiceUnavailable(true);
        toast({
          title: "Order Request Received",
          description: "Your bulk order request was recorded, but email confirmation could not be sent. Our team will contact you soon.",
        });
      } else {
        toast({
          title: "Order Request Submitted",
          description: "We've received your bulk order request and will contact you shortly.",
        });
      }
      
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-orders"] });
    },
    onError: (error: any) => {
      // Check if this is a 503 Service Unavailable error
      if (error.status === 503 && error.data) {
        setServiceUnavailable(true);
        if (error.data.referenceNumber) {
          setReferenceNumber(error.data.referenceNumber);
        }
        
        toast({
          title: "Order Request Received",
          description: error.data.message || "Your request was recorded, but email delivery is currently unavailable.",
        });
        
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ["/api/bulk-orders"] });
      } else {
        toast({
          title: "Submission Failed",
          description: error.message || "Failed to submit bulk order request",
          variant: "destructive",
        });
      }
    },
  });
  
  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setSubmittingOrder(true);
    try {
      await submitMutation.mutateAsync(values);
    } finally {
      setSubmittingOrder(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Bulk Order</DialogTitle>
          <DialogDescription>
            Fill out this form to request special pricing for bulk orders. Our team will contact you shortly.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem 
                            key={product.id} 
                            value={product.id.toString()}
                          >
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the product you're interested in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Estimated quantity"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : parseInt(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide details about your bulk order requirements..." 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={submittingOrder}
                className="w-full"
              >
                {submittingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}