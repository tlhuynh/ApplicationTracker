import { Outlet, useNavigate } from 'react-router';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/AppSidebar';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function App() {
  const { user, logout, isDemoMode, exitDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleExitDemo = () => {
    exitDemoMode();
    navigate('/login', { replace: true });
  };

  return (
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-lg font-semibold">Job Application Tracker</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user}</span>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isDemoMode ? handleExitDemo : handleLogout}
                  aria-label={isDemoMode ? 'Exit demo mode' : 'Log out'}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {isDemoMode && (
              <div className="flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2
  text-sm text-amber-700 dark:text-amber-400">
                  <span>
                    Demo mode — data is temporary and will be lost when you close the browser.
                  </span>
                <Button variant="outline" size="sm" onClick={handleExitDemo}>
                  Sign In
                </Button>
              </div>
            )}

            <main className="flex-1 p-4">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster toastOptions={{ duration: 6000 }} />
    </ThemeProvider>
  );
}
