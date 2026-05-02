import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const clientId = process.env.VK_CLIENT_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nashlo.ru'
  const redirectUri = `${baseUrl}/api/auth/vk/callback`
  const next = new URL(request.url).searchParams.get('next') || '/profile'

  if (!clientId) {
    return NextResponse.redirect(`${baseUrl}/login?error=vk_error`)
  }

  const url = new URL('https://oauth.vk.com/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'email')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('v', '5.131')
  url.searchParams.set('display', 'mobile')
  url.searchParams.set('state', next)

  return NextResponse.redirect(url.toString())
}
