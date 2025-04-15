import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookText, Calendar, CheckSquare, ListTodo, Flame, Goal, Coins, Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuickAdd } from "./quick-add";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function DashboardQuickActions() {
  const router = useRouter();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const quickActions = [
    {
      icon: <ListTodo className="h-5 w-5" />,
      label: "Add Task",
      onClick: () => setShowQuickAdd(true),
    },
    {
      icon: <Flame className="h-5 w-5" />,
      label: "Track Habit",
      href: "/habits",
    },
    {
      icon: <CheckSquare className="h-5 w-5" />,
      label: "New Project",
      href: "/projects/new",
    },
    {
      icon: <BookText className="h-5 w-5" />,
      label: "Journal",
      href: "/journal/new",
    },
    {
      icon: <Goal className="h-5 w-5" />,
      label: "Set Goal",
      href: "/goals/new",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Schedule",
      href: "/calendar",
    },
    {
      icon: <Coins className="h-5 w-5" />,
      label: "Finances",
      href: "/finances",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      label: "Ask AI",
      href: "/assistant",
    },
  ];

  return (
    <>
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="p-0">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {quickActions.map((action, index) => (
              action.label === "Add Task" ? (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center justify-center gap-1 py-4 rounded-xl hover:bg-accent"
                  onClick={action.onClick}
                >
                  <div className="h-8 w-8 flex items-center justify-center">
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              ) : (
                <a
                  key={index}
                  href={action.href}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 py-4 rounded-xl hover:bg-accent text-inherit no-underline"
                >
                  <div className="h-8 w-8 flex items-center justify-center">
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </a>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent>
          <DialogTitle>Quick Add</DialogTitle>
          <QuickAdd />
        </DialogContent>
      </Dialog>
    </>
  );
}