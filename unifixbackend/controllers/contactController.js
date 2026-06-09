const { BrevoClient } = require('@getbrevo/brevo');

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

exports.sendContactEmail = async (req, res) => {
  const { name, email, phone, userType, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
  }

  try {
    await client.transactionalEmails.sendTransacEmail({
      sender: { name: 'UniFiX Contact Form', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: process.env.HELPDESK_EMAIL }],
      replyTo: { email, name },
      subject: `New Contact Form Submission from ${name}`,
      htmlContent: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>User Type:</strong> ${userType || 'Not specified'}</p>
        <hr/>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Brevo error:', err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};