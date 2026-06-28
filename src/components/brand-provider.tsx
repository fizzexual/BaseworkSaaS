"use client";

import { createContext, useContext } from "react";

/** App-wide brand name (super-admin configurable; falls back to APP_NAME). */
const BrandContext = createContext<string>("Basework");

export function BrandProvider({ name, children }: { name: string; children: React.ReactNode }) {
  return <BrandContext.Provider value={name}>{children}</BrandContext.Provider>;
}

export function useBrandName() {
  return useContext(BrandContext);
}
