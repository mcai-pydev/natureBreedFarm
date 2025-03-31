import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialMediaLinks } from "@/components/social/social-media-links";

export default function PolicyPage() {
  const { policyType } = useParams();
  const [activeTab, setActiveTab] = useState(policyType || "terms");

  useEffect(() => {
    if (policyType) {
      setActiveTab(policyType);
    }
  }, [policyType]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="container max-w-4xl py-10 px-4 sm:px-6 lg:py-16 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
            Nature Breed Farm Policies
          </h1>
          <p className="text-muted-foreground">
            Information about our policies, terms, and guidelines
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 mb-8">
            <TabsTrigger value="terms" asChild>
              <Link href="/policies/terms" className="cursor-pointer">
                Terms of Service
              </Link>
            </TabsTrigger>
            <TabsTrigger value="privacy" asChild>
              <Link href="/policies/privacy" className="cursor-pointer">
                Privacy Policy
              </Link>
            </TabsTrigger>
            <TabsTrigger value="shipping" asChild>
              <Link href="/policies/shipping" className="cursor-pointer">
                Shipping Policy
              </Link>
            </TabsTrigger>
            <TabsTrigger value="returns" asChild>
              <Link href="/policies/returns" className="cursor-pointer">
                Returns Policy
              </Link>
            </TabsTrigger>
          </TabsList>

          <div className="bg-card rounded-lg shadow-sm p-4 sm:p-6 mb-8 mx-auto text-center sm:text-left">
            <TabsContent value="terms" className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Terms of Service</h2>
                <p className="mb-4">
                  These Terms of Service ("Terms") govern your use of Nature Breed Farm's website, services, and products. By accessing or using our services, you agree to be bound by these Terms.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">1. Account Registration</h3>
                <p className="mb-4">
                  When you register an account with Nature Breed Farm, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">2. Ordering and Purchases</h3>
                <p className="mb-4">
                  All orders placed through our website are subject to availability and acceptance. We reserve the right to refuse or cancel any order for any reason, including but not limited to product unavailability, errors in pricing or product information, or identification of fraud or suspicious activity.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">3. Intellectual Property</h3>
                <p className="mb-4">
                  All content on the Nature Breed Farm website, including text, graphics, logos, icons, images, audio clips, digital downloads, and software, is the property of Nature Breed Farm or its content suppliers and is protected by international copyright laws.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">4. Limitation of Liability</h3>
                <p className="mb-4">
                  Nature Breed Farm will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of our services or products.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">5. Governing Law</h3>
                <p className="mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">6. Changes to Terms</h3>
                <p className="mb-4">
                  We reserve the right to modify these Terms at any time. Your continued use of our services following any changes indicates your acceptance of the revised Terms.
                </p>
                
                <p className="mt-6 text-muted-foreground">
                  Last updated: March 31, 2025
                </p>
              </section>
            </TabsContent>
            
            <TabsContent value="privacy" className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
                <p className="mb-4">
                  Nature Breed Farm is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and disclose information about you when you use our website, services, and products.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h3>
                <p className="mb-4">
                  We collect information that you provide directly to us, such as when you create an account, place an order, contact customer service, or subscribe to our newsletter. This information may include your name, email address, postal address, phone number, and payment information.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">2. How We Use Your Information</h3>
                <p className="mb-4">
                  We use the information we collect to provide, maintain, and improve our services, to process and fulfill your orders, to communicate with you about products, services, promotions, and events, and to monitor and analyze trends, usage, and activities in connection with our services.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">3. Sharing of Information</h3>
                <p className="mb-4">
                  We may share your information with vendors, service providers, and consultants that need access to such information to carry out work on our behalf, such as payment processing, data analysis, email delivery, hosting services, and customer service.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">4. Data Security</h3>
                <p className="mb-4">
                  We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">5. Your Rights</h3>
                <p className="mb-4">
                  You have the right to access, update, or delete your personal information. You may also opt out of receiving promotional communications from us by following the instructions in those communications.
                </p>
                
                <p className="mt-6 text-muted-foreground">
                  Last updated: March 31, 2025
                </p>
              </section>
            </TabsContent>
            
            <TabsContent value="shipping" className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Shipping Policy</h2>
                <p className="mb-4">
                  This Shipping Policy outlines the terms and conditions for the delivery of products purchased from Nature Breed Farm.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">1. Processing Time</h3>
                <p className="mb-4">
                  Orders are typically processed within 1-2 business days. During peak seasons or promotional periods, processing times may be longer. You will receive a confirmation email once your order has been processed and shipped.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">2. Shipping Methods and Timeframes</h3>
                <p className="mb-4">
                  We offer various shipping methods, including standard shipping (5-7 business days), express shipping (2-3 business days), and same-day delivery (available in select locations). Shipping timeframes are estimates and not guarantees.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">3. Shipping Costs</h3>
                <p className="mb-4">
                  Shipping costs are calculated based on the weight of your order, the shipping method selected, and your delivery location. Shipping costs will be displayed during checkout before you complete your purchase.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">4. International Shipping</h3>
                <p className="mb-4">
                  We currently ship to select international destinations. International orders may be subject to import duties, taxes, and customs clearance fees, which are the responsibility of the recipient.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">5. Tracking Your Order</h3>
                <p className="mb-4">
                  Once your order has been shipped, you will receive a tracking number via email. You can use this tracking number to monitor the status of your delivery on our website or the carrier's website.
                </p>
                
                <p className="mt-6 text-muted-foreground">
                  Last updated: March 31, 2025
                </p>
              </section>
            </TabsContent>
            
            <TabsContent value="returns" className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Returns & Refunds Policy</h2>
                <p className="mb-4">
                  This Returns & Refunds Policy outlines the terms and conditions for returning products purchased from Nature Breed Farm and requesting refunds.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">1. Return Eligibility</h3>
                <p className="mb-4">
                  You may return most products within 30 days of delivery for a full refund. To be eligible for a return, the item must be unused, in its original packaging, and in the same condition as you received it.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">2. Non-Returnable Items</h3>
                <p className="mb-4">
                  Certain items cannot be returned, including perishable goods, live animals, custom products, and downloadable products.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">3. Return Process</h3>
                <p className="mb-4">
                  To initiate a return, please contact our customer service team with your order number and the reason for your return. We will provide you with return shipping instructions. Return shipping costs are the responsibility of the customer unless the item is defective or we made an error.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">4. Refunds</h3>
                <p className="mb-4">
                  Once we receive and inspect your return, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 7-10 business days.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">5. Exchanges</h3>
                <p className="mb-4">
                  If you need to exchange an item for the same product, please contact our customer service team to arrange the exchange.
                </p>
                
                <p className="mt-6 text-muted-foreground">
                  Last updated: March 31, 2025
                </p>
              </section>
            </TabsContent>
          </div>

          <div className="border-t pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                © 2025 Nature Breed Farm. All rights reserved.
              </p>
              <div className="flex justify-center w-full sm:w-auto">
                <SocialMediaLinks />
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}