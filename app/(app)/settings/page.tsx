import { getAgentConfig } from './actions'
import { AgentProfileForm } from '@/components/settings/agent-profile-form'
import { ChangePasswordForm } from '@/components/settings/change-password-form'

export default async function SettingsPage() {
  const config = await getAgentConfig()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl text-[#1C1917] mb-1">Settings</h1>
        <p className="text-sm text-[#78716C]">Manage your profile and account security.</p>
      </div>

      {/* Agent profile */}
      <section className="bg-white border border-[#E7E3DC] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-[#1C1917] text-base">Agent profile</h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Appears on every PDF export — order notes sent to buyers and manufacturers.
          </p>
        </div>
        <div className="border-t border-[#E7E3DC]" />
        <AgentProfileForm config={config} />
      </section>

      {/* Change password */}
      <section className="bg-white border border-[#E7E3DC] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-[#1C1917] text-base">Change password</h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Update your login password. You will stay signed in after changing it.
          </p>
        </div>
        <div className="border-t border-[#E7E3DC]" />
        <ChangePasswordForm />
      </section>
    </div>
  )
}
