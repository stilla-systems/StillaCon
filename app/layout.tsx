import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'STILLA CONNECT · Managed community Internet', description: 'Affordable managed community Internet for modern communities and businesses by Stilla Systems.', generator: 'Stilla Systems' }
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#06111d' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html> }
