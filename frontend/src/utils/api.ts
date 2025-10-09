// API utility functions for consistent backend URL handling

export function getApiBaseUrl(): string {
  const envBase = (import.meta as any).env?.VITE_API_URL
  const isVercel = typeof window !== 'undefined' && /vercel\.app$/i.test(window.location.hostname)
  return envBase || (isVercel ? 'https://summar-it-online-vercel-backend.vercel.app' : 'http://localhost:3000')
}

export function getApiUrl(endpoint: string): string {
  return `${getApiBaseUrl()}${endpoint}`
}
