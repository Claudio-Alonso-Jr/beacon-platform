import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/app/AppShell";
import { AnalysisOverlay } from "@/app/AnalysisOverlay";
import { Home } from "@/screens/Home";
import { Dashboard } from "@/screens/Dashboard";
import { Report } from "@/screens/Report";
import { Showcase } from "@/screens/Showcase";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

/** Route changes always land at the top of the page. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/p/:handle" element={<Dashboard />} />
          <Route path="/report/:handle" element={<Report />} />
          <Route path="/design-system" element={<Showcase />} />
        </Routes>
          <AnalysisOverlay />
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
