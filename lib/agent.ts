// Your details as they appear on every PDF export.
// Edit these once and all PDFs update automatically.
export const AGENT = {
  name: process.env.NEXT_PUBLIC_AGENT_NAME ?? 'Your Name',
  address: process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? 'Your address, City',
  phone: process.env.NEXT_PUBLIC_AGENT_PHONE ?? '+91 XXXXX XXXXX',
  email: process.env.NEXT_PUBLIC_AGENT_EMAIL ?? 'you@example.com',
}
