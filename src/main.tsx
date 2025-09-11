import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./CatchIt";
import { HashRouter, Routes, Route } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/games/catchit/:gameId" element={<App />} />
        <Route path="/" element={<App />} />
        <Route path="/test" element={<>test</>} />
        
      </Routes>
    </HashRouter>
  </StrictMode>
);
