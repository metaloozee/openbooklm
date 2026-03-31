"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";

import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/lib/trpc/client";

import { TooltipProvider } from "./ui/tooltip";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
      <ReactQueryDevtools />
    </TRPCReactProvider>
  );
}
