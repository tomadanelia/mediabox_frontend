// ─── Invoice Types ────────────────────────────────────────────────────────────

export type InvoiceType = 'purchase' | 'fill_balance' | 'insufficient' | 'warning'
export type InvoiceStatus = 'paid' | 'pending' | 'failed' | 'warning'

export interface Invoice {
  id: string
  invoiceNumber: string       // e.g. "INV-2026-00042"
  type: InvoiceType
  status: InvoiceStatus

  // amounts
  amount: number
  currency: string            // "GEL" / "₾"

  // plan info (for 'purchase' type)
  planName?: string
  planNameKa?: string
  planDurationDays?: number
  expiresAt?: string

  // customer info
  customerName?: string
  customerEmail?: string
  customerId?: string         // numeric_id

  // balance fill info
  previousBalance?: number
  newBalance?: number

  // warning / insufficient
  renewalDate?: string
  daysUntilRenewal?: number
  requiredAmount?: number
  currentBalance?: number

  // meta
  createdAt: string           // ISO date string
  supportUrl?: string         // QR code destination
  note?: string
}