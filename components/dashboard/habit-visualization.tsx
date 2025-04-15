"use client";

import { useEffect, useState } from "react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { LineChart, Calendar, Trophy } from "lucide-react";
import { useHabits } from "@/lib/hooks/use-habits";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function HabitVisualization() {
  const { habits, isLoading, error } = useHabits();
  const [isClient, setIsClient] = useState(false);

  // Ensure hydration mismatch is avoided
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-2/3 mt-1" />
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <LineChart className="mr-2 h-5 w-5 text-destructive" />
            Habit Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Unable to load habit data.</p>
        </CardContent>
      </Card>
    );
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <LineChart className="mr-2 h-5 w-5 text-primary" />
            Habit Streaks
          </CardTitle>
          <CardDescription>
            Start building streaks by creating habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            You haven't created any habits yet. Create your first habit to track your streaks.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find the habit with the longest streak
  const longestStreakHabit = habits.reduce((longest, current) => 
    current.streak > (longest?.streak || 0) ? current : longest, habits[0]);

  // Group habits by streak lengths
  const streakGroups = habits.reduce((acc, habit) => {
    const streakRange = getStreakRange(habit.streak);
    if (!acc[streakRange]) acc[streakRange] = [];
    acc[streakRange].push(habit);
    return acc;
  }, {} as Record<string, typeof habits>);

  const streakRangeOrder = ['0 days', '1-7 days', '8-14 days', '15-30 days', '31+ days'];
  const sortedGroups = streakRangeOrder
    .filter(range => streakGroups[range]?.length > 0)
    .map(range => ({
      range,
      count: streakGroups[range].length,
      habits: streakGroups[range]
    }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <LineChart className="mr-2 h-5 w-5 text-primary" />
          Habit Streaks
        </CardTitle>
        <CardDescription>
          Track your consistency over time
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Longest streak callout */}
        {longestStreakHabit.streak > 0 && (
          <div className="bg-primary/10 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-medium">
                Longest Streak: {longestStreakHabit.name}
              </span>
            </div>
            <Badge variant="secondary" className="font-bold">
              {longestStreakHabit.streak} days
            </Badge>
          </div>
        )}

        {/* Streak distribution visualization */}
        <div className="space-y-3">
          {sortedGroups.map(({ range, count, habits }) => (
            <div key={range} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{range}</span>
                <span>{count} habit{count !== 1 ? 's' : ''}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(count / habits.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to categorize streaks
function getStreakRange(streak: number): string {
  if (streak === 0) return '0 days';
  if (streak >= 1 && streak <= 7) return '1-7 days';
  if (streak >= 8 && streak <= 14) return '8-14 days';
  if (streak >= 15 && streak <= 30) return '15-30 days';
  return '31+ days';
}
