"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useHabits, HabitWithStreak } from '@/lib/hooks/use-habits'; // Import HabitWithStreak
import { Button } from '@/components/ui/button';
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

// Zod schema for validation
const habitFormSchema = z.object({
  name: z.string().min(1, { message: 'Habit name is required.' }),
  description: z.string().optional(),
  type: z.enum(['daily', 'quantifiable']), // Type of habit
  target: z.coerce.number().int().min(1, { message: 'Target must be at least 1.' }).optional(), // Optional for daily, required for quantifiable
}).refine(data => data.type !== 'quantifiable' || (data.target !== undefined && data.target >= 1), {
  message: 'Target must be set for quantifiable habits.',
  path: ['target'], // Error applies to the target field
});

// Derive the type, but make target required as it's handled internally
type HabitFormData = z.infer<typeof habitFormSchema> & { target?: number }; 

interface HabitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onHabitAddedOrUpdated: () => void; // Unified callback
  refetchHabits: () => Promise<void>; // Add prop for refetching
  initialData?: HabitWithStreak | null; // Optional data for editing
}

export const HabitForm: React.FC<HabitFormProps> = ({ isOpen, onClose, onHabitAddedOrUpdated, refetchHabits, initialData }) => {
  const { addHabit, updateHabit } = useHabits(); // Add updateHabit
  const [selectedType, setSelectedType] = useState<'daily' | 'quantifiable'>('daily');

  const isEditMode = !!initialData;

  const form = useForm<HabitFormData>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'daily',
      target: 1, // Default target, might be overwritten by initialData
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch, setValue } = form;
  const typeValue = watch('type'); // Watch the type field to conditionally show target

  // Effect to populate form when initialData changes (for editing)
  useEffect(() => {
    // Reset form when dialog opens/closes
    if (isOpen) {
      if (initialData) {
        // Edit mode: Populate form
        setValue('name', initialData.name);
        setValue('description', initialData.description || '');
        setValue('type', initialData.type as 'daily' | 'quantifiable'); 
        setValue('target', initialData.target);
        setSelectedType(initialData.type as 'daily' | 'quantifiable');
      } else {
        // Add mode: Reset form
        reset();
        setSelectedType('daily');
        setValue('target', 1); // Reset target on open
      }
    }
  }, [isOpen, initialData, reset, setValue]);

  useEffect(() => {
    // Update internal state when form value changes
    setSelectedType(typeValue);
    // If switching back to daily, clear target validation requirement
    if (typeValue === 'daily') {
      setValue('target', undefined);
    }
  }, [typeValue, setValue]);

  const handleFormSubmit = async (data: HabitFormData) => {
    const habitData = {
      name: data.name,
      description: data.description || null,
      type: data.type,
      frequency: 'daily', // Keep frequency assumption
      target_per_day: data.type === 'quantifiable' ? (data.target ?? 1) : 1, // Use correct DB column name
      target: data.type === 'quantifiable' ? (data.target ?? 1) : 1, // Add target to satisfy type
      reminder_time: null, // Add reminder_time to satisfy type
    };

    if (isEditMode && initialData) {
      // Update existing habit
      await updateHabit(initialData.id, habitData);
      await refetchHabits(); // Refetch after successful update
    } else {
      // Add new habit
      await addHabit(habitData);
      // We might not strictly need to refetch after add if addHabit updates state correctly,
      // but for consistency and to ensure streaks are calculated, let's refetch.
      await refetchHabits(); // Refetch after successful add
    }
 
    onHabitAddedOrUpdated(); // Close modal and potentially trigger parent actions
    onClose(); // Close dialog
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for your habit.' : 'Fill in the details for your new habit.'} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input 
              id="name"
              autoComplete="off" 
              {...register('name')} 
              className="col-span-3" 
            />
            {errors.name && <p className="col-span-4 text-red-500 text-sm text-right">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea 
              id="description"
              autoComplete="off" 
              placeholder="(Optional) Add a short description..." 
              {...register('description')}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select 
              onValueChange={(value: 'daily' | 'quantifiable') => setValue('type', value, { shouldValidate: true })}
              value={selectedType} // Control select value via state/form
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select habit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily (Complete once)</SelectItem>
                <SelectItem value="quantifiable">Quantifiable (Track progress)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Conditionally show Target input */}
          {selectedType === 'quantifiable' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target" className="text-right">Daily Target</Label>
              <Input 
                id="target" 
                type="number" 
                min="1" 
                autoComplete="off"
                {...register('target', { valueAsNumber: true })}
                className="col-span-3" 
              />
              {errors.target && <p className="col-span-4 text-red-500 text-sm text-right">{errors.target.message}</p>}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
               <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Habit' : 'Save Habit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
