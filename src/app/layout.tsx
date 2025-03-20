import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial', 'sans-serif']
})

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Repository Visualizer',
  description: 'Visualize and analyze GitHub repositories',
  applicationName: 'Repository Visualizer',
  authors: { name: 'Repository Visualizer Team' },
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' }
  ],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white dark:bg-gray-900 min-h-screen`}>
        {children}
      </body>
    </html>
  )
} 