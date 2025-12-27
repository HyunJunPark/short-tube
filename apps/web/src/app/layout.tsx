import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Short-Tube - AI YouTube Monitoring',
  description: 'AI-powered YouTube channel monitoring and summarization service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="dark">
      <body className={`${inter.className} bg-dark-bg text-text-white min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
