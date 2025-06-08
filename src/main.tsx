
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SidebarProvider } from "@/components/ui/sidebar";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
<<<<<<< HEAD
  <SidebarProvider defaultOpen={false}>
    <div className="min-h-screen flex w-full">
      <App />
    </div>
  </SidebarProvider>
=======
  <React.StrictMode>
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <App />
      </div>
    </SidebarProvider>
  </React.StrictMode>
>>>>>>> 3797327d60e6ce08ca10aa8ec6ff27311f492b43
);
