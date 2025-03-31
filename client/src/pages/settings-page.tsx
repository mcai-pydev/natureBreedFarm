import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { EmailConfigForm } from "@/components/settings/email-config";
import { NewsletterBlastForm } from "@/components/settings/newsletter-blast";
import { NewsletterSubscriberList } from "@/components/settings/newsletter-subscriber-list";
import { BulkOrderEmailTest } from "@/components/settings/bulk-order-test";

// Farm information form schema
const farmInfoSchema = z.object({
  farmName: z.string().min(2, "Farm name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(5, "Phone number is required"),
  address: z.string().min(5, "Address is required"),
});

// Password change form schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
  twoFactor: z.boolean().optional(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FarmInfoValues = z.infer<typeof farmInfoSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Farm information form
  const farmInfoForm = useForm<FarmInfoValues>({
    resolver: zodResolver(farmInfoSchema),
    defaultValues: {
      farmName: "Green Valley Farms",
      ownerName: user?.name || "",
      email: "info@greenvalleyfarms.com",
      phone: "(555) 123-4567",
      address: "123 Farm Road, Countryside, CA 90210",
    },
  });

  // Password change form
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactor: false,
    },
  });

  // Handle farm information submission
  function onFarmInfoSubmit(data: FarmInfoValues) {
    toast({
      title: "Farm information updated",
      description: "Your farm information has been successfully updated.",
    });
  }

  // Handle password change submission
  function onPasswordSubmit(data: PasswordValues) {
    toast({
      title: "Password updated",
      description: "Your password has been successfully changed.",
    });
    passwordForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactor: data.twoFactor,
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow">
          <MobileMenu />
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-500">Manage your farm and account settings</p>
            </div>
            
            <Tabs defaultValue="general" className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="general">Farm Information</TabsTrigger>
                <TabsTrigger value="security">Account Security</TabsTrigger>
                {user?.role === "Admin" && <TabsTrigger value="email">Email Settings</TabsTrigger>}
                {user?.role === "Admin" && <TabsTrigger value="newsletter">Newsletter</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                {/* Farm Information */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Farm Information</h2>
                  
                  <Form {...farmInfoForm}>
                    <form onSubmit={farmInfoForm.handleSubmit(onFarmInfoSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={farmInfoForm.control}
                        name="farmName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Farm Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={farmInfoForm.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={farmInfoForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={farmInfoForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={farmInfoForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                className="resize-none" 
                                rows={3} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="md:col-span-2 flex justify-end">
                        <Button type="submit">Save Changes</Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                {/* Account Security */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Account Security</h2>
                  
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="md:col-span-2 h-0"></div>
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="twoFactor"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Enable two-factor authentication</FormLabel>
                              <FormDescription>
                                Additional security for your account using your mobile device
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <div className="md:col-span-2 flex justify-end">
                        <Button type="submit">Update Password</Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </TabsContent>
              
              {user?.role === "Admin" && (
                <TabsContent value="email" className="space-y-6">
                  {/* Email Configuration */}
                  <EmailConfigForm />
                  
                  {/* Email Testing */}
                  <div className="bg-white rounded-lg shadow p-5">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Email Testing</h2>
                    <div className="grid grid-cols-1 gap-4">
                      <BulkOrderEmailTest />
                    </div>
                  </div>
                </TabsContent>
              )}
              
              {user?.role === "Admin" && (
                <TabsContent value="newsletter" className="space-y-4">
                  {/* Newsletter Management */}
                  <NewsletterBlastForm />
                  <NewsletterSubscriberList />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
