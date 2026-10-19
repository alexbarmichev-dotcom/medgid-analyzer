
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Faq from "./pages/Faq";
import About from "./pages/About";
import Article from "./pages/Article";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import InstallBanner from "@/components/site/InstallBanner";

const AdminHome = lazy(() => import("./pages/AdminHome"));
const AdminFeedback = lazy(() => import("./pages/AdminFeedback"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/articles/:slug" element={<Article />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <InstallBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;