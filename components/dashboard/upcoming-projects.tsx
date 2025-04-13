"use client";

import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Plus } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

// Sample data for projects
const SAMPLE_PROJECTS = [
  { 
    id: 1, 
    name: "Website Redesign", 
    dueDate: "2025-06-15", 
    progress: 65,
    status: "in-progress"
  },
  { 
    id: 2, 
    name: "Home Renovation", 
    dueDate: "2025-07-30", 
    progress: 20,
    status: "in-progress"
  },
  { 
    id: 3, 
    name: "Financial Planning", 
    dueDate: "2025-05-10", 
    progress: 90,
    status: "nearly-complete"
  },
];

export function UpcomingProjects() {
  // Calculate days remaining for a project
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status badge styling
  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (daysRemaining < 0) {
      return { 
        label: "Overdue", 
        className: "bg-red-100 text-red-500 dark:bg-red-900/20"
      };
    }
    
    switch (status) {
      case "completed":
        return { 
          label: "Completed", 
          className: "bg-green-100 text-green-500 dark:bg-green-900/20"
        };
      case "nearly-complete":
        return { 
          label: "Nearly Complete", 
          className: "bg-blue-100 text-blue-500 dark:bg-blue-900/20"
        };
      case "in-progress":
        return { 
          label: "In Progress", 
          className: "bg-yellow-100 text-yellow-500 dark:bg-yellow-900/20"
        };
      case "not-started":
        return { 
          label: "Not Started", 
          className: "bg-gray-100 text-gray-500 dark:bg-gray-900/20"
        };
      default:
        return { 
          label: "In Progress", 
          className: "bg-yellow-100 text-yellow-500 dark:bg-yellow-900/20"
        };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <CheckSquare className="mr-2 h-5 w-5 text-primary" />
            Upcoming Projects
          </CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add project</span>
            </Button>
          </Link>
        </div>
        <CardDescription>Track your ongoing project milestones</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          {SAMPLE_PROJECTS.map((project) => {
            const daysRemaining = getDaysRemaining(project.dueDate);
            const status = getStatusBadge(project.status, daysRemaining);
            
            return (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{project.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 ${status.className}`}
                  >
                    {status.label}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Due in{" "}
                  <span className={daysRemaining < 3 ? "text-red-500 font-medium" : ""}>
                    {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/projects" className="w-full">
          <Button variant="outline" className="w-full">
            View All Projects
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}