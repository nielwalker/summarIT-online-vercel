// API utility functions for consistent backend URL handling

export function getApiBaseUrl(): string {
  const envBase = (import.meta as any).env?.VITE_API_URL
  const isVercel = typeof window !== 'undefined' && /vercel\.app$/i.test(window.location.hostname)
  
  // Use the correct backend URL from your Vercel deployment
  let base = envBase || (isVercel ? 'https://summar-it-online-vercel-backend.vercel.app' : 'http://localhost:3000')
  
  // Remove any trailing slashes to ensure clean URL construction
  base = base.replace(/\/+$/, '')
  
  console.log('Base URL:', base)
  return base
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl()
  
  // Clean the endpoint - remove leading slashes
  let cleanEndpoint = endpoint
  while (cleanEndpoint.startsWith('/')) {
    cleanEndpoint = cleanEndpoint.slice(1)
  }
  
  // Construct the final URL with exactly one slash
  const fullUrl = `${base}/${cleanEndpoint}`
  console.log('API URL Debug:', { base, endpoint, cleanEndpoint, fullUrl })
  return fullUrl
}
