import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import IdeasPage from "@/pages/IdeasPage";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IdeasPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  );
}

export default App;
