import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ItemDetail from "./pages/ItemDetail";
import Dashboard from "./pages/Dashboard";
import Sell from "./pages/Sell";
import Pay from "./pages/Pay";
import Orders from "./pages/Orders";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/items/:id" component={ItemDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/orders" component={Orders} />
      <Route path="/sell" component={Sell} />
      <Route path="/pay/:itemId" component={Pay} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatbotWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
