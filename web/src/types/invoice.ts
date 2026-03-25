export interface PlanPurchaseInvoiceData {
  success: boolean
  invoice: {
    transaction_id: string
    date: string
    item_name: string
    amount: string | number
    currency: string
    user_name: string
    user_id: number
  }
  expires_at: string
  remaining_balance: string | number
}

export interface DeviceLimitInvoiceData {
  success: boolean
  invoice: {
    transaction_id: string | number
    date: string
    item_name: string
    amount: string | number
    currency: string
  }
  new_limit: number
  remaining_balance: string | number
}

export type InvoiceData = PlanPurchaseInvoiceData | DeviceLimitInvoiceData

