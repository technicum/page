const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_PORT === '465',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

async function sendMail({ to, subject, html }) {
  const from = process.env.MAIL_FROM || `"PageZaper" <${process.env.MAIL_USER}>`
  return transporter.sendMail({ from, to, subject, html })
}

module.exports = { sendMail }
