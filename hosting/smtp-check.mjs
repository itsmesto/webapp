import nodemailer from 'nodemailer';

// Authenticate against the configured mail server without sending mail or
// opening the business database. Output intentionally excludes credentials.
const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
const missing = required.filter(name => !process.env[name]);
if (missing.length) {
  console.log(JSON.stringify({ smtpVerified: false, category: 'missing-settings', missing }));
  process.exitCode = 1;
} else {
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE === 'true' ||
    (process.env.SMTP_SECURE !== 'false' && port === 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });
  try {
    await transporter.verify();
    console.log(JSON.stringify({ smtpVerified: true, host: process.env.SMTP_HOST, port, secure }));
  } catch (error) {
    const code = /^[A-Z_]{1,30}$/.test(String(error.code || '')) ? error.code : 'UNKNOWN';
    const command = /^(CONN|EHLO|HELO|AUTH(?: (?:PLAIN|LOGIN|XOAUTH2))?|STARTTLS)$/.test(String(error.command || ''))
      ? error.command : undefined;
    const responseCode = Number.isInteger(error.responseCode) ? error.responseCode : undefined;
    console.log(JSON.stringify({ smtpVerified: false, code, command, responseCode }));
    process.exitCode = 1;
  } finally {
    transporter.close();
  }
}

