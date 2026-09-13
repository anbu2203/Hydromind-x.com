import "@/App.css";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ScenarioProvider } from "@/context/ScenarioContext";
import { Nav } from "@/components/Nav";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Cooling = lazy(() => import("@/pages/Cooling"));
const Assistant = lazy(() => import("@/pages/Assistant"));
const ProtoV1 = lazy(() => import("@/pages/ProtoV1"));
const Gateway = lazy(() => import("@/pages/Gateway"));

const PageFallback = () => (
  <div className="max-w-[1400px] mx-auto px-5 py-20 flex items-center justify-center" data-testid="page-loading">
    <div className="font-mono text-xs uppercase tracking-[0.3em] text-hydro-cyan/70 animate-pulse-glow">
      Loading HydroMind-X…
    </div>
  </div>
);

function App() {
  return (
    <div className="App min-h-screen hx-grain relative">
      <BrowserRouter>
        <ScenarioProvider>
          <Nav />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cooling" element={<Cooling />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/proto" element={<ProtoV1 />} />
              <Route path="/proto/:mode" element={<ProtoV1 />} />
              <Route path="/gateway" element={<Gateway />} />
            </Routes>
          </Suspense>
        </ScenarioProvider>
      </BrowserRouter>
      <Toaster theme="dark" position="top-right" richColors />
    </div>
  );
}

export default App;
