import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Users,
  Moon,
  Sun,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout, useGetBotStatus, getGetBotStatusQueryKey } from "@workspace/api-client-react";
import { useTheme } from "@/components/theme-provider";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  
  const { data: botStatus } = useGetBotStatus({
    query: {
      queryKey: getGetBotStatusQueryKey(),
      refetchInterval: 30000,
    }
  });

  const logout = useLogout();
  
  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      }
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/users", label: "Users", icon: Users },
    { href: "/translations", label: "Translations", icon: MessageSquare },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/admins", label: "Admins", icon: Shield },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-border justify-between">
          <div className="flex items-center gap-2 font-semibold font-mono tracking-tight text-primary">
            <Bot className="w-5 h-5" />
            <span>TRANSLATON_BOT</span>
          </div>
        </div>
        
        <div className="p-3 border-b border-border text-xs flex items-center justify-between font-mono bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", botStatus?.running ? "bg-green-500" : "bg-destructive animate-pulse")} />
            <span className="text-muted-foreground uppercase">
              {botStatus?.running ? 'Online' : 'Offline'}
            </span>
          </div>
          {botStatus?.botUsername && (
            <span className="text-muted-foreground truncate max-w-[100px]">@{botStatus.botUsername}</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  location.startsWith(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border flex flex-col gap-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 mr-2" />
            ) : (
              <Moon className="w-4 h-4 mr-2" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 md:hidden">
          <div className="flex items-center gap-2 font-semibold font-mono text-primary">
            <Bot className="w-5 h-5" />
            <span>TRANSLATON_BOT</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}