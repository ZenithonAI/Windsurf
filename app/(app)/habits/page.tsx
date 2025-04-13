"use client";

import React, { useState } from 'react';
import { useHabits } from '@/lib/hooks/use-habits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { HabitItem } from '@/components/habits/habit-item';
import { HabitForm } from '@/components/habits/habit-form';
import { HabitWithStreak } from '@/lib/hooks/use-habits';

export default function HabitsPage() {
  const { 
    habits, isLoading, error, 
    addHabit, updateHabit, refetch, 
    toggleHabit, incrementProgress, deleteHabit 
  } = useHabits();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStreak | null>(null);

  const handleAddHabitClick = () => {
    setEditingHabit(null); // Ensure we are in 'add' mode
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingHabit(null); // Clear editing state on close
  };

  const handleEditClick = (habit: HabitWithStreak) => {
    setEditingHabit(habit);
    setIsAddModalOpen(true);
  };

  console.log('[HabitsPage] Habits state before map:', habits);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Habit Tracker</CardTitle>
        <Button size="sm" onClick={handleAddHabitClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Habit
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading habits...</p>
        ) : habits.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No habits added yet. Click 'Add Habit' to start!</p>
        ) : (
          <div className="space-y-4">
            {habits.map(habit => 
              <HabitItem 
                key={habit.id} 
                habit={habit} 
                toggleHabit={toggleHabit} 
                incrementProgress={incrementProgress} 
                deleteHabit={deleteHabit}
                onEdit={handleEditClick} // Pass edit handler
              />
            )}
          </div>
        )}
      </CardContent>

      <HabitForm
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onHabitAddedOrUpdated={handleCloseModal} // Use a more general name
        initialData={editingHabit} // Pass editing data
        refetchHabits={refetch} // Pass refetch function down
      />

    </Card>
  );
}
