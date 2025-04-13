"use client";

import React from 'react';
import { HabitWithStreak, useHabits } from '@/lib/hooks/use-habits';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // For simple toggle
import { Card } from '@/components/ui/card'; // Can wrap item in a simple card/div
import { Trash2, Plus, Minus, CheckCircle2, XCircle, Repeat, Pencil } from 'lucide-react';
import { Progress } from '@/components/ui/progress'; // For progress bar

interface HabitItemProps {
  habit: HabitWithStreak;
  // Pass down functions from the useHabits hook
  toggleHabit: ReturnType<typeof useHabits>['toggleHabit'];
  incrementProgress: ReturnType<typeof useHabits>['incrementProgress'];
  deleteHabit: ReturnType<typeof useHabits>['deleteHabit'];
  onEdit: (habit: HabitWithStreak) => void; // Add onEdit prop
}

export const HabitItem: React.FC<HabitItemProps> = ({ 
  habit, 
  toggleHabit, 
  incrementProgress, 
  deleteHabit,
  onEdit
}) => {
  const handleToggle = () => {
    // Toggle completion for the day
    toggleHabit(habit.id, habit.completed, habit.progress, habit.target);
  };

  const handleEdit = () => {
    onEdit(habit);
  };

  const handleIncrement = () => {
    // Increment progress for the day
    if (habit.progress < habit.target) {
      incrementProgress(habit.id, habit.progress, habit.target);
    }
  };

  const handleDelete = () => {
    // Ask for confirmation before deleting?
    if (window.confirm(`Are you sure you want to delete the habit "${habit.name}"?`)) {
        deleteHabit(habit.id);
    }
  };

  const isQuantifiable = habit.target > 1;
  const progressPercentage = isQuantifiable ? (habit.progress / habit.target) * 100 : (habit.completed ? 100 : 0);

  return (
    <Card className="p-4 flex items-center justify-between gap-4">
      <div className="flex-1 space-y-1">
        <p className="font-medium">{habit.name}</p>
        <p className="text-sm text-muted-foreground">Streak: {habit.streak} days</p>
        {isQuantifiable && (
          <div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-right mt-1">{habit.progress} / {habit.target}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isQuantifiable ? (
          // Buttons for quantifiable habits (increment/decrement? or just increment?)
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleIncrement}
            disabled={habit.completed} // Disable if target already met
            aria-label={`Increment progress for ${habit.name}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          // Checkbox for simple daily habits
          <Button 
            variant={habit.completed ? "secondary" : "outline"}
            size="icon" 
            onClick={handleToggle}
            aria-label={habit.completed ? `Mark ${habit.name} as incomplete` : `Mark ${habit.name} as complete`}
          >
            {habit.completed ? <XCircle className="h-5 w-5 text-muted-foreground" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleEdit}
          aria-label={`Edit habit ${habit.name}`}
        >
          <Pencil className="h-4 w-4 text-blue-600" /> 
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDelete}
          aria-label={`Delete habit ${habit.name}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
};
