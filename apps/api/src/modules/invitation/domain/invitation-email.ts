export interface InvitationEmailInput {
  organizationName: string;
  inviterName: string;
  roleName: string;
  /** Empty = the member can work in every branch. */
  branchNames: string[];
  link: string;
  expiresAt: Date;
}

const escape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/**
 * Invitation email in the Aperture look (warm off-white, cobalt accent). Inline
 * styles and a table layout because mail clients ignore everything else.
 */
export function renderInvitationEmail(input: InvitationEmailInput) {
  const org = escape(input.organizationName);
  const inviter = escape(input.inviterName);
  const role = escape(input.roleName);
  const where =
    input.branchNames.length > 0
      ? `at ${escape(input.branchNames.join(', '))}`
      : 'across every branch';
  const expires = input.expiresAt.toISOString().slice(0, 10);
  const link = escape(input.link);

  const subject = `${input.inviterName} invited you to ${input.organizationName} on Aperture`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F7F5F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F1;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#FFFEFC;border:1px solid #E4E0D9;border-radius:20px;font-family:Manrope,'Segoe UI',Arial,sans-serif;color:#1C1B19;">
<tr><td style="padding:32px 32px 8px;">
<div style="font-size:17px;font-weight:800;letter-spacing:-0.01em;color:#1C1B19;">Aperture</div>
</td></tr>
<tr><td style="padding:16px 32px 0;">
<h1 style="margin:0;font-size:24px;line-height:30px;font-weight:800;letter-spacing:-0.02em;color:#1C1B19;">Join ${org}</h1>
<p style="margin:12px 0 0;font-size:15px;line-height:22px;color:#5E5B55;"><strong style="color:#1C1B19;">${inviter}</strong> invited you to work with ${org} on Aperture as <strong style="color:#1C1B19;">${role}</strong>, ${where}.</p>
</td></tr>
<tr><td style="padding:24px 32px 8px;">
<a href="${link}" style="display:inline-block;background:#3566E8;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:14px;">Accept invitation</a>
</td></tr>
<tr><td style="padding:16px 32px 32px;">
<p style="margin:0;font-size:13px;line-height:20px;color:#6E6A64;">This link works once and expires on ${expires}. If the button does not work, paste this address into your browser:<br><a href="${link}" style="color:#2F5BD3;word-break:break-all;">${link}</a></p>
<p style="margin:16px 0 0;font-size:13px;line-height:20px;color:#6E6A64;">Not expecting this? You can ignore the email; nothing happens until you accept.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    `${input.inviterName} invited you to ${input.organizationName} on Aperture as ${input.roleName}, ${where.replace(/&[a-z]+;/g, '')}.`,
    '',
    `Accept the invitation: ${input.link}`,
    '',
    `This link works once and expires on ${expires}.`,
    'Not expecting this? You can ignore the email.',
  ].join('\n');

  return { subject, html, text };
}
