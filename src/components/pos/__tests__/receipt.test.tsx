import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Receipt, ReceiptOrderData } from '../receipt'

const mockOrderData: ReceiptOrderData = {
  orderNumber: 'ORD-001',
  subtotal: 25.97,
  tax: 2.08,
  total: 28.05,
  paymentMethod: 'cash',
  createdAt: '2026-07-08T10:30:00.000Z',
  items: [
    {
      quantity: 2,
      price: 9.99,
      total: 19.98,
      product: { name: 'Widget A', sku: 'WGT-001' },
    },
    {
      quantity: 1,
      price: 5.99,
      total: 5.99,
      product: { name: 'Gadget B', sku: 'GDG-002' },
    },
  ],
}

describe('Receipt', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    orderData: mockOrderData,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all items from orderData', () => {
    render(<Receipt {...defaultProps} />)

    expect(screen.getByText('Widget A')).toBeInTheDocument()
    expect(screen.getByText('Gadget B')).toBeInTheDocument()
    expect(screen.getByText('WGT-001')).toBeInTheDocument()
    expect(screen.getByText('GDG-002')).toBeInTheDocument()
  })

  it('displays subtotal, tax, and total values correctly', () => {
    render(<Receipt {...defaultProps} />)

    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('$25.97')).toBeInTheDocument()
    expect(screen.getByText('Tax')).toBeInTheDocument()
    expect(screen.getByText('$2.08')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('$28.05')).toBeInTheDocument()
  })

  it('shows payment method and formatted timestamp', () => {
    render(<Receipt {...defaultProps} />)

    expect(screen.getByText(/Payment:/)).toBeInTheDocument()
    expect(screen.getByText(/cash/i)).toBeInTheDocument()
    expect(screen.getByText(/07\/08\/2026/)).toBeInTheDocument()
  })

  it('print button calls window.print', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    render(<Receipt {...defaultProps} />)

    const printButton = screen.getByRole('button', { name: /print/i })
    fireEvent.click(printButton)

    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })
})
