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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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
                <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 p-4">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster /> {/*Not inside sidebar and tooltip because it render a portal which is a floating element attached to
  body*/}
    </ThemeProvider>
  );
}
