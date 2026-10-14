
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Faq from "./pages/Faq";
import Article from "./pages/Article";
import AdminHome from "./pages/AdminHome";
import AdminFeedback from "./pages/AdminFeedback";
import AdminPayments from "./pages/AdminPayments";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminReviews from "./pages/AdminReviews";
import NotFound from "./pages/NotFound";
import InstallBanner from "@/components/site/InstallBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/articles/:slug" element={<Article />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <InstallBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;