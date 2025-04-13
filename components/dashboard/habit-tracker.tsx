"use client";

import { useState } from "react";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Plus } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

// Sample data for habits
const SAMPLE_HABITS = [
  { id: 1, name: "Morning Meditation", streak: 7, completed: true, target: 1, progress: 1 },
  { id: 2, name: "Read 20 Pages", streak: 3, completed: false, target: 1, progress: 0 },
  { id: 3, name: "Workout", streak: 12, completed: true, target: 1, progress: 1 },
  { id: 4, name: "Drink 8 Glasses of Water", streak: 5, completed: false, target: 8, progress: 5 },
];

export function HabitTracker() {
  const [habits, setHabits] = useState(SAMPLE_HABITS);

  const toggleHabit = (id: number) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const isCompleting = habit.progress < habit.target;
          return {
            ...habit,
            progress: isCompleting ? habit.target : 0,
            completed: isCompleting,
            streak: isCompleting ? habit.streak + 1 : habit.streak,
          };
        }
        return habit;
      })
    );
  };

  const incrementProgress = (id: number) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id && habit.progress < habit.target) {
          const newProgress = habit.progress + 1;
          return {
            ...habit,
            progress: newProgress,
            completed: newProgress >= habit.target,
            streak: newProgress >= habit.target ? habit.streak + 1 : habit.streak,
          };
        }
        return habit;
      })
    );
  };

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
          {habits.map((habit) => (
            <div key={habit.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={habit.completed ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 rounded-full ${
                      habit.completed ? "bg-primary" : ""
                    }`}
                    onClick={() => toggleHabit(habit.id)}
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
                    onClick={() => incrementProgress(habit.id)}
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