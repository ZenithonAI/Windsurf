import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function DashboardWelcome({ userName }: { userName: string }) {
  // Get the current time of day to customize greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get current date in a nice format
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-none">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              {getGreeting()}, {userName}!
            </h1>
            <p className="text-muted-foreground">
              Today is {formattedDate}. Here's an overview of your personal dashboard.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              Weekly Review
            </Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}