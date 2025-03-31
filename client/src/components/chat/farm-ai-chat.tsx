import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, X, Minimize, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function FarmAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Nature Breed Farm assistant. How can I help you with agricultural advice today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message: userMessage.content,
        history: messages.map(msg => ({ role: msg.role, content: msg.content }))
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
      
      setMessages(prev => [
        ...prev, 
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isExpanded && !isMinimized) {
      setIsExpanded(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (isMinimized && !isExpanded) {
      setIsMinimized(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm your Nature Breed Farm assistant. How can I help you with agricultural advice today?",
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          className="rounded-full w-14 h-14 shadow-lg flex items-center justify-center bg-gradient-to-r from-green-600 to-green-700"
          onClick={toggleMinimize}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 z-50 shadow-lg border-green-100 overflow-hidden transition-all duration-200 ${
      isExpanded ? "w-[90vw] h-[80vh] sm:w-[600px] sm:h-[700px]" : "w-[90vw] sm:w-[350px] h-[500px]"
    }`}>
      <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          Farm Companion AI
        </CardTitle>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-green-600" onClick={toggleMinimize}>
            <Minimize className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-green-600" onClick={toggleExpand}>
            {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-green-600" onClick={clearChat}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <ScrollArea className="h-[calc(100%-7rem)]" ref={scrollAreaRef}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}>
                  <Avatar className={`mt-0.5 border ${message.role === "assistant" ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}`}>
                    {message.role === "assistant" ? (
                      <>
                        <AvatarImage src="bot-avatar.svg" alt="AI Assistant" />
                        <AvatarFallback className="bg-green-100 text-green-700">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  
                  <div className={`rounded-lg px-4 py-2 max-w-[calc(100%-3rem)] ${
                    message.role === "assistant" 
                      ? "bg-green-50 border border-green-100 text-green-900" 
                      : "bg-blue-50 border border-blue-100 text-blue-900"
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.role === "assistant" ? "text-green-500" : "text-blue-500"
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="mt-0.5 border border-green-200 bg-green-50">
                    <AvatarFallback className="bg-green-100 text-green-700">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="rounded-lg px-4 py-2 bg-green-50 border border-green-100 text-green-900">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </ScrollArea>
      
      <CardFooter className="p-3 pt-2 border-t bg-slate-50">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            placeholder="Ask about farming, livestock, crops..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-10 max-h-20 flex-1 resize-none"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            disabled={isLoading || !inputValue.trim()} 
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}