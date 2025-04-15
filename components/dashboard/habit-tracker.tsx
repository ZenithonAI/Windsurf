"use client";

import { useEffect, useState } from "react";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useHabits } from "@/lib/hooks/use-habits";
import { useAuth } from "@/components/auth-provider";

export function HabitTracker() {
  const { user } = useAuth();
  const { habits, isLoading, error, toggleHabit, incrementProgress } = useHabits();
  const [isClient, setIsClient] = useState(false);

  // Ensure hydration mismatch is avoided
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-3/5" />
          </div>
          <Skeleton className="h-4 w-4/5 mt-1" />
        </CardHeader>
        <CardContent className="pb-2 space-y-4">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center">
              <Flame className="mr-2 h-5 w-5 text-primary" />
              Habit Tracker
            </CardTitle>
          </div>
          <CardDescription>Loading your habits...</CardDescription>
        </CardHeader>
        <CardContent className="pb-2 flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <Flame className="mr-2 h-5 w-5 text-destructive" />
            Habit Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error loading habits. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  // Filter to show only habits with streaks > 0 or that haven't been completed today
  // Limited to 5 for the dashboard view
  const displayHabits = habits
    .filter(habit => !habit.completed || habit.streak > 0)
    .slice(0, 5);

  if (displayHabits.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center">
              <Flame className="mr-2 h-5 w-5 text-primary" />
              Habit Tracker
            </CardTitle>
            <Link href="/habits">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add habit</span>
              </Button>
            </Link>
          </div>
          <CardDescription>Track your daily habits and build streaks</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground text-center py-4">
            You haven't created any habits yet or all are completed for today.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/habits" className="w-full">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Create Your First Habit
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <Flame className="mr-2 h-5 w-5 text-primary" />
            Habit Tracker
          </CardTitle>
          <Link href="/habits">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add habit</span>
            </Button>
          </Link>
        </div>
        <CardDescription>Track your daily habits and build streaks</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          {displayHabits.map((habit) => (
            <div key={habit.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={habit.completed ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 rounded-full ${
                      habit.completed ? "bg-primary" : ""
                    }`}
                    onClick={() => toggleHabit(
                      habit.id, 
                      !habit.completed,
                      habit.progress,
                      habit.target
                    )}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span className="sr-only">Toggle habit</span>
                  </Button>
                  <span className={`text-sm ${habit.completed ? "font-medium" : ""}`}>
                    {habit.name}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs px-2">
                  {habit.streak} days
                </Badge>
              </div>
              
              {habit.target > 1 && (
                <div className="flex items-center gap-2">
                  <Progress 
                    value={habit.target > 0 ? Math.min((habit.progress / habit.target) * 100, 100) : 0} 
                    className="h-2" 
                  />
                  <span className="text-xs text-muted-foreground">
                    {habit.progress}/{habit.target}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full"
                    onClick={() => incrementProgress(habit.id, habit.progress, habit.target)}
                    disabled={habit.progress >= habit.target}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="sr-only">Increment</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/habits" className="w-full">
          <Button variant="outline" className="w-full">
            View All Habits
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}