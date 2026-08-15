import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ScenarioProvider } from "@/context/ScenarioContext";
import { Nav } from "@/components/Nav";
import Dashboard from "@/pages/Dashboard";
import Cooling from "@/pages/Cooling";
import Assistant from "@/pages/Assistant";

function App() {
  return (
    <div className="App min-h-screen hx-grain relative">
      <BrowserRouter>
        <ScenarioProvider>
          <Nav />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cooling" element={<Cooling />} />
            <Route path="/assistant" element={<Assistant />} />
          </Routes>
        </ScenarioProvider>
      </BrowserRouter>
      <Toaster theme="dark" position="top-right" richColors />
    </div>
  );
}

export default App;
