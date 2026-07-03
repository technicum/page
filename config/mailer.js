async function sendMail({ to, subject, html }) {
  try {
    let nodemailer
    try {
      nodemailer = require('nodemailer')
    } catch (e) {
      console.error('[mailer] nodemailer not installed — run: npm install')
      return
    }

    const transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST || 'smtp.hostinger.com',
      port:   parseInt(process.env.MAIL_PORT || '465'),
      secure: process.env.MAIL_PORT !== '587', // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout:   10000,
      socketTimeout:     15000
    })

    const from = process.env.MAIL_FROM || `"PageZaper" <${process.env.MAIL_USER}>`
    await transporter.sendMail({ from, to, subject, html })
    console.log('[mailer] sent to', to)
  } catch (err) {
    console.error('[mailer] failed:', err.message)
  }
}

module.exports = { sendMail }
