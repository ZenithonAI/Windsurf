"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, CreditCard, Link2, PiggyBank, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Simulating Plaid integration
// In a real app, you'd use the Plaid Link SDK and backend integration
interface ConnectedAccount {
  id: string;
  name: string;
  institution: string;
  type: "checking" | "savings" | "credit" | "investment";
  balance: number;
  mask: string; // Last 4 digits
  connected_at: string;
  logo: string;
}

// Sample data for connected accounts
const SAMPLE_ACCOUNTS: ConnectedAccount[] = [
  {
    id: "acc_123",
    name: "Primary Checking",
    institution: "Chase",
    type: "checking",
    balance: 4280.42,
    mask: "4567",
    connected_at: "2025-03-15T14:30:00Z",
    logo: "https://logo.clearbit.com/chase.com",
  },
  {
    id: "acc_456",
    name: "Savings Account",
    institution: "Bank of America",
    type: "savings",
    balance: 12750.89,
    mask: "8901",
    connected_at: "2025-03-15T14:35:00Z",
    logo: "https://logo.clearbit.com/bankofamerica.com",
  },
  {
    id: "acc_789",
    name: "Credit Card",
    institution: "Capital One",
    type: "credit",
    balance: -430.76,
    mask: "2345",
    connected_at: "2025-03-15T14:40:00Z",
    logo: "https://logo.clearbit.com/capitalone.com",
  }
];

// Sample banks for connection
const BANKS = [
  { id: "chase", name: "Chase", logo: "https://logo.clearbit.com/chase.com" },
  { id: "bofa", name: "Bank of America", logo: "https://logo.clearbit.com/bankofamerica.com" },
  { id: "capitalone", name: "Capital One", logo: "https://logo.clearbit.com/capitalone.com" },
  { id: "wells", name: "Wells Fargo", logo: "https://logo.clearbit.com/wellsfargo.com" },
  { id: "citi", name: "Citibank", logo: "https://logo.clearbit.com/citi.com" },
  { id: "usbank", name: "US Bank", logo: "https://logo.clearbit.com/usbank.com" },
  { id: "pnc", name: "PNC Bank", logo: "https://logo.clearbit.com/pnc.com" },
  { id: "td", name: "TD Bank", logo: "https://logo.clearbit.com/td.com" },
];

// Get account type badge color
function getAccountTypeColor(type: string) {
  switch (type) {
    case "checking":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "savings":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "credit":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "investment":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
  }
}

export default function PlaidConnector() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isPlaidLoading, setIsPlaidLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch connected accounts
  useEffect(() => {
    async function fetchConnectedAccounts() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // In a real app, fetch from Supabase here
        // For now, using sample data
        setTimeout(() => {
          setConnectedAccounts(SAMPLE_ACCOUNTS);
          setIsLoading(false);
        }, 1000); // Simulate network delay
      } catch (error) {
        console.error('Error fetching connected accounts:', error);
        setError('Failed to load connected accounts');
        setIsLoading(false);
      }
    }

    fetchConnectedAccounts();
  }, [user, supabase]);

  // Simulate connecting a bank
  const handleConnectBank = useCallback(async () => {
    if (!selectedBank) return;
    
    try {
      setIsPlaidLoading(true);
      
      // Simulate Plaid Link flow
      // In a real app, you would initialize Plaid Link here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful connection
      toast.success("Bank connected successfully");
      setIsLinkDialogOpen(false);
      setSelectedBank(null);
      
      // In a real app, you'd use the real data returned from Plaid
      // For now, we'll just use the sample data
      setConnectedAccounts(SAMPLE_ACCOUNTS);
    } catch (error) {
      console.error('Error connecting bank:', error);
      toast.error("Failed to connect bank");
    } finally {
      setIsPlaidLoading(false);
    }
  }, [selectedBank]);

  // Simulate refreshing account data
  const handleRefreshAccounts = async () => {
    try {
      setIsRefreshing(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update with same data for simulation
      setConnectedAccounts([...SAMPLE_ACCOUNTS]);
      toast.success("Account data refreshed");
    } catch (error) {
      console.error('Error refreshing accounts:', error);
      toast.error("Failed to refresh account data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Simulate disconnecting an account
  const handleDisconnectAccount = async (accountId: string) => {
    try {
      // In a real app, call your backend to remove the Plaid Item
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the UI
      setConnectedAccounts(connectedAccounts.filter(account => account.id !== accountId));
      toast.success("Account disconnected");
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error("Failed to disconnect account");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Bank Accounts</CardTitle>
          <CardDescription>Link your bank accounts to track your finances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Bank Accounts</CardTitle>
          <CardDescription>Connect and manage your financial accounts</CardDescription>
        </div>
        <div className="flex gap-2">
          {connectedAccounts.length > 0 && (
            <Button variant="outline" onClick={handleRefreshAccounts} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          )}
          <Button onClick={() => setIsLinkDialogOpen(true)}>
            <Link2 className="mr-2 h-4 w-4" />
            Connect Account
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {connectedAccounts.length === 0 ? (
          <div className="py-12 text-center">
            <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-semibold">No accounts connected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your bank accounts to automatically track your transactions and balances.
            </p>
            <Button onClick={() => setIsLinkDialogOpen(true)} className="mt-4">
              <Link2 className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>
                This is a demonstration of Plaid integration. In a real app, you would connect to actual bank accounts.
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-4">
              {connectedAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 relative">
                      <img 
                        src={account.logo} 
                        alt={account.institution} 
                        className="rounded-md object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Bank';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{account.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{account.institution}</span>
                        <span>•••• {account.mask}</span>
                        <Badge 
                          variant="outline" 
                          className={getAccountTypeColor(account.type)}
                        >
                          {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={account.balance < 0 ? "text-red-500 font-medium" : "font-medium"}>
                      ${Math.abs(account.balance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-muted-foreground mt-1"
                      onClick={() => handleDisconnectAccount(account.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Bank Connection Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your Bank</DialogTitle>
            <DialogDescription>
              Select your bank to securely connect your accounts. Your credentials are never stored.
            </DialogDescription>
          </DialogHeader>
          
          {isPlaidLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-center text-sm text-muted-foreground">
                Connecting to your bank... Please wait.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
              {BANKS.map((bank) => (
                <div
                  key={bank.id}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedBank === bank.id ? "border-primary bg-primary/10" : ""
                  }`}
                  onClick={() => setSelectedBank(bank.id)}
                >
                  <div className="h-12 w-12 relative flex items-center justify-center">
                    <img 
                      src={bank.logo} 
                      alt={bank.name} 
                      className="rounded-md object-contain max-h-full max-w-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Bank';
                      }}
                    />
                    {selectedBank === bank.id && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-center font-medium">{bank.name}</span>
                </div>
              ))}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsLinkDialogOpen(false);
                setSelectedBank(null);
              }}
              disabled={isPlaidLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConnectBank} 
              disabled={!selectedBank || isPlaidLoading}
            >
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
