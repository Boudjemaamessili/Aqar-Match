import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
import HomePage from "@/pages/home";
import BrowseListingsPage from "@/pages/listings/index";
import NewListingPage from "@/pages/listings/new";
import ListingDetailPage from "@/pages/listings/[id]";
import MatchSuccessPage from "@/pages/match";
import InquiriesPage from "@/pages/inquiries";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/listings" component={BrowseListingsPage} />
      <Route path="/listings/new" component={NewListingPage} />
      <Route path="/listings/:id" component={ListingDetailPage} />
      <Route path="/match" component={MatchSuccessPage} />
      <Route path="/inquiries" component={InquiriesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster position="top-center" dir="rtl" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
