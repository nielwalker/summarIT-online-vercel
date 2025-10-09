// API utility functions for consistent backend URL handling

export function getApiBaseUrl(): string {
  const envBase = (import.meta as any).env?.VITE_API_URL
  const isVercel = typeof window !== 'undefined' && /vercel\.app$/i.test(window.location.hostname)
  
  // Use the correct backend URL from your Vercel deployment
  const base = envBase || (isVercel ? 'https://summar-it-online-vercel-backend.vercel.app' : 'http://localhost:3000')
  // Ensure base URL doesn't end with slash to avoid double slashes
  return base.endsWith('/') ? base.slice(0, -1) : base
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${cleanEndpoint}`
}
