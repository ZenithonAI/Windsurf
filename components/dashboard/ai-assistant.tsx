"use client";

import { useState } from "react";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";
import Link from "next/link";

export function AIAssistant() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message to conversation
    setConversation([
      ...conversation,
      { role: "user", content: inputValue },
    ]);
    
    setIsLoading(true);
    
    // Simulate AI response (would connect to actual GPT-4o in production)
    setTimeout(() => {
      const sampleResponses = [
        "I can help you with that! Let me know more details.",
        "That's a good question. Based on your personal data, I would suggest...",
        "I've analyzed your schedule and can recommend the following options...",
        "Looking at your habits and tasks, I think the best approach would be...",
      ];
      
      const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
      
      setConversation([
        ...conversation,
        { role: "user", content: inputValue },
        { role: "assistant", content: randomResponse },
      ]);
      
      setIsLoading(false);
      setInputValue("");
    }, 1000);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
        </div>
        <CardDescription>Your personal GPT-4o powered assistant</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto pb-2">
        <div className="space-y-4">
          {conversation.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.role === "assistant"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse h-2 w-2 rounded-full bg-muted-foreground"></div>
                  <div className="animate-pulse h-2 w-2 rounded-full bg-muted-foreground animation-delay-150"></div>
                  <div className="animate-pulse h-2 w-2 rounded-full bg-muted-foreground animation-delay-300"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="w-full flex gap-2"
        >
          <Input
            placeholder="Ask anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !inputValue.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}