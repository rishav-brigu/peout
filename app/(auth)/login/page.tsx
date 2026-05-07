export const dynamic = 'force-dynamic'

import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #C4B69A 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo + tagline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#92400E] text-white mb-4">
            <span className="font-display text-xl font-bold">P</span>
          </div>
          <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">PeOut</h1>
          <p className="mt-1 text-sm text-[#78716C]">Your commission business, organised.</p>
        </div>

        {/* Form card */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-8 shadow-sm">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#78716C] tracking-widest uppercase">
          Private Workspace · v1.0.0
        </p>
      </div>
    </div>
  )
}
