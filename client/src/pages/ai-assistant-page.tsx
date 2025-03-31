import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaf, Bot, HelpCircle, Sprout, CloudRain, Thermometer, Bug } from 'lucide-react';
import { FarmAIChat } from '@/components/chat/farm-ai-chat';

export default function AIAssistantPage() {
  return (
    <>
      <Helmet>
        <title>AI Farm Assistant | Nature Breed Farm</title>
      </Helmet>
      
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Farm Companion AI</h1>
            <p className="text-muted-foreground">
              Get instant agricultural advice and insights for your farming needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Tabs defaultValue="overview">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                  <TabsTrigger value="examples">Example Questions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bot className="mr-2 h-5 w-5 text-primary" />
                        What is Farm Companion AI?
                      </CardTitle>
                      <CardDescription>
                        Your 24/7 agricultural advisor powered by artificial intelligence
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p>
                        Farm Companion AI is your intelligent farming assistant that provides instant advice on agricultural practices, crop management, livestock care, pest control, and more. Whether you're dealing with an unexpected plant disease, need feeding recommendations for your livestock, or want to optimize your crop yields, our AI assistant can provide timely, research-backed guidance.
                      </p>
                      <p>
                        Simply ask your questions in natural language, and get expert-level assistance at any time of day. The assistant learns from the latest agricultural research and best practices to ensure you receive up-to-date information tailored to your specific situations.
                      </p>
                      <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h3 className="font-semibold flex items-center">
                          <HelpCircle className="mr-2 h-5 w-5 text-primary" />
                          How to use the AI Assistant
                        </h3>
                        <ol className="ml-5 mt-2 list-decimal space-y-1">
                          <li>Click on the chat icon in the bottom right corner</li>
                          <li>Type your farming question in natural language</li>
                          <li>Press Enter or click the send button</li>
                          <li>Get instant agricultural advice personalized to your needs</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="capabilities" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>What Farm Companion AI Can Do</CardTitle>
                      <CardDescription>
                        Key capabilities to assist with your farming operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Leaf className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Crop Management</h3>
                            <p className="text-sm text-muted-foreground">
                              Planting schedules, soil requirements, fertilization, irrigation, and harvesting techniques
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Thermometer className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Climate Adaptation</h3>
                            <p className="text-sm text-muted-foreground">
                              Strategies for dealing with weather changes, drought management, and seasonal planning
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Bug className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Pest & Disease Control</h3>
                            <p className="text-sm text-muted-foreground">
                              Identification of common pests and diseases, prevention methods, and organic treatment options
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <div className="rounded-full bg-primary/10 p-2">
                            <CloudRain className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Water Management</h3>
                            <p className="text-sm text-muted-foreground">
                              Irrigation techniques, water conservation strategies, and drainage solutions
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Sprout className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Sustainable Practices</h3>
                            <p className="text-sm text-muted-foreground">
                              Organic farming methods, crop rotation, companion planting, and soil conservation
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="examples" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Example Questions to Ask</CardTitle>
                      <CardDescription>
                        Try these sample questions or ask your own specific farming queries
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              "What's the best way to increase egg production in my chicken farm?"
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              "How do I control aphids on my tomato plants without using chemical pesticides?"
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              "What are the signs of mastitis in dairy goats and how should I treat it?"
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              "Which crops grow well together in companion planting?"
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              "How often should I feed tilapia in an aquaculture system?"
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              "What's causing the yellow leaves on my cucumber plants?"
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              "How can I improve soil fertility naturally on my small farm?"
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              "What's the best breeding age for my farm goats?"
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="mr-2 h-5 w-5 text-primary" />
                    Start a Conversation
                  </CardTitle>
                  <CardDescription>
                    Ask your farming questions directly here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-[300px] space-y-4 border-2 border-dashed rounded-lg p-8 text-center">
                    <Bot className="h-10 w-10 text-primary/50" />
                    <div>
                      <h3 className="font-medium">Farm Companion AI</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click the chat button in the corner to start getting agricultural advice
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* The floating chat component */}
      <FarmAIChat />
    </>
  );
}