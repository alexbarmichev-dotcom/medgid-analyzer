
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Faq from "./pages/Faq";
import AdminHome from "./pages/AdminHome";
import AdminFeedback from "./pages/AdminFeedback";
import AdminPayments from "./pages/AdminPayments";
import AdminReviews from "./pages/AdminReviews";
import NotFound from "./pages/NotFound";

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
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;