import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.getUserById(user.id)
    const fullUser = data?.user

    // Allow if: they were invited via email, OR they have an email/password
    // identity (the original owner who existed before OAuth was added)
    const wasInvited = fullUser?.invited_at != null
    const hasEmailIdentity = fullUser?.identities?.some((i) => i.provider === 'email') ?? false

    if (!wasInvited && !hasEmailIdentity) {
      await admin.auth.admin.deleteUser(user.id)
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=not_invited`)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
