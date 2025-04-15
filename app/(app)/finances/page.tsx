"use client";

import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Coins, CreditCard, LineChart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import FinancialSummary from "@/components/finances/financial-summary";
import SubscriptionsList from "@/components/finances/subscriptions-list";
import { ExpensesList } from "@/components/finances/expenses-list";
import BudgetPlanner from "@/components/finances/budget-planner";
import PlaidConnector from "@/components/finances/plaid-connector";

// Define interface for the ExpensesList ref
interface ExpensesListRef {
  openAddExpenseDialog: () => void;
}

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const expensesRef = useRef<ExpensesListRef>(null);

  const handleAddExpense = () => {
    setActiveTab("expenses");
    // Allow tab change to complete before triggering add expense
    setTimeout(() => {
      if (expensesRef.current) {
        expensesRef.current.openAddExpenseDialog();
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finances</h1>
          <p className="text-muted-foreground">
            Manage your expenses, budget, and subscriptions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setActiveTab("connect")}>
            <CreditCard className="mr-2 h-4 w-4" />
            Connect Bank
          </Button>
          <Button onClick={handleAddExpense}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center">
            <LineChart className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center">
            <Coins className="mr-2 h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center">
            <LineChart className="mr-2 h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="connect" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            Connect
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <FinancialSummary />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsList />
        </TabsContent>
        
        <TabsContent value="expenses" className="space-y-4">
          <ExpensesList ref={expensesRef} />
        </TabsContent>
        
        <TabsContent value="budget" className="space-y-4">
          <BudgetPlanner />
        </TabsContent>
        
        <TabsContent value="connect" className="space-y-4">
          <PlaidConnector />
        </TabsContent>
      </Tabs>
    </div>
  );
}
