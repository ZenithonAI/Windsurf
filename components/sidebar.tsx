"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BookText,
  Calendar,
  CheckSquare,
  Coins,
  Goal,
  Home,
  LayoutDashboard,
  ListTodo,
  MessagesSquare,
  Settings,
  Sparkles,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    title: string;
    href: string;
    icon: React.ReactNode;
    section?: string;
  }[];
}

export function Sidebar() {
  const { signOut } = useAuth();
  
  const sidebarNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      section: "Overview",
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: <ListTodo className="mr-2 h-4 w-4" />,
      section: "Productivity",
    },
    {
      title: "Habits",
      href: "/habits",
      icon: <Flame className="mr-2 h-4 w-4" />,
      section: "Productivity",
    },
    {
      title: "Projects",
      href: "/projects",
      icon: <CheckSquare className="mr-2 h-4 w-4" />,
      section: "Productivity",
    },
    {
      title: "Goals",
      href: "/goals",
      icon: <Goal className="mr-2 h-4 w-4" />,
      section: "Personal Growth",
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: <Calendar className="mr-2 h-4 w-4" />,
      section: "Planning",
    },
    {
      title: "Journal",
      href: "/journal",
      icon: <BookText className="mr-2 h-4 w-4" />,
      section: "Personal Growth",
    },
    {
      title: "Finances",
      href: "/finances",
      icon: <Coins className="mr-2 h-4 w-4" />,
      section: "Finance",
    },
    {
      title: "AI Assistant",
      href: "/assistant",
      icon: <Sparkles className="mr-2 h-4 w-4" />,
      section: "Tools",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      section: "System",
    },
  ];

  return (
    <div className="hidden border-r bg-background md:block md:w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Home className="h-6 w-6" />
            <span className="text-lg">Personal Living</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 pt-4">
          <SidebarNav items={sidebarNavItems} />
        </ScrollArea>
        <div className="mt-auto border-t p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={signOut}>
              Log out
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarNav({ items, className, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  
  // Group items by section
  const sections = items.reduce((acc, item) => {
    const section = item.section || "Other";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <nav className={cn("grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center", className)} {...props}>
      {Object.entries(sections).map(([section, sectionItems]) => (
        <div key={section} className="mb-4">
          <h3 className="mb-1 px-4 text-xs font-medium text-muted-foreground">{section}</h3>
          <Separator className="mb-2" />
          {sectionItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
              )}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}