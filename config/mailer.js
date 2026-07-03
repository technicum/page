async function sendMail({ to, subject, html }) {
  // Lazy-load nodemailer so a missing package doesn't crash the app on startup
  let nodemailer
  try {
    nodemailer = require('nodemailer')
  } catch (e) {
    console.error('[mailer] nodemailer not installed — run npm install')
    return
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.MAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_PORT === '465',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  })

  const from = process.env.MAIL_FROM || `"PageZaper" <${process.env.MAIL_USER}>`
  return transporter.sendMail({ from, to, subject, html })
}

module.exports = { sendMail }
