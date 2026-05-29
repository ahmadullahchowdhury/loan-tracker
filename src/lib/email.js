import { Resend } from 'resend';

// Lazily initialised so the missing-key error surfaces at call time, not import time
let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const TX_LABELS = {
  given: 'Lent',
  paidBack: 'Paid Back',
  taken: 'Borrowed',
  returned: 'Returned',
};

const CURRENCY_SYMBOLS = { BDT: '৳', USD: '$', EUR: '€' };

export async function sendTransactionNotification({ toEmail, toName, fromName, type, amount, currency, notes, date, currentBalance, loanType }) {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL || !toEmail) return;

  const label = TX_LABELS[type] || type;
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formattedAmount = `${symbol}${Number(amount).toLocaleString()}`;
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
      <h2 style="border-bottom:2px solid #e5e7eb;padding-bottom:12px">Loan Transaction Recorded</h2>
      <p>Hi <strong>${toName}</strong>,</p>
      <p><strong>${fromName}</strong> has recorded a new transaction with Kowcher</p>

      <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:15px">
        <tr style="background:#f9fafb">
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600;width:35%">Amount</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb">${formattedAmount} <span style="color:#6b7280">(${currency})</span></td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600">Type</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb">${label}</td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600">Date</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600">${loanType === 'given' ? 'Current Balance (Need to Pay)' : 'Current Balance (I will Pay)'}</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600;color:#111">${symbol}${Number(currentBalance).toLocaleString()} <span style="color:#6b7280">(${currency})</span></td>
        </tr>
        ${notes ? `
        <tr style="background:#f9fafb">
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600">Notes</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb">${notes}</td>
        </tr>` : ''}
      </table>

      <p style="color:#6b7280;font-size:12px;margin-top:32px">
        This is an automated notification from Loan Tracker. Contact ${fromName} if you have any questions.
      </p>
    </div>
  `;

  const { data, error } = await getResend().emails.send({
    from: `Loan Tracker <${process.env.FROM_EMAIL}>`,
    to: toEmail,
    subject: `Transaction: ${formattedAmount} ${label} — ${fromName}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  console.log('[email] sent, id:', data?.id);
}
