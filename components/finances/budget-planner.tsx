"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { PlusCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const budgetFormSchema = z.object({
  category: z.string({
    required_error: "Please select a category.",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

// Define interfaces for our data models
interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string; // ISO date string (first day of month)
  created_at: string;
  updated_at: string;
}

interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

// Create a custom Progress component with color gradients based on percentage
const BudgetProgress = ({ value, className }: { value: number, className?: string }) => {
  // Determine color based on percentage
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 85) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <Progress
      value={value > 100 ? 100 : value}
      className={cn("h-2", className)}
    >
      <div 
        className={cn("h-full rounded-full absolute top-0 left-0", getProgressColor(value))}
        style={{ width: `${value > 100 ? 100 : value}%` }}
      />
    </Progress>
  );
};
BudgetProgress.displayName = "BudgetProgress";

export default function BudgetPlanner() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const budgetCategories = [
    "housing",
    "transportation",
    "food",
    "utilities",
    "healthcare",
    "entertainment",
    "personal",
    "education",
    "shopping",
    "travel",
    "savings",
    "other",
  ];

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: "",
      amount: "",
    },
  });

  // Format current month for display
  const formattedMonth = format(currentMonth, "MMMM yyyy");
  
  // Navigate between months
  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Calculate budget with spending data
  const fetchBudgetData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        setError("You must be logged in to view budget data");
        setIsLoading(false);
        return;
      }

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const monthString = format(monthStart, "yyyy-MM-dd");

      // Fetch budgets for the current month
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", monthString);

      if (budgetError) {
        throw new Error(budgetError.message);
      }

      // Fetch expenses for the current month to calculate spending
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("category, amount, date")
        .eq("user_id", user.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"));

      if (expenseError) {
        throw new Error(expenseError.message);
      }

      // Calculate spending by category
      const spendingByCategory: Record<string, number> = {};
      
      expenseData?.forEach(expense => {
        if (!spendingByCategory[expense.category]) {
          spendingByCategory[expense.category] = 0;
        }
        spendingByCategory[expense.category] += parseFloat(expense.amount as any);
      });

      // Combine budget and spending data
      const budgetsWithSpending = (budgetData || []).map(budget => {
        const spent = spendingByCategory[budget.category] || 0;
        const remaining = budget.amount - spent;
        const percentage = (spent / budget.amount) * 100;
        
        return {
          ...budget,
          spent,
          remaining,
          percentage
        };
      });

      // Add categories with spending but no budget
      Object.entries(spendingByCategory).forEach(([category, spent]) => {
        const hasBudget = budgetsWithSpending.some(b => b.category === category);
        if (!hasBudget) {
          budgetsWithSpending.push({
            id: `temp-${category}`,
            user_id: user.id,
            category,
            amount: 0,
            month: monthString,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            spent,
            remaining: -spent,
            percentage: 100
          });
        }
      });

      // Sort by percentage (highest first)
      budgetsWithSpending.sort((a, b) => b.percentage - a.percentage);
      
      setBudgets(budgetsWithSpending);
    } catch (err: any) {
      console.error("Error fetching budget data:", err);
      setError(err.message || "Failed to load budget data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch budget data when component mounts or month changes
  useEffect(() => {
    fetchBudgetData();
  }, [user, currentMonth]);

  // Handle form submission
  const onSubmit = async (values: BudgetFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!user?.id) {
        setError("You must be logged in to set a budget");
        return;
      }

      const monthString = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      
      // Check if budget for this category already exists for this month
      const { data: existingBudget, error: checkError } = await supabase
        .from("budgets")
        .select("id")
        .eq("user_id", user.id)
        .eq("month", monthString)
        .eq("category", values.category)
        .maybeSingle();

      if (checkError) {
        throw new Error(checkError.message);
      }

      let result;

      if (existingBudget) {
        // Update existing budget
        result = await supabase
          .from("budgets")
          .update({
            amount: parseFloat(values.amount),
            updated_at: new Date().toISOString()
          })
          .eq("id", existingBudget.id)
          .select("*")
          .single();
      } else {
        // Insert new budget
        result = await supabase
          .from("budgets")
          .insert({
            user_id: user.id,
            category: values.category,
            amount: parseFloat(values.amount),
            month: monthString,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select("*")
          .single();
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Refresh budget data and close dialog
      form.reset();
      setIsAddDialogOpen(false);
      fetchBudgetData();
    } catch (err: any) {
      console.error("Error setting budget:", err);
      setError(err.message || "Failed to set budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a budget
  const handleDeleteBudget = async (budgetId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Only delete real budgets (not temporary ones for categories with spending but no budget)
      if (!budgetId.startsWith("temp-")) {
        const { error: deleteError } = await supabase
          .from("budgets")
          .delete()
          .eq("id", budgetId);

        if (deleteError) {
          throw new Error(deleteError.message);
        }
      }

      // Refresh budget data
      fetchBudgetData();
    } catch (err: any) {
      console.error("Error deleting budget:", err);
      setError(err.message || "Failed to delete budget");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total budget and spending
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Budget Planner</h2>
          <p className="text-muted-foreground">
            Plan and track your spending by category.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Set Budget
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <h3 className="text-lg font-medium">{formattedMonth}</h3>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall budget summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Overall Budget</CardTitle>
          <CardDescription>Your total budget and spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <BudgetProgress value={overallPercentage} />
            <div className="flex justify-between text-sm">
              <div>
                <div className="font-medium">Total Budget</div>
                <div className="text-muted-foreground">${totalBudget.toFixed(2)}</div>
              </div>
              <div>
                <div className="font-medium">Spent</div>
                <div className="text-muted-foreground">${totalSpent.toFixed(2)}</div>
              </div>
              <div>
                <div className="font-medium">Remaining</div>
                <div className={cn("font-medium", 
                  totalRemaining < 0 ? "text-red-500" : "text-green-500"
                )}>
                  ${totalRemaining.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No budget data found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Set your first budget category to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="capitalize">{budget.category}</CardTitle>
                    <CardDescription>
                      {budget.amount > 0 
                        ? `${budget.percentage.toFixed(0)}% of budget used`
                        : "No budget set"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBudget(budget.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <BudgetProgress value={budget.percentage} />
                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">Budget</div>
                      <div className="text-muted-foreground">
                        ${budget.amount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Spent</div>
                      <div className="text-muted-foreground">
                        ${budget.spent.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Remaining</div>
                      <div
                        className={cn(
                          "font-medium",
                          budget.remaining < 0
                            ? "text-red-500"
                            : "text-green-500"
                        )}
                      >
                        ${budget.remaining.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Budget</DialogTitle>
            <DialogDescription>
              Set a monthly budget for a specific category.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Budget Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Budget
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
