import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function BulkOrderEmailTest() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    referenceNumber?: string;
    error?: string;
  } | null>(null);

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/debug/test-bulk-order-email", {
        email,
        name
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setResult({
        success: true,
        message: data.message || "Test email sent successfully",
        referenceNumber: data.referenceNumber
      });
      
      toast({
        title: "Test Email Sent",
        description: `A test bulk order email was sent to ${email}`,
      });
    },
    onError: (error: any) => {
      // Extract error details
      const errorMessage = error.data?.message || error.message || "Unknown error";
      const isConfigured = error.data?.configured;
      
      setResult({
        success: false,
        message: errorMessage,
        error: error.data?.error
      });
      
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and name",
        variant: "destructive",
      });
      return;
    }
    
    testMutation.mutateAsync();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Bulk Order Email</CardTitle>
        <CardDescription>
          Send a test bulk order confirmation email to verify the email service is working properly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="test-email">Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="Enter recipient email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="test-name">Recipient Name</Label>
            <Input
              id="test-name"
              placeholder="Enter recipient name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          {result && (
            <div className={`p-3 rounded-md ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <p className="font-medium">{result.success ? 'Success' : 'Failed'}</p>
              <p>{result.message}</p>
              {result.referenceNumber && (
                <p className="text-sm">Reference: {result.referenceNumber}</p>
              )}
              {result.error && (
                <p className="text-sm mt-1 text-red-600">{result.error}</p>
              )}
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="button" 
          onClick={handleSubmit}
          disabled={testMutation.isPending}
          className="w-full"
        >
          {testMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Test Email
        </Button>
      </CardFooter>
    </Card>
  );
}