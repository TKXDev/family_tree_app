"use client";

import { useNextAuthIntegration } from "@/lib/auth-integrations";

// This is a wrapper component that integrates NextAuth sessions with our custom auth system
export function NextAuthIntegration() {
  // This hook handles the integration logic via side effects
  useNextAuthIntegration();

  // This component doesn't render anything, it just handles the integration
  return null;
}
