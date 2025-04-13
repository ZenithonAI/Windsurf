"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Task = {
  id: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: string; // Using 'status' instead of 'completed' to match database schema
  due_date: string;
};

export function PriorityTasks() {
  const { user } = useAuth();
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize supabase client
  const supabaseClient = useMemo(() => supabase, [supabase]);

  // Memoize the fetch function to prevent unnecessary re-creation
  const fetchTasks = useCallback(async () => {
    if (!user?.id) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Calculate date range for the next 3 days
      const today = new Date();
      // Set time to start of day in local timezone
      today.setHours(0, 0, 0, 0);
      
      const threeDaysFromNow = new Date();
      // Set to end of day 3 days from now in local timezone
      threeDaysFromNow.setDate(today.getDate() + 3);
      threeDaysFromNow.setHours(23, 59, 59, 999);
      
      // Use memoized supabase client
      const { data, error: dbError } = await supabaseClient
        .from('tasks')
        .select('id, title, priority, status, due_date')
        .eq('user_id', user.id)
        // Only get non-completed tasks
        .not('status', 'eq', 'completed')
        // Only high priority tasks
        .eq('priority', 'high')
        // Only tasks due within the next 3 days
        .gte('due_date', today.toISOString().split('T')[0]) // Use date-only comparison for better timezone handling
        .lte('due_date', threeDaysFromNow.toISOString())
        // Order by due date (closest first)
        .order('due_date', { ascending: true })
        .limit(4);

      if (dbError) {
        throw dbError;
      }

      // No need for complex sorting since we're filtering in the query
      setTasks(data || []);

    } catch (error) {
      console.error("Error fetching priority tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabaseClient]);

  // Fetch tasks when user or supabase client changes
  useEffect(() => {
    fetchTasks();
  }, [user, supabaseClient, fetchTasks]);

  // Set up real-time subscription for task updates
  useEffect(() => {
    if (!user?.id) return;
    
    const subscription = supabaseClient
      .channel('priority-tasks-changes')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks', 
          filter: `user_id=eq.${user.id}`
        }, 
        (_payload) => {
          fetchTasks();
        }
       )
       .subscribe();

    // Clean up subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
   }, [user, supabaseClient, fetchTasks]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500 bg-red-100 dark:bg-red-900/20";
      case "medium":
        return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20";
      case "low":
        return "text-green-500 bg-green-100 dark:bg-green-900/20";
      default:
        return "text-gray-500 bg-gray-100 dark:bg-gray-900/20";
    }
  }, []);

  const toggleTask = useCallback(async (id: number, currentStatus: string) => {
    if (!user) return;

    const originalTasks = tasks;
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, status: currentStatus === 'completed' ? 'todo' : 'completed' } : task
      )
    );

    try {
      const { error: updateError } = await supabaseClient
        .from('tasks')
        .update({ status: currentStatus === 'completed' ? 'todo' : 'completed' })
        .match({ id: id, user_id: user.id });

      if (updateError) {
        throw updateError;
      }

    } catch (err) {
      console.error("Error updating task:", err);
      setTasks(originalTasks);
      alert("Failed to update task status.");
    }
  }, [user, supabaseClient, tasks]);

  // Memoize the card content to prevent unnecessary re-renders
  const taskCards = useMemo(() => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-4 w-4/5 mt-1" />
          </CardHeader>
          <CardContent className="pb-2 space-y-4">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <ListTodo className="mr-2 h-5 w-5 text-destructive" />
              Priority Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      );
    }

    if (tasks.length === 0) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center">
                <ListTodo className="mr-2 h-5 w-5 text-primary" />
                Priority Tasks
              </CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add task</span>
                </Button>
              </Link>
            </div>
            <CardDescription>High priority tasks due in the next 3 days</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground text-center py-4">No priority tasks found.</p>
          </CardContent>
          <CardFooter>
            <Link href="/tasks" className="w-full">
              <Button variant="outline" className="w-full">
                View All Tasks
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
              <ListTodo className="mr-2 h-5 w-5 text-primary" />
              Priority Tasks
            </CardTitle>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add task</span>
              </Button>
            </Link>
          </div>
          <CardDescription>High priority tasks due in the next 3 days</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.status === 'completed'}
                    onCheckedChange={() => toggleTask(task.id, task.status)}
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                      task.status === 'completed' ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.title}
                  </label>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/tasks" className="w-full">
            <Button variant="outline" className="w-full">
              View All Tasks
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }, [tasks, isLoading, error, toggleTask, getPriorityColor]);

  return (
    <Card>
      <CardContent className="pb-2">  
        {taskCards}
      </CardContent>
    </Card>
  );
}