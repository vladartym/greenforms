import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { App } from "./App"
import "./index.css"

createRoot(document.getElementById("app")!).render(
  <BrowserRouter>
    <TooltipProvider>
      <App />
    </TooltipProvider>
    <Toaster position="bottom-right" closeButton />
  </BrowserRouter>,
)
