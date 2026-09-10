const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Initializes or reuses the Nodemailer transporter
 * Supports Gmail, custom SMTP, Ethereal test inbox, and mock fallback
 * @returns {Promise<nodemailer.Transporter>}
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;

  // Clean password whitespace
  if (pass) pass = pass.replace(/\s+/g, '');

  // Auto-infer user from EMAIL_FROM if user is placeholder
  if ((!user || user === 'your_email@gmail.com') && process.env.EMAIL_FROM) {
    const match = process.env.EMAIL_FROM.match(/<([^>]+)>/);
    if (match && match[1]) user = match[1];
  }

  const isConfigured = user && pass && user !== 'your_email@gmail.com';

  if (isConfigured) {
    const isGmail = (host && host.includes('gmail')) || (user && user.includes('@gmail.com'));
    if (isGmail) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 8000, // 8s timeout
        greetingTimeout: 8000,
        socketTimeout: 12000
      });
      console.log(`[EmailService] Production Gmail transporter configured for ${user}`);
    } else {
      cachedTransporter = nodemailer.createTransport({
        host: host || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000
      });
      console.log(`[EmailService] Production SMTP transporter configured for ${host}:${process.env.SMTP_PORT || 587}`);
    }
  } else {
    // Development fallback: Try Ethereal test account, else use mock logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[EmailService] Ethereal test SMTP initialized. User: ${testAccount.user}`);
    } catch (err) {
      console.warn('[EmailService] Ethereal test account unavailable, using mock logger fallback:', err.message);
      cachedTransporter = {
        sendMail: async (mailOptions) => {
          console.log(`[EmailService Mock] Simulated email dispatch to ${mailOptions.to} | Subject: "${mailOptions.subject}"`);
          return { messageId: `mock-${Date.now()}` };
        }
      };
    }
  }

  return cachedTransporter;
}

/**
 * Builds responsive, professional HTML email template
 * @param {string} candidateName
 * @param {Array<object>} matchedJobs
 * @param {string} candidateEmail
 * @returns {string}
 */
function buildCandidateJobAlertHtml(candidateName, matchedJobs, candidateEmail) {
  const jobCardsHtml = matchedJobs.map((item) => {
    const job = item.job ? item.job : item;
    const score = typeof item.matchScore === 'number'
      ? item.matchScore
      : (typeof item.score === 'number' ? item.score : (job.matchScore || job.score || 75));
    const matchedSkills = Array.isArray(item.matchedSkills)
      ? item.matchedSkills
      : (Array.isArray(job.matchedSkills) ? job.matchedSkills : []);

    let applyUrl = job.applyUrl || '#';
    if (!applyUrl || applyUrl === '#' || applyUrl.includes('example.com')) {
      applyUrl = `https://www.google.com/search?q=${encodeURIComponent(`${job.title || ''} ${job.company || ''} jobs`)}&ibp=htl;jobs`;
    }

    const skillsChips = matchedSkills.slice(0, 6).map(skill =>
      `<span style="display:inline-block; background-color:#1E293B; color:#93C5FD; font-size:11px; font-weight:600; padding:3px 8px; border-radius:10px; margin-right:5px; margin-bottom:5px; border:1px solid #334155; text-transform:lowercase;">${skill}</span>`
    ).join('');

    return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #1F2937;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top" style="padding-right: 14px;">
                <h3 style="margin: 0 0 4px 0; font-size: 17px; color: #F9FAFB; font-weight: 700; line-height: 1.3;">
                  <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" style="color: #60A5FA; text-decoration: none;">
                    ${job.title || 'Untitled Opening'}
                  </a>
                </h3>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #94A3B8;">
                  <strong style="color: #E2E8F0;">${job.company || 'Confidential'}</strong> &bull; 
                  <span style="display: inline-block; background-color: #0F172A; color: #38BDF8; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 5px; border: 1px solid #1E293B; margin-left: 4px;">
                    📍 ${job.location || 'Remote'}
                  </span>
                  ${job.source ? `&bull; <span style="color: #64748B; font-size: 11px;">via ${job.source}</span>` : ''}
                </p>
                <div style="margin-top: 6px; margin-bottom: 4px;">
                  ${skillsChips}
                </div>
              </td>
              <td width="150" align="right" valign="top">
                <!-- Prominent Green Match Badge -->
                <div style="background-color: #064E3B; border: 1px solid #059669; color: #34D399; font-weight: 800; font-size: 13px; padding: 6px 12px; border-radius: 20px; display: inline-block; text-align: center; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);">
                  🎯 ${score}% Match
                </div>
                <!-- Direct CTA Button -->
                <div>
                  <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 8px 14px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); white-space: nowrap;">
                    Apply on Source Portal &rarr;
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Matches for ${candidateName}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0B0F17; padding: 36px 12px;">
      <tr>
        <td align="center">
          <table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; width: 100%; background-color: #111827; border: 1px solid #1F2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
            
            <!-- Header -->
            <tr>
              <td style="padding: 28px 32px 22px 32px; background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%); border-bottom: 1px solid #1F2937;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #818CF8; display: block; margin-bottom: 4px;">Autonomous AI Match Alert</span>
                      <h1 style="margin: 0; font-size: 22px; color: #F9FAFB; font-weight: 800; letter-spacing: -0.5px;">Job Matches for ${candidateName}</h1>
                    </td>
                    <td align="right">
                      <div style="background-color: #10B98125; border: 1px solid #10B98160; color: #34D399; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 14px;">
                        ${matchedJobs.length} High-Match Openings
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Candidate Greeting -->
            <tr>
              <td style="padding: 24px 32px 12px 32px; color: #CBD5E1; font-size: 15px; line-height: 1.6;">
                Hello <strong style="color: #FFFFFF;">${candidateName}</strong>,<br/>
                Our autonomous matching engine identified <strong style="color: #34D399;">${matchedJobs.length} live job openings</strong> matching your technical skills with a strict <strong style="color: #34D399;">70%+ compatibility score</strong>.
              </td>
            </tr>

            <!-- Dynamic Job Cards Table -->
            <tr>
              <td style="padding: 0 32px 20px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${jobCardsHtml}
                </table>
              </td>
            </tr>

            <!-- Footer: Unsubscribe / Notification Disclaimer -->
            <tr>
              <td style="padding: 24px 32px; background-color: #0F172A; border-top: 1px solid #1F2937; text-align: center; color: #64748B; font-size: 12px; line-height: 1.6;">
                <p style="margin: 0 0 6px 0;">This email was sent directly to <strong>${candidateEmail}</strong> based on your uploaded resume profile.</p>
                <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} Job Hunter Agent &bull; Autonomous Candidate Matching &bull; All rights reserved.</p>
                <p style="margin: 0; font-size: 11px; color: #475569;">
                  You received this automated notification because your resume profile is registered for continuous job matching. 
                  To unsubscribe or update your alert preferences, reply directly to this message or manage your profile in the dashboard.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Sends a personalized job alert email to a candidate
 * Strictly filters for 70% <= matchScore <= 100%
 *
 * @param {object} params
 * @param {string} params.candidateName - Full name of candidate
 * @param {string} params.candidateEmail - Direct email address extracted from resume
 * @param {Array<object>} params.matchedJobs - Array of evaluated jobs
 * @returns {Promise<object|null>}
 */
async function sendCandidateJobAlert(params, legacyMatches, legacyName) {
  // Support both object parameter and legacy positional parameters
  let candidateName = 'Candidate';
  let candidateEmail = '';
  let rawMatchedJobs = [];

  if (params && typeof params === 'object' && !Array.isArray(params)) {
    candidateName = params.candidateName || params.name || 'Candidate';
    candidateEmail = params.candidateEmail || params.email || '';
    rawMatchedJobs = Array.isArray(params.matchedJobs) ? params.matchedJobs : [];
  } else {
    // Positional fallback: sendCandidateJobAlert(email, matches, name)
    candidateEmail = String(params || '').trim();
    rawMatchedJobs = Array.isArray(legacyMatches) ? legacyMatches : [];
    candidateName = legacyName || 'Candidate';
  }

  // 1. Enforce check: If matchedJobs.length === 0 or !candidateEmail, abort immediately without throwing
  if (!rawMatchedJobs || rawMatchedJobs.length === 0 || !candidateEmail || !candidateEmail.includes('@')) {
    console.log(`[EmailService] Aborted: No matched jobs or invalid candidate email ("${candidateEmail}").`);
    return null;
  }

  // 2. Strictly filter jobs where Match Score is between 70% and 100% (inclusive)
  const qualifiedJobs = rawMatchedJobs.filter((item) => {
    const job = item.job ? item.job : item;
    const score = typeof item.matchScore === 'number'
      ? item.matchScore
      : (typeof item.score === 'number' ? item.score : (job.matchScore || job.score || 0));
    return score >= 70 && score <= 100;
  });

  if (qualifiedJobs.length === 0) {
    console.log(`[EmailService] Aborted: None of the ${rawMatchedJobs.length} jobs satisfy 70% <= matchScore <= 100% for candidate ${candidateEmail}. Never dispatching for < 70%.`);
    return null;
  }

  // 3. Setup dynamic Nodemailer transporter with candidateEmail strictly as recipient
  const mailTransporter = await getTransporter();
  const sender = process.env.EMAIL_FROM || '"Job Hunter Agent" <no-reply@jobhunteragent.io>';
  const cleanRecipient = candidateEmail.trim().toLowerCase();

  // Defense: RFC 2606 reserved & non-routable dummy test domains
  // Sending to example.com, test.com, etc. causes mail servers (like Gmail) to return "Address not found" bounce DSNs
  const DUMMY_DOMAINS = ['example.com', 'example.org', 'example.net', 'example.edu', 'sample.com', 'test.com', 'domain.com', 'dummy.com', 'localhost', 'invalid'];
  const recipientDomain = cleanRecipient.split('@')[1] || '';
  const isDummyDomain = DUMMY_DOMAINS.includes(recipientDomain) || recipientDomain.endsWith('.example') || recipientDomain.endsWith('.test');

  if (isDummyDomain) {
    console.log(`[EmailService] Simulated dispatch: "${cleanRecipient}" is a reserved test domain (${recipientDomain}). Skipping real SMTP to prevent Mailer-Daemon bounce.`);
    return {
      messageId: `simulated-${Date.now()}`,
      recipient: cleanRecipient,
      simulated: true,
      note: 'Skipped real SMTP to prevent RFC 2606 non-routable domain bounce.'
    };
  }

  const htmlContent = buildCandidateJobAlertHtml(candidateName, qualifiedJobs, cleanRecipient);

  const textJobList = qualifiedJobs.map((item, idx) => {
    const job = item.job || item;
    const score = item.matchScore || item.score || job.matchScore || job.score || '';
    const applyUrl = job.applyUrl || '#';
    return `${idx + 1}. ${job.title} at ${job.company} (🎯 ${score}% Match)\n   Apply: ${applyUrl}`;
  }).join('\n\n');

  const mailOptions = {
    from: sender,
    to: cleanRecipient, // Must be the extracted user email, NEVER the sender
    subject: `🎯 ${qualifiedJobs.length} High-Match Jobs Found for Your Profile (70%+ Match)`,
    html: htmlContent,
    text: `Job Matches for ${candidateName}\n\nOur autonomous matching engine identified ${qualifiedJobs.length} high-match job opportunities (70%+):\n\n${textJobList}\n\nGood luck with your applications!\n\nJob Hunter Agent`
  };

  try {
    console.log(`[EmailService] Dispatching 70%+ job digest strictly to candidate email: "${cleanRecipient}" (${qualifiedJobs.length} jobs)`);
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[EmailService] Successfully sent candidate digest to ${cleanRecipient} (MessageId: ${info?.messageId})`);

    if (nodemailer.getTestMessageUrl && info) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EmailService] Preview Email URL: ${previewUrl}`);
      }
    }

    return info;
  } catch (error) {
    console.error(`[EmailService] Failed to send email to candidate ${cleanRecipient}:`, error.message);
    throw error;
  }
}

module.exports = {
  sendCandidateJobAlert,
  sendJobAlertEmail: sendCandidateJobAlert, // Backwards-compatible alias
  sendJobMatchesAlert: sendCandidateJobAlert, // Backwards-compatible alias
  buildCandidateJobAlertHtml,
  getTransporter
};
