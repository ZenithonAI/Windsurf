"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import { type User } from '@supabase/supabase-js';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Calendar, ListTodo, CalendarClock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { useTasks } from "@/lib/hooks/use-tasks";
import { Task } from "@/lib/services/task-service";

const supabase = createClient();

export default function TasksPage() {
  // Always start with "today" tab to ensure users see their tasks
  const [activeTab, setActiveTab] = useState("today"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [forceRefresh, setForceRefresh] = useState(0); // Add state to force component refreshes
  
  // Get today's date in ISO format (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  
  // Get tomorrow's date in ISO format
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  // Get date for a week from now
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        setUser(currentUser);
        
        // Check if profile exists, create if not
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentUser.id)
          .single();
        
        if (profileError || !profile) {
          // Create the profile with the same ID as the auth user
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: currentUser.id,
              full_name: currentUser.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            
          if (insertError) {
            console.error('Failed to create profile:', insertError.message, insertError);
          } else {
            console.log('Profile created successfully');
          }
        }
      }
    };
    getUserData();
  }, [supabase]);

  // Use the tasks hook to fetch all tasks
  const { 
    tasks: allTasks, 
    isLoading, 
    error, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTaskComplete,
    refetch 
  } = useTasks();
  
  // Re-fetch tasks when the component mounts or when force refresh is triggered
  useEffect(() => {
    // This will trigger a re-fetch of tasks whenever forceRefresh changes
    if (refetch) {  
      refetch();
    }
  }, [forceRefresh, refetch]);

  // Filter tasks based on the search query
  const filteredTasks = allTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Filter tasks for different tabs
  const todayTasks = filteredTasks.filter(task => {
    if (!task.due_date) return false;
    
    // Create a Date object from the timestamp and extract YYYY-MM-DD in local timezone
    const taskDate = new Date(task.due_date);
    const taskDateStr = taskDate.toISOString().split('T')[0];
    
    // Simple date comparison 
    const isToday = taskDateStr === today;
    const isNotCompleted = task.status !== "completed";
    return isToday && isNotCompleted;
  });
  
  const tomorrowTasks = filteredTasks.filter(task => {
    if (!task.due_date) return false;
    
    // Create a Date object from the timestamp and extract YYYY-MM-DD in local timezone
    const taskDate = new Date(task.due_date);
    const taskDateStr = taskDate.toISOString().split('T')[0];
    
    // Compare with tomorrow's date
    const isTomorrow = taskDateStr === tomorrowStr;
    const isNotCompleted = task.status !== "completed";
    return isTomorrow && isNotCompleted;
  });
  
  const weekTasks = filteredTasks.filter(task => {
    if (!task.due_date) return false;
    
    // Create a Date object from the timestamp and extract YYYY-MM-DD in local timezone
    const taskDate = new Date(task.due_date);
    const taskDateStr = taskDate.toISOString().split('T')[0];
    
    // Simple date string comparison for week range - if the task due date is between today and next week
    return taskDateStr.localeCompare(today) >= 0 && 
           taskDateStr.localeCompare(nextWeekStr) <= 0 &&
           task.status !== "completed";
  });
  
  const allIncompleteTasks = filteredTasks.filter(task => task.status !== "completed");
  
  const completedTasks = filteredTasks.filter(task => task.status === "completed");

  // Function to handle task creation from form submission
  const handleCreateTask = async (values: any) => {
    if (!user) {
      console.error('Cannot create task: No authenticated user');
      return;
    }
    
    // Format the date properly for database storage
    let dueDate = values.due_date;
    if (dueDate instanceof Date) {
      // Set the time to mid-day to avoid timezone issues
      const localDate = new Date(dueDate);
      localDate.setHours(12, 0, 0, 0);
      dueDate = localDate.toISOString();
    } else if (typeof dueDate === 'string' && !dueDate.includes('T')) {
      // If it's a date string without time, add mid-day time
      dueDate = `${dueDate}T12:00:00.000Z`;
    } else {
      dueDate = dueDate.toISOString();
    }
    
    // Prepare the task object with user ID and default status
    const taskToCreate = {
      title: values.title,
      description: values.description || '',
      priority: values.priority,
      due_date: dueDate,
      user_id: user.id, // Make sure we include the user ID
      status: 'todo',
    };
    
    // Add the task using the hook function
    try {
      const newTask = await addTask(taskToCreate);
      
      // Increment the force refresh counter to trigger a re-render and data refresh
      setForceRefresh(prev => prev + 1);
      
      // Do NOT change the active tab - the code previously had a bug still redirecting to "all"
      // The TaskForm component has a Dialog that auto-closes, which preserves the current tab
       
       toast({
         title: "Task Created",
         description: "Your task has been added successfully.",
         variant: "default",
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (task: Task) => {
    await updateTask(task.id, task);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  const handleToggleTaskStatus = async (id: string, currentStatus: string) => {
    await toggleTaskComplete(id, currentStatus);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
            <p className="text-muted-foreground">
              There was an error loading your tasks. Please try again.
            </p>
          </div>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Organize and track your personal and work tasks
          </p>
        </div>
        <TaskForm 
          onSubmit={handleCreateTask}
          trigger={
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Task
            </Button>
          }
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <ListTodo className="mr-2 h-5 w-5 text-primary" />
              Task Manager
            </CardTitle>
            <div className="w-full max-w-sm">
              <Input
                type="search"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </CardHeader>
          <CardContent className="pb-0">
            <Tabs 
              defaultValue="today" 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-5 bg-muted">
                <TabsTrigger value="today" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Today</span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {todayTasks.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="tomorrow" className="flex items-center gap-1">
                  <CalendarClock className="h-4 w-4" />
                  <span className="hidden sm:inline">Tomorrow</span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {tomorrowTasks.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="week" className="flex items-center gap-1">
                  <span className="hidden sm:inline">Next 7 Days</span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {weekTasks.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="all">All Tasks</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="m-0 py-4">
                <TaskList 
                  tasks={todayTasks} 
                  type="today" 
                  isLoading={isLoading}
                  onToggleStatus={handleToggleTaskStatus}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onCreateTask={handleCreateTask}
                />
              </TabsContent>
              
              <TabsContent value="tomorrow" className="m-0 py-4">
                <TaskList 
                  tasks={tomorrowTasks} 
                  type="tomorrow" 
                  isLoading={isLoading}
                  onToggleStatus={handleToggleTaskStatus}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onCreateTask={handleCreateTask}
                />
              </TabsContent>
              
              <TabsContent value="week" className="m-0 py-4">
                <TaskList 
                  tasks={weekTasks} 
                  type="week" 
                  isLoading={isLoading}
                  onToggleStatus={handleToggleTaskStatus}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onCreateTask={handleCreateTask}
                />
              </TabsContent>
              
              <TabsContent value="all" className="m-0 py-4">
                <TaskList 
                  tasks={filteredTasks} 
                  type="all" 
                  isLoading={isLoading}
                  onToggleStatus={handleToggleTaskStatus}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onCreateTask={handleCreateTask}
                />
              </TabsContent>
              
              <TabsContent value="completed" className="m-0 py-4">
                <TaskList 
                  tasks={completedTasks} 
                  type="completed" 
                  isLoading={isLoading}
                  onToggleStatus={handleToggleTaskStatus}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onCreateTask={handleCreateTask}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}