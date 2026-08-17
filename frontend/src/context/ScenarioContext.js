import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_INPUTS, computeWAI, decide, allowedWorkloadNames } from "../lib/hydro";

const ScenarioContext = createContext(null);

export function ScenarioProvider({ children }) {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);

  const setInput = useCallback(
    (key, value) => setInputs((prev) => ({ ...prev, [key]: value })),
    []
  );

  const reset = useCallback(() => setInputs(DEFAULT_INPUTS), []);

  const derived = useMemo(() => {
    const wai = computeWAI(inputs);
    const decision = decide(wai);
    return { wai, decision, allowed: allowedWorkloadNames(decision) };
  }, [inputs]);

  const value = useMemo(
    () => ({ inputs, setInput, reset, ...derived }),
    [inputs, setInput, reset, derived]
  );

  return (
    <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>
  );
}

export const useScenario = () => useContext(ScenarioContext);
