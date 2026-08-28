import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// resend.dev's shared sandbox sender works without verifying a domain, but
// can only deliver to the email address the Resend account was signed up
// with. Verify a real domain in the Resend dashboard and set RESEND_FROM
// (e.g. "Paws & Care <noreply@yourdomain.com>") to email any recipient.
const FROM = process.env.RESEND_FROM || "Paws & Care <onboarding@resend.dev>"

export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.")
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Reset your Paws & Care password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#173b31;">Reset your password</h2>
        <p>We received a request to reset the password for your Paws & Care account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#173b31;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">
            Reset password
          </a>
        </p>
        <p style="color:#718079;font-size:13px;">This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message || "Failed to send reset email.")
  }
}

export default { sendPasswordResetEmail }
