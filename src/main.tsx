import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./CatchIt";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter(
  [
    {
      path: "/games/catchit/:gameId",
      element: <App />,
    },
    {
      path: "/",
      element: <App />,
    },
  ],
  { future: { v7_startTransition: true } }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
