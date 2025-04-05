import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Leaf } from "lucide-react";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const { user, isLoading, error, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  
  // Dialog states
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
    },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: "",
    },
  });
  
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      newPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("Login attempt for user:", data.username);
    loginMutation.mutate({
      username: data.username,
      password: data.password
    }, {
      onSuccess: () => {
        console.log("Login success, redirecting to home page");
      },
      onError: (error: Error) => {
        console.error("Login error:", error);
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    console.log("Registration attempt for user:", data.username);
    registerMutation.mutate({
      username: data.username,
      password: data.password,
      name: data.name,
      role: "User"
    }, {
      onSuccess: () => {
        console.log("Registration success, user created");
      },
      onError: (error: Error) => {
        console.error("Registration error:", error);
      }
    });
  };
  
  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/forgot-password", data);
      const result = await response.json();
      
      // In a real app, we'd just show a message telling the user to check their email
      // For this demo, we'll store the token and open the reset password dialog
      if (result.token) {
        setResetToken(result.token);
        resetPasswordForm.setValue("token", result.token);
        setForgotPasswordOpen(false);
        setResetPasswordOpen(true);
        toast({
          title: "Reset token generated",
          description: "Please enter a new password to reset your account.",
        });
      } else {
        toast({
          title: "Reset link sent",
          description: "If the account exists, a reset email has been sent.",
        });
        setForgotPasswordOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onResetPasswordSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/reset-password", data);
      const result = await response.json();
      
      toast({
        title: "Success",
        description: result.message || "Password has been reset successfully.",
      });
      
      setResetPasswordOpen(false);
      loginForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. The token may be invalid or expired.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug mode for auth issues
  const [showDebug, setShowDebug] = useState(false);

  // Redirect to dashboard if already logged in
  if (user) {
    console.log("User is authenticated, redirecting to home page");
    return <Redirect to="/" />;
  }

  return (
    <>
      {/* Debug Panel */}
      <div className="fixed bottom-0 right-0 p-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="mb-2"
        >
          {showDebug ? "Hide Debug" : "Show Debug"}
        </Button>
        
        {showDebug && (
          <div className="bg-white border rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto">
            <h3 className="font-bold mb-2">Auth Debug Info</h3>
            <div className="text-xs font-mono">
              <p>Auth Loading: {isLoading ? "true" : "false"}</p>
              <p>Login Pending: {loginMutation.isPending ? "true" : "false"}</p>
              <p>Register Pending: {registerMutation.isPending ? "true" : "false"}</p>
              <p>Auth Error: {error ? (error as Error).message : "none"}</p>
              <p>User: {user ? JSON.stringify(user, null, 2) : "null"}</p>
              <hr className="my-2" />
              <p className="font-bold mt-2">Default Admin Login:</p>
              <p>Username: admin</p>
              <p>Password: admin123</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={() => {
                  loginForm.setValue("username", "admin");
                  loginForm.setValue("password", "admin123");
                  console.log("Admin credentials prefilled");
                }}
              >
                Prefill Admin Login
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex min-h-screen">
        <div className="hidden md:block md:w-1/2 lg:w-2/3 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')]"></div>
        <div className="w-full md:w-1/2 lg:w-1/3 flex items-center justify-center p-6 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="inline-block p-2 bg-primary/10 rounded-full mb-3">
                <Leaf className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome to FarmManager</h1>
              <p className="text-gray-500 mt-2">Sign in to manage your farm operations</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange} 
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Remember me</FormLabel>
                          </FormItem>
                        )}
                      />
                      <div className="text-sm">
                        <button 
                          type="button"
                          onClick={() => setForgotPasswordOpen(true)}
                          className="font-medium text-primary hover:text-primary/80"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Enter your username and we'll send you a password reset link.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4 pt-4">
              <FormField
                control={forgotPasswordForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setForgotPasswordOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4 pt-4">
              <FormField
                control={resetPasswordForm.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reset Token</FormLabel>
                    <FormControl>
                      <Input readOnly {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={resetPasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setResetPasswordOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}