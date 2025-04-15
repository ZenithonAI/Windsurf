"use client";

import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingDown, TrendingUp, CreditCard, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Sample data (later this will be fetched from database)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5733', '#C70039'];

// Define types for financial data
interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

interface IncomeExpenseItem {
  month: string;
  amount: number;
}

interface FinancialData {
  income: number;
  expenses: number;
  savings: number;
  subscriptionTotal: number;
  expensesByCategory: ExpenseCategory[];
  incomeHistory: IncomeExpenseItem[];
  expenseHistory: IncomeExpenseItem[];
}

export default function FinancialSummary() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData>({
    income: 0,
    expenses: 0,
    savings: 0,
    subscriptionTotal: 0,
    expensesByCategory: [],
    incomeHistory: [],
    expenseHistory: []
  });

  useEffect(() => {
    async function fetchFinancialData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Get current date and calculate first day of the past 6 months
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of month
        
        // Format dates for queries
        const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
        
        // Get all expenses 
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('amount, category, date')
          .eq('user_id', user.id)
          .gte('date', sixMonthsAgo.toISOString().slice(0, 10));
        
        if (expensesError) throw new Error(expensesError.message);
        
        // Get all income
        const { data: income, error: incomeError } = await supabase
          .from('income')
          .select('amount, date')
          .eq('user_id', user.id)
          .gte('date', sixMonthsAgo.toISOString().slice(0, 10));
        
        if (incomeError) throw new Error(incomeError.message);
        
        // Get all subscriptions
        const { data: subscriptions, error: subscriptionsError } = await supabase
          .from('subscriptions')
          .select('amount, billing_cycle')
          .eq('user_id', user.id);
        
        if (subscriptionsError) throw new Error(subscriptionsError.message);
        
        // Calculate current month's income and expenses
        const currentMonthExpenses = expenses
          ? expenses
              .filter(expense => expense.date.startsWith(currentMonth))
              .reduce((sum, expense) => sum + Number(expense.amount), 0)
          : 0;
          
        const currentMonthIncome = income
          ? income
              .filter(inc => inc.date.startsWith(currentMonth))
              .reduce((sum, inc) => sum + Number(inc.amount), 0)
          : 0;
        
        // Calculate monthly subscription total
        const subscriptionTotal = subscriptions
          ? subscriptions.reduce((sum, sub) => {
              let monthlyAmount = Number(sub.amount);
              switch (sub.billing_cycle) {
                case 'weekly':
                  monthlyAmount = monthlyAmount * 4.33; // Average weeks in a month
                  break;
                case 'quarterly':
                  monthlyAmount = monthlyAmount / 3;
                  break;
                case 'yearly':
                  monthlyAmount = monthlyAmount / 12;
                  break;
              }
              return sum + monthlyAmount;
            }, 0)
          : 0;
        
        // Group expenses by category
        const expensesByCategory: ExpenseCategory[] = [];
        const categoryTotals: {[key: string]: number} = {};
        
        if (expenses) {
          expenses
            .filter(expense => expense.date.startsWith(currentMonth))
            .forEach(expense => {
              const category = expense.category.charAt(0).toUpperCase() + expense.category.slice(1);
              if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
              }
              categoryTotals[category] += Number(expense.amount);
            });
          
          // Convert to required format with colors
          Object.entries(categoryTotals).forEach(([name, value], index) => {
            expensesByCategory.push({
              name,
              value,
              color: COLORS[index % COLORS.length]
            });
          });
        }
        
        // Calculate income and expense history by month
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now);
          d.setMonth(d.getMonth() - i);
          months.push(d.toISOString().slice(0, 7)); // YYYY-MM format
        }
        
        const incomeHistory = months.map(month => {
          const monthName = new Date(month + '-01').toLocaleString('default', { month: 'short' });
          const amount = income
            ? income
                .filter(inc => inc.date.startsWith(month))
                .reduce((sum, inc) => sum + Number(inc.amount), 0)
            : 0;
          return { month: monthName, amount };
        });
        
        const expenseHistory = months.map(month => {
          const monthName = new Date(month + '-01').toLocaleString('default', { month: 'short' });
          const amount = expenses
            ? expenses
                .filter(expense => expense.date.startsWith(month))
                .reduce((sum, expense) => sum + Number(expense.amount), 0)
            : 0;
          return { month: monthName, amount };
        });
        
        // Calculate savings (income - expenses)
        const savings = currentMonthIncome - currentMonthExpenses;
        
        // Create the financial data object
        const realData: FinancialData = {
          income: currentMonthIncome,
          expenses: currentMonthExpenses,
          savings: savings,
          subscriptionTotal: subscriptionTotal,
          expensesByCategory: expensesByCategory,
          incomeHistory: incomeHistory,
          expenseHistory: expenseHistory
        };
        
        setFinancialData(realData);
      } catch (error: any) {
        console.error('Error fetching financial data:', error);
        setError(error.message || 'Failed to load financial data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFinancialData();
  }, [user, supabase]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(null).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">${financialData.income.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">${financialData.expenses.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-2xl font-bold">${financialData.savings.toLocaleString()}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                ({Math.round((financialData.savings / financialData.income) * 100)}%)
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscription Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">${financialData.subscriptionTotal.toLocaleString()}/mo</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>Track your financial data over time and by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history" className="space-y-4">
            <TabsList>
              <TabsTrigger value="history">Income & Expenses</TabsTrigger>
              <TabsTrigger value="categories">Expense Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financialData.incomeHistory.map((item, index) => ({
                    month: item.month,
                    income: item.amount,
                    expenses: financialData.expenseHistory[index].amount
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Bar dataKey="income" fill="#0088FE" name="Income" />
                  <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="categories" className="h-[350px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialData.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {financialData.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="flex flex-col justify-center">
                  <h4 className="text-sm font-medium mb-4">Expense Breakdown</h4>
                  <div className="space-y-2">
                    {financialData.expensesByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <span className="text-sm font-medium">${category.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
