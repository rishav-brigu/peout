import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const dmSerif = DM_Serif_Display({
  variable: '--font-dm-serif',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'PeOut — Commission Business Manager',
  description: 'Your commission business, organised.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
