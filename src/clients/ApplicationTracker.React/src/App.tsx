import { Outlet } from 'react-router';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/AppSidebar';
import { Toaster } from '@/components/ui/sonner';

export function App() {
  return (
    <>  {/*This and its ending pair are call a fragment allowing you to wrap multiple sibling elements as a single root*/}
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-lg font-semibold">Job Application Tracker</span>
            </header>
            <main className="flex-1 p-4">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster /> {/*Not inside sidebar and tooltip because it render a portal which is a floating element attached to body*/}
    </>
  );
}
