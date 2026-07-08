"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer, X } from "lucide-react"

export interface ReceiptOrderData {
  orderNumber: string
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  createdAt: string
  items: {
    quantity: number
    price: number
    total: number
    product: { name: string; sku: string }
  }[]
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}

function formatReceiptDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}/${day}/${year} ${hours}:${minutes}`
}

interface ReceiptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderData: ReceiptOrderData | null
}

function Receipt({ open, onOpenChange, orderData }: ReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  if (!orderData) return null

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-printable,
          .receipt-printable * {
            visibility: visible;
          }
          .receipt-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="receipt-printable sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">
              RETAIL POS
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              Thank you for your purchase!
            </p>
          </DialogHeader>

          <Separator />

          <div className="space-y-1 text-sm">
            <p className="font-medium">Order: {orderData.orderNumber}</p>
            <p className="text-muted-foreground">
              {formatReceiptDate(orderData.createdAt)}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            {orderData.items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between">
                  <p className="font-medium">{item.product.name}</p>
                  <span className="text-xs text-muted-foreground font-mono">{item.product.sku}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity} x {formatCurrency(item.price)}
                  </span>
                  <span className="font-mono">{formatCurrency(item.total)}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(orderData.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="font-mono">{formatCurrency(orderData.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(orderData.total)}</span>
            </div>
          </div>

          <Separator />

          <p className="text-sm">
            Payment: <span className="font-medium capitalize">{orderData.paymentMethod}</span>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            This is a simulated receipt
          </p>

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { Receipt }
