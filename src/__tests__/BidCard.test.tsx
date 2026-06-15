import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { BidCard } from '@/app/pages/home/BidCard'
import { EBidType, type TBid } from '@/shared/types'

const mockBid: TBid = {
  id: 1,
  type: EBidType.Buy,
  title: 'Пшеница мягкая',
  quality: 'Протеин 12%',
  price: '15000',
  volume: '500',
  region: 'Краснодарский край',
  comment: '',
  is_archived: false,
  published_at: '2024-01-15T10:00:00Z',
  author: {
    id: 42,
    phone: '+79001234567',
    name: 'Иван Иванов',
    company_name: 'ООО Агро',
    company_logo: null,
  },
}

function renderCard(props: Partial<Parameters<typeof BidCard>[0]> = {}) {
  const onContact = jest.fn()
  render(
    <MemoryRouter>
      <BidCard bid={mockBid} alreadySent={false} onContact={onContact} {...props} />
    </MemoryRouter>,
  )
  return { onContact }
}

describe('BidCard', () => {
  it('renders title, price, volume and region from props', () => {
    renderCard()

    expect(screen.getByText('Пшеница мягкая')).toBeInTheDocument()
    expect(screen.getByText('Краснодарский край')).toBeInTheDocument()
    // price element contains the formatted number and ₽
    expect(screen.getByText(/₽/)).toBeInTheDocument()
    // volume element: p tag contains "Объём" + "500 т"
    expect(screen.getByText(/500/)).toBeInTheDocument()
  })

  it('contact button is disabled when alreadySent=true', () => {
    renderCard({ alreadySent: true })

    const button = screen.getByRole('button', { name: /Запрос отправлен/i })
    expect(button).toBeDisabled()
  })

  it('calls onContact with the bid when Связаться button is clicked', async () => {
    const user = userEvent.setup()
    const { onContact } = renderCard({ alreadySent: false })

    const button = screen.getByRole('button', { name: /Связаться/i })
    await user.click(button)

    expect(onContact).toHaveBeenCalledTimes(1)
    expect(onContact).toHaveBeenCalledWith(mockBid)
  })
})
