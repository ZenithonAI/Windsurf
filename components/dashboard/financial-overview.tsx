"use client";

import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Plus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

// Sample data for financial overview
const SAMPLE_EXPENSES = [
  { name: "Housing", value: 1200, color: "hsl(var(--chart-1))" },
  { name: "Food", value: 450, color: "hsl(var(--chart-2))" },
  { name: "Transport", value: 200, color: "hsl(var(--chart-3))" },
  { name: "Entertainment", value: 150, color: "hsl(var(--chart-4))" },
  { name: "Others", value: 300, color: "hsl(var(--chart-5))" },
];

const SAMPLE_FINANCE_DATA = {
  income: 3500,
  expenses: 2300,
  savings: 1200,
  subscriptions: 85,
};

export function FinancialOverview() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <Coins className="mr-2 h-5 w-5 text-primary" />
            Financial Overview
          </CardTitle>
          <Link href="/finances">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add expense</span>
            </Button>
          </Link>
        </div>
        <CardDescription>Track your monthly expenses and savings</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Monthly Income</p>
            <div className="flex items-center">
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-base font-medium">${SAMPLE_FINANCE_DATA.income}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Monthly Expenses</p>
            <div className="flex items-center">
              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
              <span className="text-base font-medium">${SAMPLE_FINANCE_DATA.expenses}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Monthly Savings</p>
            <p className="text-base font-medium">${SAMPLE_FINANCE_DATA.savings}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Subscriptions</p>
            <p className="text-base font-medium">${SAMPLE_FINANCE_DATA.subscriptions}/mo</p>
          </div>
        </div>
        
        <div className="h-[150px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SAMPLE_EXPENSES}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={1}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {SAMPLE_EXPENSES.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/finances" className="w-full">
          <Button variant="outline" className="w-full">
            Manage Finances
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}