import React, { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_INPUTS, computeWAI, decide, allowedWorkloadNames } from "../lib/hydro";

const ScenarioContext = createContext(null);

export function ScenarioProvider({ children }) {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);

  const setInput = (key, value) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const reset = () => setInputs(DEFAULT_INPUTS);

  const value = useMemo(() => {
    const wai = computeWAI(inputs);
    const decision = decide(wai);
    const allowed = allowedWorkloadNames(decision);
    return { inputs, setInput, reset, wai, decision, allowed };
  }, [inputs]);

  return (
    <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>
  );
}

export const useScenario = () => useContext(ScenarioContext);
