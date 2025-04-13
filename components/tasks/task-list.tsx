"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Task } from "@/lib/services/task-service";
import { TaskActions } from "@/components/tasks/task-actions";
import { TaskForm } from "@/components/tasks/task-form";

interface TaskListProps {
  tasks: Task[];
  type: "today" | "tomorrow" | "week" | "all" | "completed";
  isLoading?: boolean;
  onToggleStatus: (id: string, currentStatus: string) => Promise<void>;
  onUpdateTask: (task: Task) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onCreateTask?: (values: any) => Promise<void>;
}

export function TaskList({ 
  tasks, 
  type, 
  isLoading = false,
  onToggleStatus,
  onUpdateTask,
  onDeleteTask,
  onCreateTask
}: TaskListProps) {
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-500 dark:bg-red-900/20">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-500 dark:bg-yellow-900/20">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-green-100 text-green-500 dark:bg-green-900/20">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    
    try {
      // Handle null safely by returning a default value
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      // If date parsing fails, return a fallback string
      return dateString || "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No tasks found</h3>
        <p className="text-muted-foreground mt-1">
          {type === "today"
            ? "You don't have any tasks scheduled for today."
            : type === "tomorrow"
            ? "You don't have any tasks scheduled for tomorrow."
            : type === "week"
            ? "You don't have any tasks scheduled for the next 7 days."
            : type === "completed"
            ? "You don't have any completed tasks."
            : "You don't have any tasks."}
        </p>
        {onCreateTask ? (
          <TaskForm 
            onSubmit={onCreateTask}
            trigger={
              <Button className="mt-4">Create a new task</Button>
            }
          />
        ) : (
          <Button className="mt-4" disabled>Create a new task</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: "50px" }}>Status</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead style={{ width: "100px" }}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => onToggleStatus(task.id, task.status || 'todo')}
                />
              </TableCell>
              <TableCell className={task.status === "completed" ? "line-through text-muted-foreground" : ""}>
                <div>
                  <div>{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {task.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getPriorityBadge(task.priority || 'unknown')}
              </TableCell>
              <TableCell>
                {formatDate(task.due_date)}
              </TableCell>
              <TableCell>
                <TaskActions 
                  task={task} 
                  onEdit={onUpdateTask}
                  onDelete={onDeleteTask}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}