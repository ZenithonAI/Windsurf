"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { CalendarIcon, PlusCircle, AlertCircle, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const subscriptionFormSchema = z.object({
  name: z.string().min(2, {
    message: "Subscription name must be at least 2 characters.",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  billing_cycle: z.enum(["weekly", "monthly", "quarterly", "yearly"], {
    required_error: "Please select a billing cycle.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  next_billing_date: z.date({
    required_error: "Next billing date is required.",
  }),
  notes: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

// Define the subscription type based on our database schema
interface Subscription {
  id: string;
  name: string;
  amount: number;
  billing_cycle: "weekly" | "monthly" | "quarterly" | "yearly";
  category: string;
  next_billing_date: string; // ISO date string
  notes?: string;
  created_at: string;
}

export default function SubscriptionsList() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const subscriptionCategories = [
    "streaming",
    "software",
    "gaming",
    "news",
    "fitness",
    "music",
    "utilities",
    "memberships",
    "other",
  ];

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      billing_cycle: "monthly",
      category: "other",
      next_billing_date: new Date(),
      notes: "",
    },
  });

  // Calculate next billing date based on cycle
  const calculateNextBillingDate = (date: Date, cycle: string) => {
    switch (cycle) {
      case "weekly":
        return addWeeks(date, 1);
      case "monthly":
        return addMonths(date, 1);
      case "quarterly":
        return addMonths(date, 3);
      case "yearly":
        return addYears(date, 1);
      default:
        return date;
    }
  };

  // Format billing cycle text
  const formatBillingCycle = (cycle: string) => {
    return cycle.charAt(0).toUpperCase() + cycle.slice(1);
  };

  // Fetch subscriptions from Supabase
  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        setError("You must be logged in to view subscriptions");
        setIsLoading(false);
        return;
      }

      // Fetch subscriptions from the subscriptions table
      let query = supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("next_billing_date", { ascending: true });

      // Apply category filter if selected
      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      // Apply search query if provided
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setSubscriptions(data || []);
    } catch (err: any) {
      console.error("Error fetching subscriptions:", err);
      setError(err.message || "Failed to load subscriptions");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subscriptions when component mounts or filters change
  useEffect(() => {
    fetchSubscriptions();
  }, [user, selectedCategory, searchQuery]);

  // Handle form submission
  const onSubmit = async (values: SubscriptionFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!user?.id) {
        setError("You must be logged in to add a subscription");
        return;
      }

      // Insert new subscription into Supabase
      const { data, error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          name: values.name,
          amount: parseFloat(values.amount),
          billing_cycle: values.billing_cycle,
          category: values.category,
          next_billing_date: format(values.next_billing_date, "yyyy-MM-dd"),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("*")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Add the new subscription to the list and close the dialog
      setSubscriptions((prevSubscriptions) => [data, ...prevSubscriptions]);
      form.reset();
      setIsAddDialogOpen(false);
    } catch (err: any) {
      console.error("Error adding subscription:", err);
      setError(err.message || "Failed to add subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle subscription deletion
  const handleDeleteSubscription = async (subscriptionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Delete subscription from Supabase
      const { error: deleteError } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", subscriptionId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Remove deleted subscription from the list
      setSubscriptions((prevSubscriptions) => 
        prevSubscriptions.filter((subscription) => subscription.id !== subscriptionId)
      );
    } catch (err: any) {
      console.error("Error deleting subscription:", err);
      setError(err.message || "Failed to delete subscription");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total monthly cost
  const calculateMonthlyTotal = (subs: Subscription[]) => {
    return subs.reduce((total, sub) => {
      let monthlyAmount = sub.amount;
      
      // Convert all amounts to monthly
      switch (sub.billing_cycle) {
        case "weekly":
          monthlyAmount = sub.amount * 4.33; // Average weeks in a month
          break;
        case "quarterly":
          monthlyAmount = sub.amount / 3;
          break;
        case "yearly":
          monthlyAmount = sub.amount / 12;
          break;
      }
      
      return total + monthlyAmount;
    }, 0);
  };

  const monthlyTotal = calculateMonthlyTotal(subscriptions);
  const upcomingSubscriptions = subscriptions
    .filter(sub => {
      const date = new Date(sub.next_billing_date);
      return date <= addDays(new Date(), 7);
    })
    .sort((a, b) => 
      new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime()
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Subscriptions</h2>
          <p className="text-muted-foreground">
            Track your recurring payments and subscriptions.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[250px]"
          />
          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {subscriptionCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() +
                    category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm font-medium">
          Monthly Total: ${monthlyTotal.toFixed(2)}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {upcomingSubscriptions.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" aria-label="Upcoming payments alert" />
          <AlertTitle>Upcoming Payments</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {upcomingSubscriptions.map(sub => (
                <div key={sub.id} className="flex justify-between items-center text-sm">
                  <span>{sub.name}</span>
                  <div>
                    <span className="font-medium">${sub.amount.toFixed(2)}</span>
                    <span className="text-muted-foreground ml-2">
                      {format(new Date(sub.next_billing_date), "MMM d")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No subscriptions found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first subscription to get started.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead>Category</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>{subscription.name}</TableCell>
                <TableCell>${subscription.amount.toFixed(2)}</TableCell>
                <TableCell>{formatBillingCycle(subscription.billing_cycle)}</TableCell>
                <TableCell>{format(new Date(subscription.next_billing_date), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {subscription.category.charAt(0).toUpperCase() +
                      subscription.category.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubscription(subscription.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Subscription</DialogTitle>
            <DialogDescription>
              Enter the details for your new recurring subscription.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Netflix, Spotify, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billing_cycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Cycle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cycle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          <SelectItem value="all">All Categories</SelectItem>
                          {subscriptionCategories.map((category) => (
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
              </div>
              <FormField
                control={form.control}
                name="next_billing_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Next Billing Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details here..."
                        className="resize-none"
                        {...field}
                      />
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
                  Add Subscription
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
