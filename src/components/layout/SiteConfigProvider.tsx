"use client";

import { createContext, useContext } from "react";

interface SiteConfigValue {
  heroVideoUrl: string | null;
}

const SiteConfigContext = createContext<SiteConfigValue>({ heroVideoUrl: null });

export function SiteConfigProvider({
  heroVideoUrl,
  children,
}: {
  heroVideoUrl: string | null;
  children: React.ReactNode;
}) {
  return (
    <SiteConfigContext.Provider value={{ heroVideoUrl }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
