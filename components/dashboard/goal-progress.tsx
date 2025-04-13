"use client";

import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Goal, Plus } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

// Sample data for goals
const SAMPLE_GOALS = [
  { 
    id: 1, 
    title: "Complete Web Development Course", 
    category: "education",
    deadline: "2025-08-30", 
    progress: 65 
  },
  { 
    id: 2, 
    title: "Run 5K Marathon", 
    category: "health",
    deadline: "2025-07-15", 
    progress: 40 
  },
  { 
    id: 3, 
    title: "Save $5000 for Vacation", 
    category: "finance",
    deadline: "2025-12-31", 
    progress: 25 
  },
];

export function GoalProgress() {
  // Get category badge styling
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "education":
        return { 
          label: "Education", 
          className: "bg-blue-100 text-blue-500 dark:bg-blue-900/20" 
        };
      case "health":
        return { 
          label: "Health", 
          className: "bg-green-100 text-green-500 dark:bg-green-900/20" 
        };
      case "finance":
        return { 
          label: "Finance", 
          className: "bg-purple-100 text-purple-500 dark:bg-purple-900/20" 
        };
      case "career":
        return { 
          label: "Career", 
          className: "bg-red-100 text-red-500 dark:bg-red-900/20" 
        };
      case "personal":
        return { 
          label: "Personal", 
          className: "bg-yellow-100 text-yellow-500 dark:bg-yellow-900/20" 
        };
      default:
        return { 
          label: "Other", 
          className: "bg-gray-100 text-gray-500 dark:bg-gray-900/20" 
        };
    }
  };

  // Calculate days until deadline
  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const deadline = new Date(dateString);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format deadline in a user-friendly way
  const formatDeadline = (dateString: string) => {
    const days = getDaysUntil(dateString);
    
    if (days < 0) {
      return "Overdue";
    }
    
    if (days === 0) {
      return "Today";
    }
    
    if (days === 1) {
      return "Tomorrow";
    }
    
    if (days < 30) {
      return `${days} days left`;
    }
    
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} left`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <Goal className="mr-2 h-5 w-5 text-primary" />
            Goal Progress
          </CardTitle>
          <Link href="/goals">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add goal</span>
            </Button>
          </Link>
        </div>
        <CardDescription>Track your personal and professional goals</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          {SAMPLE_GOALS.map((goal) => {
            const category = getCategoryBadge(goal.category);
            const deadline = formatDeadline(goal.deadline);
            const isOverdue = getDaysUntil(goal.deadline) < 0;
            
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{goal.title}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 ${category.className}`}
                  >
                    {category.label}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                    {deadline}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/goals" className="w-full">
          <Button variant="outline" className="w-full">
            View All Goals
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}