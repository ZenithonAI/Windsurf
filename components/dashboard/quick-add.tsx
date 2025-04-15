"use client";

import { useState } from "react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Calendar, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useHabits } from "@/lib/hooks/use-habits";
import { toast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateTaskInput } from "@/lib/services/task-service";
import { CreateHabitInput, Habit } from "@/lib/services/habit-service";

export function QuickAdd() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("task");
  
  // Task state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(getTodayDateString());
  const [taskPriority, setTaskPriority] = useState("medium");
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  // Habit state
  const [habitName, setHabitName] = useState("");
  const [habitType, setHabitType] = useState("daily");
  const [habitTarget, setHabitTarget] = useState("1");
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  
  // Hooks
  const { addTask } = useTasks();
  const { addHabit } = useHabits();
  
  // Get today's date in YYYY-MM-DD format
  function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  
  async function handleAddTask() {
    if (!taskTitle.trim() || !user) {
      toast({
        title: "Error",
        description: !taskTitle.trim() ? "Task title is required" : "You must be logged in to add tasks",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsAddingTask(true);
      
      // Format the due date to include the time (noon to avoid timezone issues)
      const formattedDueDate = `${taskDueDate}T12:00:00`;
      
      // Create the task object with all required properties
      const taskData: CreateTaskInput = {
        title: taskTitle,
        description: "",
        due_date: formattedDueDate,
        priority: taskPriority,
        status: "todo",
        user_id: user.id
      };
      
      await addTask(taskData);
      
      // Clear the form
      setTaskTitle("");
      setTaskDueDate(getTodayDateString());
      setTaskPriority("medium");
      
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    } finally {
      setIsAddingTask(false);
    }
  }
  
  async function handleAddHabit() {
    if (!habitName.trim() || !user) {
      toast({
        title: "Error",
        description: !habitName.trim() ? "Habit name is required" : "You must be logged in to add habits",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsAddingHabit(true);
      
      const targetNumber = parseInt(habitTarget);
      
      // Create the habit object with all required properties
      const habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
        name: habitName,
        description: "",
        type: habitType as "daily" | "quantifiable", 
        target: targetNumber,
        frequency: "daily", 
        reminder_time: null,
        target_per_day: targetNumber
      };
      
      await addHabit(habitData);
      
      // Clear the form
      setHabitName("");
      setHabitType("daily");
      setHabitTarget("1");
      
      toast({
        title: "Success",
        description: "Habit added successfully",
      });
    } catch (error) {
      console.error("Error adding habit:", error);
      toast({
        title: "Error",
        description: "Failed to add habit",
        variant: "destructive",
      });
    } finally {
      setIsAddingHabit(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <PlusCircle className="mr-2 h-5 w-5 text-primary" />
          Quick Add
        </CardTitle>
        <CardDescription>
          Quickly add new tasks or habits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="task" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="task" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Task
            </TabsTrigger>
            <TabsTrigger value="habit" className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Habit
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="task" className="space-y-4 mt-0">
            <div className="space-y-3">
              <Input
                placeholder="Enter task title..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">
                    Due Date
                  </span>
                  <Input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">
                    Priority
                  </span>
                  <Select 
                    value={taskPriority} 
                    onValueChange={setTaskPriority}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAddTask} 
              disabled={isAddingTask || !taskTitle.trim() || !user}
            >
              {isAddingTask ? (
                <>
                  <Calendar className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Task
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="habit" className="space-y-4 mt-0">
            <div className="space-y-3">
              <Input
                placeholder="Enter habit name..."
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">
                    Type
                  </span>
                  <Select 
                    value={habitType} 
                    onValueChange={setHabitType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="quantifiable">Quantifiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">
                    Target {habitType === "quantifiable" ? "(units)" : ""}
                  </span>
                  <Input
                    type="number"
                    min="1"
                    value={habitTarget}
                    onChange={(e) => setHabitTarget(e.target.value)}
                    disabled={habitType === "daily"}
                  />
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAddHabit}
              disabled={isAddingHabit || !habitName.trim() || !user}
            >
              {isAddingHabit ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Habit
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
