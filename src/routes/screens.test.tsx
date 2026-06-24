import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AccessibleDialog } from '../components/AccessibleDialog'
import { db } from '../persistence/db'
import {
  createCampaign,
  createSession,
  loadAppData,
  manualAdvancePower,
} from '../persistence/repository'
import { powerDefinitions } from '../data/powers'

async function resetDb() {
  await db.delete()
  await db.open()
}

async function seedCampaign() {
  await createCampaign({
    campaignName: 'Component Campaign',
    startDate: '2026-01-01',
    targetDate: '2027-01-01',
  })
}

function route(path: string) {
  window.history.pushState({}, '', path)
}

beforeEach(async () => {
  await resetDb()
  window.localStorage.clear()
  vi.spyOn(window, 'prompt').mockReturnValue('Test reason')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  cleanup()
})

describe('component screens', () => {
  it('renders dashboard metrics and mobile navigation labels', async () => {
    await seedCampaign()
    route('/')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Sessions Attended')).toBeInTheDocument()
    expect(screen.getAllByText('Draw')[0]).toBeInTheDocument()
  })

  it('creates a session from the session form', async () => {
    await seedCampaign()
    route('/sessions')
    render(<App />)
    await screen.findByRole('heading', { name: 'Session Tracker' })
    await userEvent.type(screen.getByLabelText('Session title'), 'Opening Trial')
    await userEvent.click(screen.getByRole('button', { name: 'Save Session' }))
    expect(await screen.findByText(/Opening Trial/)).toBeInTheDocument()
  })

  it('previews and confirms a draw', async () => {
    await seedCampaign()
    await createSession({ date: '2026-01-03', attended: true, title: 'Draw Night' })
    window.localStorage.setItem('dumareRandomSeed', '3')
    route('/draw')
    render(<App />)
    await screen.findByRole('heading', { name: 'Advancement Draw' })
    await userEvent.click(screen.getByRole('button', { name: 'Draw and Reveal' }))
    expect(await screen.findByRole('button', { name: 'Confirm and Commit' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm and Commit' }))
    await waitFor(async () => {
      const data = await loadAppData()
      expect(data.auditEvents.some((event) => event.type === 'advancement-committed')).toBe(true)
    })
  })

  it('filters the power library', async () => {
    await seedCampaign()
    route('/powers')
    render(<App />)
    await screen.findByRole('heading', { name: 'Power Library' })
    await userEvent.type(screen.getByLabelText('Search'), 'Petrifying')
    expect(screen.getByText('Petrifying Gaze')).toBeInTheDocument()
  })

  it('displays power details and backlash controls', async () => {
    await seedCampaign()
    route(`/powers/${powerDefinitions[0]!.id}`)
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: powerDefinitions[0]!.name }),
    ).toBeInTheDocument()
    expect(screen.getByText(/No first-roll backlash text is supplied/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark Triggered' })).toBeInTheDocument()
  })

  it('updates catch-up credits', async () => {
    await seedCampaign()
    route('/catch-up')
    render(<App />)
    await screen.findByRole('heading', { name: 'Catch-Up Credits' })
    await userEvent.click(screen.getByRole('button', { name: 'Grant Catch-Up Credit' }))
    expect(await screen.findByText('DM-granted catch-up credit')).toBeInTheDocument()
  })

  it('shows Living Answer requirement list and mana battery separation', async () => {
    await seedCampaign()
    route('/living-answer')
    render(<App />)
    expect(await screen.findAllByRole('heading', { name: 'The Living Answer' })).toHaveLength(2)
    expect(screen.getByText(/emergency-only mechanism/)).toBeInTheDocument()
    expect(screen.getByText('Ordinary powers fully realized')).toBeInTheDocument()
  })

  it('shows validation errors for impossible settings', async () => {
    await seedCampaign()
    route('/settings')
    render(<App />)
    await screen.findByRole('heading', { name: 'Settings' })
    const target = screen.getByLabelText('Target date')
    await userEvent.clear(target)
    await userEvent.type(target, '2025-01-01')
    await userEvent.click(screen.getByRole('button', { name: 'Save Settings' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Target date must be after')
  })

  it('renders manual advancement state in dashboard metrics', async () => {
    await seedCampaign()
    const session = await createSession({ date: '2026-01-03', attended: true })
    await manualAdvancePower({
      powerId: powerDefinitions[0]!.id,
      sessionId: session.id,
      kind: 'normal',
      reason: 'test',
    })
    route('/')
    render(<App />)
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(screen.getByText('Manifested')).toBeInTheDocument()
  })
})

describe('accessible dialog', () => {
  it('closes with Escape and exposes a modal dialog role', async () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <AccessibleDialog open title="Confirm action" onClose={onClose} onConfirm={onConfirm}>
        <p>Confirm this operation.</p>
      </AccessibleDialog>,
    )
    expect(screen.getByRole('dialog', { name: 'Confirm action' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
