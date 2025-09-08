import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./CatchIt";
import Layout from "./Layout";
import { BrowserRouter, Routes, Route } from "react-router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path="games/catchit/:gameId" element={<App />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
