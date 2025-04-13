"use client";

import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  CircleOff,
  ClipboardList,
  Coins,
  FileText,
  Flame,
  Goal,
  LayoutDashboard,
  LineChart,
  Loader2
} from "lucide-react";
import { DashboardQuickActions } from "@/components/dashboard/quick-actions";
import { DashboardWelcome } from "@/components/dashboard/welcome";
import { PriorityTasks } from "@/components/dashboard/priority-tasks";
import { HabitTracker } from "@/components/dashboard/habit-tracker";
import { UpcomingProjects } from "@/components/dashboard/upcoming-projects";
import { FinancialOverview } from "@/components/dashboard/financial-overview";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { AIAssistant } from "@/components/dashboard/ai-assistant";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  // If still checking authentication status
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(null).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardWelcome userName={user?.email?.split('@')[0] || 'User'} />
      
      <DashboardQuickActions />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PriorityTasks />
        <HabitTracker />
        <UpcomingProjects />
        <FinancialOverview />
        <GoalProgress />
        <AIAssistant />
      </div>
    </div>
  );
}