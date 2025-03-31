import React, { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface NewsletterVerificationProps {
  token: string;
  onClose: () => void;
}

export function NewsletterVerification({ token, onClose }: NewsletterVerificationProps) {
  const [verifyAttempted, setVerifyAttempted] = useState(false);

  // Query to verify the email token
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [`/api/newsletter/verify?token=${token}`],
    queryFn: async () => {
      setVerifyAttempted(true);
      const response = await apiRequest("GET", `/api/newsletter/verify?token=${token}`);
      return await response.json();
    },
    enabled: false, // Don't run automatically
  });

  // Trigger verification when component mounts
  React.useEffect(() => {
    if (!verifyAttempted) {
      refetch();
    }
  }, [refetch, verifyAttempted]);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">
          Email Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6">
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Verifying your email address...</p>
            </div>
          ) : isError ? (
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Verification Failed</p>
              <p className="text-gray-600 mb-4">
                {(error as Error)?.message || "The verification link may have expired or been used already."}
              </p>
              <p className="text-gray-600">
                Please try subscribing again to receive a new verification link.
              </p>
            </div>
          ) : data?.success ? (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Email Verified!</p>
              <p className="text-gray-600">
                Thank you for verifying your email address. You are now subscribed to our newsletter.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Verification Failed</p>
              <p className="text-gray-600 mb-4">
                {data?.error || "The verification link may have expired or been used already."}
              </p>
              <p className="text-gray-600">
                Please try subscribing again to receive a new verification link.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={onClose}>
          {data?.success ? "Continue Shopping" : "Return to Shop"}
        </Button>
      </CardFooter>
    </Card>
  );
}