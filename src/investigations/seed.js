/** @type {import('./model.js').Investigation[]} */
export const seedInvestigations = [
  { id: 'INV-2001', title: 'Suspicious login burst on VPN gateway', status: 'closed', createdAt: '2026-10-28T09:15:00Z', updatedAt: '2026-10-30T16:40:00Z', actor: 'a.rivera', summary: 'Credential-stuffing attempt blocked by rate limiting; no accounts compromised.' },
  { id: 'INV-2002', title: 'Unexpected outbound traffic from build server', status: 'escalated', createdAt: '2026-11-03T11:02:00Z', updatedAt: '2026-11-05T08:20:00Z', actor: 'j.chen', summary: 'Beaconing to unknown host; escalated to incident response.' },
  { id: 'INV-2003', title: 'Public S3 bucket exposure review', status: 'in_progress', createdAt: '2026-11-10T13:45:00Z', updatedAt: '2026-11-12T10:05:00Z', actor: 'm.okafor', summary: 'Auditing bucket policies across all accounts; 3 of 7 reviewed.' },
  { id: 'INV-2004', title: 'Phishing report from finance team', status: 'open', createdAt: '2026-11-17T07:30:00Z', updatedAt: '2026-11-17T07:30:00Z', actor: 's.patel', summary: 'Awaiting header analysis of reported messages.' },
];
