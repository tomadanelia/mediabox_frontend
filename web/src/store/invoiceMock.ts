import type { Invoice } from "@/types/invoice"
// ─── Mock Invoices ────────────────────────────────────────────────────────────
// Replace with real API responses. These match the shape of Invoice.

export const MOCK_INVOICES: Invoice[] = [
  // 1. Purchase receipt
  {
    id: 'inv_001',
    invoiceNumber: 'INV-2026-00042',
    type: 'purchase',
    status: 'paid',
    amount: 30.00,
    currency: '₾',
    planName: 'Monthly Pro',
    planNameKa: 'ყოველთვიური Pro',
    planDurationDays: 30,
    expiresAt: '2026-04-22T00:00:00Z',
    customerName: 'Giorgi Beridze',
    customerEmail: 'giorgi@example.ge',
    customerId: '100042',
    createdAt: '2026-03-22T10:30:00Z',
    supportUrl: 'https://support.yourapp.ge',
  },

  // 2. Balance fill
  {
    id: 'inv_002',
    invoiceNumber: 'INV-2026-00041',
    type: 'fill_balance',
    status: 'paid',
    amount: 50.00,
    currency: '₾',
    previousBalance: 5.20,
    newBalance: 55.20,
    customerName: 'Giorgi Beridze',
    customerEmail: 'giorgi@example.ge',
    customerId: '100042',
    createdAt: '2026-03-20T14:15:00Z',
    supportUrl: 'https://support.yourapp.ge',
  },

  // 3. Insufficient balance notice
  {
    id: 'inv_003',
    invoiceNumber: 'INV-2026-00040',
    type: 'insufficient',
    status: 'failed',
    amount: 0,
    currency: '₾',
    currentBalance: 4.50,
    requiredAmount: 30.00,
    customerName: 'Giorgi Beridze',
    customerId: '100042',
    createdAt: '2026-03-18T09:00:00Z',
    note: 'Automatic renewal failed due to insufficient balance.',
    supportUrl: 'https://support.yourapp.ge',
  },

  // 4. Upcoming renewal warning (3 days before)
  {
    id: 'inv_004',
    invoiceNumber: 'INV-2026-00039',
    type: 'warning',
    status: 'warning',
    amount: 30.00,
    currency: '₾',
    currentBalance: 12.00,
    requiredAmount: 30.00,
    renewalDate: '2026-03-25T00:00:00Z',
    daysUntilRenewal: 3,
    planName: 'Monthly Pro',
    customerName: 'Giorgi Beridze',
    customerId: '100042',
    createdAt: '2026-03-22T08:00:00Z',
    supportUrl: 'https://support.yourapp.ge',
  },
]