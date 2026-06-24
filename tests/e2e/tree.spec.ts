import { expect, test, type Page } from '@playwright/test'
import { powers } from '../../src/data/powers'
import { AUTOSAVE_KEY } from '../../src/domain/autosave'
import { createSavePayload } from '../../src/domain/save'
import { progressWithOnlyEligible, progressWithStates } from '../../src/test/factories'

async function startNewTree(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Start New Tree/i }).click()
}

async function setAutosave(page: Page, progress = progressWithStates({})) {
  const payload = createSavePayload(progress)
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value)
    },
    [AUTOSAVE_KEY, JSON.stringify(payload)] as const,
  )
}

test.describe('single-page manifestation tree', () => {
  test('Fresh Start', async ({ page }) => {
    await startNewTree(page)

    await expect(page.getByRole('heading', { name: /DUMARE/i })).toBeVisible()
    await expect(page.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'unmanifested',
    )
    await expect(page.getByTestId('convergence-node')).toHaveAttribute('data-state', 'unmanifested')
    await expect(page.getByText(/Locked/i)).toBeVisible()
    await expect(page.locator('[data-state="first_manifestation"]')).toHaveCount(0)
  })

  test('First Manifestation', async ({ page }) => {
    await startNewTree(page)
    await page.getByRole('button', { name: /Motion: Dramatic/i }).click()
    await page.getByRole('button', { name: /^Manifest/i }).click()

    await expect(page.getByTestId('manifest-reveal')).toBeVisible()
    await expect(page.locator('.revealKind')).toHaveText(/First Manifestation/i)
    await expect(page.getByRole('heading', { name: /First-Roll Backlash/i })).toBeVisible()
    await page.getByRole('button', { name: /Acknowledge/i }).click()

    await expect(page.locator('[data-state="first_manifestation"]')).toHaveCount(1)
  })

  test('Full Manifestation', async ({ page }) => {
    await setAutosave(page, progressWithOnlyEligible('petrifying-gaze', 'first_manifestation'))
    await page.goto('/')
    await page.getByRole('button', { name: /^Manifest/i }).click()
    await page.getByRole('button', { name: /Skip Animation/i }).click()

    await expect(page.getByText(/Full Manifestation/i)).toBeVisible()
    await expect(page.getByText(/removed from future random rolls/i)).toBeVisible()
    await page.getByRole('button', { name: /Acknowledge/i }).click()

    await expect(page.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'fully_manifested',
    )
  })

  test('Save and Load', async ({ page }) => {
    await setAutosave(page, progressWithStates({ 'petrifying-gaze': 'first_manifestation' }))
    await page.goto('/')

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /Save Progress/i }).click()
    const download = await downloadPromise
    const path = await download.path()
    expect(path).toBeTruthy()

    await page.getByRole('button', { name: /Reset Progress/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Reset Progress$/i })
      .click()
    await expect(page.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'unmanifested',
    )

    await page.getByLabel(/Choose Dumare progress save file/i).setInputFiles(path)
    await expect(page.getByText(/Load This Save/i)).toBeVisible()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Load Progress/i })
      .click()

    await expect(page.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'first_manifestation',
    )
  })

  test('Invalid Save', async ({ page }) => {
    await startNewTree(page)
    await page
      .getByLabel(/Choose Dumare progress save file/i)
      .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{') })

    await expect(page.getByText(/not valid JSON/i)).toBeVisible()
    await expect(page.getByTestId('power-node-petrifying-gaze')).toHaveAttribute(
      'data-state',
      'unmanifested',
    )
  })

  test('Pending Result', async ({ page }) => {
    await startNewTree(page)
    await page.getByRole('button', { name: /^Manifest/i }).click()
    await page.reload()

    await expect(page.getByTestId('manifest-reveal')).toBeVisible()
    await expect(page.locator('[data-state="first_manifestation"]')).toHaveCount(0)
  })

  test('Completion and Living Answer', async ({ page }) => {
    const progress = progressWithOnlyEligible('petrifying-gaze', 'first_manifestation')
    await setAutosave(page, progress)
    await page.goto('/')
    await page.getByRole('button', { name: /^Manifest/i }).click()
    await page.getByRole('button', { name: /Skip Animation/i }).click()
    await page.getByRole('button', { name: /Acknowledge/i }).click()

    await expect(page.getByText(/Mechanically Available/i)).toBeVisible()
    await page.getByTestId('living-answer-node').click()
    await expect(page.getByRole('heading', { name: /Mana Battery/i })).toBeVisible()
    await expect(page.getByText(/does not mark the battery as fully activated/i)).toBeVisible()
  })
})

test.describe('responsive layout', () => {
  test('essential controls remain accessible without horizontal overflow', async ({ page }) => {
    await startNewTree(page)

    await expect(page.getByRole('button', { name: /^Manifest/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Save Progress/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Load Progress/i })).toBeVisible()
    await expect(page.getByTestId('power-node-petrifying-gaze')).toBeVisible()

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    )
    expect(hasOverflow).toBe(false)

    await page.getByRole('button', { name: /Zoom in/i }).click()
    await page.getByRole('button', { name: /Reset View/i }).click()
  })

  test('canonical node names remain available to accessibility APIs', async ({ page }) => {
    await startNewTree(page)

    for (const power of powers.slice(0, 5)) {
      await expect(page.getByRole('button', { name: new RegExp(power.name, 'i') })).toBeVisible()
    }
  })
})
