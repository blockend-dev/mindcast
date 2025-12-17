import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast';


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MindCast - Decentralized Podcasting',
  description: 'Record, upload, and publish voice content entirely on-chain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #111827 0%, #000 100%)',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '0.75rem', 
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                padding: '1rem',
              },
              className: 'shadow-lg',
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#111827', 
                },
                style: {
                  borderLeft: '4px solid #10b981', 
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#111827', 
                },
                style: {
                  borderLeft: '4px solid #ef4444',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#8b5cf6', 
                  secondary: '#111827',
                },
                style: {
                  borderLeft: '4px solid #8b5cf6', 
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}