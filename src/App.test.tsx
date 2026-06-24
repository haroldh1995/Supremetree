import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { CANONICAL_DATA_HASH, powers } from './data/powers'
import { AUTOSAVE_KEY } from './domain/autosave'
import { createSavePayload } from './domain/save'
import { progressWithOnlyEligible, progressWithStates } from './test/factories'

describe('Dumare Supreme Power Tree app', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders all canonical power nodes with current DOCX names and numbers', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /start new tree/i }))

    for (const power of powers) {
      expect(screen.getAllByText(power.name)[0]).toBeInTheDocument()
    }
    expect(screen.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'unmanifested',
    )
    expect(screen.getByTestId('convergence-node')).toHaveAttribute('data-state', 'unmanifested')
    expect(screen.getByText(/Locked/i)).toBeInTheDocument()
  })

  it('opens power details without advancing state', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /start new tree/i }))

    const node = screen.getByTestId('power-node-petrifying-gaze')
    await userEvent.click(node)

    expect(screen.getByTestId('power-details')).toBeInTheDocument()
    expect(screen.getByText(/No first-roll backlash was supplied/i)).toBeInTheDocument()
    expect(node).toHaveAttribute('data-state', 'unmanifested')
  })

  it('shows First Manifestation reveal with backlash field and disables Manifest while pending', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /start new tree/i }))
    await userEvent.click(screen.getByRole('button', { name: /motion: dramatic/i }))

    await userEvent.click(screen.getByRole('button', { name: /^manifest/i }))
    expect(screen.getByRole('button', { name: /^manifest/i })).toBeDisabled()

    const reveal = await screen.findByTestId('manifest-reveal')
    expect(within(reveal).getAllByText(/First Manifestation/i).length).toBeGreaterThan(0)
    expect(
      within(reveal).getByRole('heading', { name: /First-Roll Backlash/i }),
    ).toBeInTheDocument()
    expect(within(reveal).getByText(/No first-roll backlash was supplied/i)).toBeInTheDocument()
  })

  it('commits First Manifestation only after acknowledgment', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /start new tree/i }))
    await userEvent.click(screen.getByRole('button', { name: /motion: dramatic/i }))
    await userEvent.click(screen.getByRole('button', { name: /^manifest/i }))

    await screen.findByTestId('manifest-reveal')

    expect(document.querySelectorAll('[data-state="first_manifestation"]')).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: /acknowledge/i }))

    expect(document.querySelectorAll('[data-state="first_manifestation"]')).toHaveLength(1)
  })

  it('shows Full Manifestation reveal and completion details', async () => {
    const progress = progressWithOnlyEligible('petrifying-gaze', 'first_manifestation')
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(createSavePayload(progress)))

    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /motion: dramatic/i }))
    await userEvent.click(screen.getByRole('button', { name: /^manifest/i }))

    expect(await screen.findByText(/Full Manifestation/i)).toBeInTheDocument()
    expect(screen.getByText(/removed from future random rolls/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /acknowledge/i }))

    expect(screen.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'fully_manifested',
    )
  })

  it('rejects invalid load files without changing current state', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /start new tree/i }))

    const input = screen.getByLabelText(/choose dumare progress save file/i)
    await userEvent.upload(input, new File(['{'], 'bad.json', { type: 'application/json' }))

    expect(await screen.findByText(/not valid JSON/i)).toBeInTheDocument()
    expect(screen.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'unmanifested',
    )
  })

  it('loads valid saves only after confirmation', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /start new tree/i }))

    const saved = createSavePayload(
      progressWithStates({ 'petrifying-gaze': 'first_manifestation' }),
    )
    const input = screen.getByLabelText(/choose dumare progress save file/i)
    await userEvent.upload(
      input,
      new File([JSON.stringify(saved)], 'valid.json', { type: 'application/json' }),
    )

    expect(await screen.findByText(/Load This Save/i)).toBeInTheDocument()
    expect(screen.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'unmanifested',
    )
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /load progress/i }),
    )
    expect(screen.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'first_manifestation',
    )
  })

  it('requires confirmation before reset', async () => {
    const progress = progressWithStates({ 'petrifying-gaze': 'first_manifestation' })
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(createSavePayload(progress)))

    render(<App />)
    expect(screen.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'first_manifestation',
    )
    await userEvent.click(screen.getByRole('button', { name: /reset progress/i }))
    expect(screen.getByText(/Reset Progress\?/i)).toBeInTheDocument()
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^reset progress$/i }),
    )
    expect(screen.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'unmanifested',
    )
  })

  it('makes The Living Answer available after all required powers are fully manifested', async () => {
    const progress = progressWithStates(
      Object.fromEntries(powers.map((power) => [power.id, 'fully_manifested'])),
    )
    progress.livingAnswer.state = 'available'
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(createSavePayload(progress)))

    render(<App />)

    expect(screen.getByText(/Mechanically Available/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /reveal the living answer/i }))
    expect(screen.getByText(/mana battery remains/i)).toBeInTheDocument()
  })

  it('downloads save data from the Save Progress control', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /start new tree/i }))

    await userEvent.click(screen.getByRole('button', { name: /save progress/i }))

    expect(createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
  })

  it('stores the canonical hash in autosave', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /start new tree/i }))

    await waitFor(() => {
      expect(localStorage.getItem(AUTOSAVE_KEY)).toContain(CANONICAL_DATA_HASH)
    })
  })
})
