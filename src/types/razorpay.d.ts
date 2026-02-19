// src/types/razorpay.d.ts

interface RazorpayOptions {
  key: string
  subscription_id?: string
  order_id?: string
  amount?: number
  currency?: string
  name?: string
  description?: string
  image?: string
  handler?: (response: RazorpayResponse) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_subscription_id?: string
  razorpay_order_id?: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open(): void
  close(): void
  on(event: string, callback: (response: unknown) => void): void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export {}
