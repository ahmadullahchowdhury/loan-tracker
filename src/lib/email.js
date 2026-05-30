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

export async function sendLoanSummary({ toEmail, toName, loan, transactions }) {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL || !toEmail) return;

  const symbol = CURRENCY_SYMBOLS[loan.currency] || loan.currency;
  const fmt = (n) => `${symbol}${Number(n).toLocaleString()}`;

  const totalGiven = transactions
    .filter((t) => t.type === 'given' || t.type === 'taken')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRepaid = transactions
    .filter((t) => t.type === 'paidBack' || t.type === 'returned')
    .reduce((sum, t) => sum + t.amount, 0);

  const txRows = transactions
    .map((t) => {
      const label = TX_LABELS[t.type] || t.type;
      const isRepayment = t.type === 'paidBack' || t.type === 'returned';
      const color = isRepayment ? '#16a34a' : '#dc2626';
      const date = new Date(t.transactionDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
      return `
        <tr>
          <td style="padding:10px 14px;border:1px solid #e5e7eb">${date}</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb">
            <span style="color:${color};font-weight:600">${label}</span>
          </td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600">${fmt(t.amount)}</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb">${t.method}</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#6b7280">${t.notes || '—'}</td>
        </tr>`;
    })
    .join('');

  const loanDirection = loan.type === 'given' ? 'You lent to' : 'You borrowed from';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:660px;margin:0 auto;color:#333">
      <h2 style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;margin-bottom:4px">
        Loan Summary — ${loan.personName}
      </h2>
      <p style="color:#6b7280;margin-top:4px">${loanDirection} <strong>${loan.personName}</strong></p>

      <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:15px">
        <tr style="background:#f9fafb">
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600;width:40%">Current Balance</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:700;font-size:16px">${fmt(loan.currentBalance)} <span style="color:#6b7280;font-size:13px">(${loan.currency})</span></td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600">Total ${loan.type === 'given' ? 'Lent' : 'Borrowed'}</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb">${fmt(totalGiven)}</td>
        </tr>
        <tr style="background:#f9fafb">
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600">Total ${loan.type === 'given' ? 'Paid Back' : 'Returned'}</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb">${fmt(totalRepaid)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border:1px solid #e5e7eb;font-weight:600">Total Transactions</td>
          <td style="padding:12px 16px;border:1px solid #e5e7eb">${transactions.length}</td>
        </tr>
      </table>

      <h3 style="margin-bottom:12px">Transaction History</h3>
      ${transactions.length === 0
        ? '<p style="color:#6b7280">No transactions recorded yet.</p>'
        : `<table style="border-collapse:collapse;width:100%;font-size:14px">
            <thead>
              <tr style="background:#f3f4f6">
                <th style="padding:10px 14px;border:1px solid #e5e7eb;text-align:left">Date</th>
                <th style="padding:10px 14px;border:1px solid #e5e7eb;text-align:left">Type</th>
                <th style="padding:10px 14px;border:1px solid #e5e7eb;text-align:left">Amount</th>
                <th style="padding:10px 14px;border:1px solid #e5e7eb;text-align:left">Method</th>
                <th style="padding:10px 14px;border:1px solid #e5e7eb;text-align:left">Notes</th>
              </tr>
            </thead>
            <tbody>${txRows}</tbody>
          </table>`
      }

      <p style="color:#6b7280;font-size:12px;margin-top:32px">
        Sent from Loan Tracker · Summary requested by ${toName}
      </p>
    </div>
  `;

  const { data, error } = await getResend().emails.send({
    from: `Loan Tracker <${process.env.FROM_EMAIL}>`,
    to: toEmail,
    subject: `Loan Summary: ${loan.personName} — Balance ${fmt(loan.currentBalance)}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  console.log('[email] summary sent, id:', data?.id);
}
