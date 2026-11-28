
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]!)
}

async function sendInvitationEmail({
  email,
  projectId,
  role,
  inviterName,
  invitationUrl,
  isNewUser,
  resendApiKey,
}: {
  email: string
  projectId: string
  role: string
  inviterName: string
  invitationUrl: string
  isNewUser: boolean
  resendApiKey: string
}) {
  const safeProject = escapeHtml(projectId)
  const safeName = escapeHtml(inviterName)
  const safeRole = escapeHtml(role)
  const safeUrl = escapeHtml(invitationUrl)

  const subject = `You've been invited to collaborate on Pomodoro`

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f4f5f9;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 15px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0"
            style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#17172b;padding:35px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:27px;">
                  Pomodoro
                </h1>
                <p style="color:#c4c4dc;margin:10px 0 0;">
                  Focus better. Achieve more.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 35px;">
                <h2 style="color:#202033;font-size:23px;">
                  You're invited!
                </h2>
                <p style="color:#646477;font-size:15px;line-height:1.7;">
                  <strong>${safeName}</strong> has invited you to collaborate
                  on a Pomodoro project.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#f6f6fb;border-radius:10px;margin:25px 0;">
                  <tr>
                    <td style="padding:20px;">
                      <p style="margin:0 0 10px;color:#88889a;font-size:12px;">
                        PROJECT
                      </p>
                      <p style="margin:0;color:#25253a;font-size:16px;font-weight:bold;">
                        ${safeProject}
                      </p>
                      <p style="margin:15px 0 0;color:#88889a;font-size:12px;">
                        YOUR ROLE
                      </p>
                      <p style="margin:5px 0 0;color:#25253a;font-size:15px;">
                        ${safeRole}
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="color:#646477;font-size:14px;line-height:1.7;">
                  ${isNewUser
                    ? 'Create or activate your account to join the project.'
                    : 'Open your Pomodoro account to access the shared project.'}
                </p>
                <div style="text-align:center;margin:30px 0;">
                  <a href="${safeUrl}"
                    style="display:inline-block;background:#6558e8;color:#ffffff;
                    text-decoration:none;padding:15px 30px;border-radius:9px;
                    font-size:15px;font-weight:bold;">
                    ${isNewUser ? 'Accept Invitation' : 'Open Project'}
                  </a>
                </div>
                <p style="color:#9999aa;font-size:12px;line-height:1.6;">
                  If the button doesn't work, copy this link into your browser:
                  <br />
                  <a href="${safeUrl}" style="color:#6558e8;word-break:break-all;">
                    ${safeUrl}
                  </a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px;text-align:center;background:#f8f8fb;">
                <p style="margin:0;color:#9999aa;font-size:12px;">
                  © ${new Date().getFullYear()} Pomodoro. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pomodoro App <onboarding@resend.dev>',
      to: [email],
      subject,
      html,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Resend could not send the invitation email')
  }

  return result
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const siteUrl = Deno.env.get('SITE_URL')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const body = await request.json()

    const projectId = String(body.project_id || '')
    const email = String(body.email || '').trim().toLowerCase()
    const role = String(body.role || 'viewer')
    const redirectTo = String(body.redirect_to || '')

    if (!projectId || !email) {
      return jsonResponse({
        error: 'Project ID and email are required',
      }, 400)
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Invalid email address' }, 400)
    }

    if (!['viewer', 'editor', 'owner'].includes(role)) {
      return jsonResponse({ error: 'Invalid project role' }, 400)
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Invalid or expired session' }, 401)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    // Prevent duplicate invitations.
    const { data: existing, error: existingError } = await admin
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .ilike('invited_email', email)
      .maybeSingle()

    if (existingError) throw existingError

    if (existing) {
      return jsonResponse({
        error: 'This email has already been invited to this project.',
      }, 409)
    }

    // Find the invited user.
    let existingUser = null

    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      })

      if (error) throw error

      existingUser = data.users.find(
        account => account.email?.toLowerCase() === email
      ) || null

      if (existingUser || data.users.length < 1000) break
    }

    const isNewUser = !existingUser
    let memberId: string | null = existingUser?.id || null
    let invitationUrl = redirectTo || siteUrl || ''

    if (isNewUser) {
      // Generate an invitation link without using Supabase's email delivery.
      const { data, error } = await admin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo: redirectTo || siteUrl || undefined,
          data: {
            project_id: projectId,
            invited_by: user.id,
          },
        },
      })

      if (error) throw error

      invitationUrl = data.properties?.action_link || ''

      if (!invitationUrl) {
        throw new Error('Could not generate invitation link')
      }
    } else {
      // Existing users receive a direct link to the app.
      if (!invitationUrl) {
        throw new Error('SITE_URL or redirect_to must be configured')
      }

      try {
        const url = new URL(invitationUrl)
        url.searchParams.set('project', projectId)
        invitationUrl = url.toString()
      } catch {
        throw new Error('Invalid redirect URL')
      }
    }

    const inviterName =
      String(user.user_metadata?.full_name || user.email || 'A team member')

    // Insert the membership before sending the email.
    const { data: membership, error: insertError } = await admin
      .from('project_members')
      .insert({
        project_id: projectId,
        owner_id: user.id,
        invited_email: email,
        member_id: memberId,
        role,
        status: isNewUser ? 'pending' : 'accepted',
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    try {
      await sendInvitationEmail({
        email,
        projectId,
        role,
        inviterName,
        invitationUrl,
        isNewUser,
        resendApiKey,
      })
    } catch (emailError) {
      // Roll back membership if email delivery fails.
      await admin
        .from('project_members')
        .delete()
        .eq('id', membership.id)

      throw emailError
    }

    return jsonResponse({
      success: true,
      message: isNewUser
        ? 'Invitation email sent successfully.'
        : 'Project invitation email sent successfully.',
      is_new_user: isNewUser,
    })

  } catch (error) {
    console.error('Project invitation error:', error)

    return jsonResponse({
      error: error instanceof Error
        ? error.message
        : 'Unable to send invitation',
    }, 400)
  }
})
