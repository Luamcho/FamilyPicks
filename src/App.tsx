import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { PlanProvider } from "@/context/PlanContext";
import { AgeGate } from "@/components/AgeGate";
import { AppLayout } from "@/components/AppLayout";
import { Landing } from "@/pages/Landing";
import { Feed } from "@/pages/Feed";
import { Stats } from "@/pages/Stats";
import { Results } from "@/pages/Results";
import { Account } from "@/pages/Account";
import { NotFound } from "@/pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <PlanProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AgeGate />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<AppLayout />}>
              <Route path="/picks" element={<Feed />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/resultados" element={<Results />} />
              <Route path="/cuenta" element={<Account />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PlanProvider>
    </ThemeProvider>
  );
}
