import { expect, test, type Page } from '@playwright/test'
import { ordinaryPowerDefinitions } from '../../src/data/powers'

async function completeOnboarding(page: Page) {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Dumare: Power Realization Tracker' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Campaign name').fill('E2E Dumare Campaign')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Campaign start date').fill('2026-01-01')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Target Living Answer date').fill('2027-01-01')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Expected sessions per month').fill('4')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Create Campaign' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
}

async function createSession(page: Page, attended = true, title = 'E2E Session') {
  await page.goto('/sessions')
  await page.getByLabel('Session title').fill(title)
  if (!attended) {
    await page.getByLabel('Attendance').selectOption('missed')
  }
  await page.getByRole('button', { name: 'Save Session' }).click()
  await expect(page.getByText(title)).toBeVisible()
}

async function firstRandomAdvancement(page: Page) {
  await page.goto('/draw')
  await page.evaluate(() => window.localStorage.setItem('dumareRandomSeed', '11'))
  await page.getByRole('button', { name: 'Draw and Reveal' }).click()
  const resultName = await page.locator('.draw-result strong').innerText()
  await expect(page.getByRole('button', { name: 'Confirm and Commit' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirm and Commit' }).click()
  await expect(page.getByText('No draw preview is active')).toBeVisible()
  return resultName
}

async function manualAdvance(page: Page, visiblePowerName: string) {
  await page.goto('/draw')
  const powerId = ordinaryPowerDefinitions.find((power) => power.name === visiblePowerName)?.id
  if (!powerId) throw new Error(`Power not found for ${visiblePowerName}`)
  await page.getByLabel('Power').selectOption(powerId)
  await page.getByRole('button', { name: 'Switch to Manual Selection' }).click()
  await page.waitForFunction(async (id) => {
    const openRequest = indexedDB.open('dumare-power-realization-tracker')
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onerror = () =>
        reject(new Error(openRequest.error?.message ?? 'IndexedDB open failed'))
      openRequest.onsuccess = () => resolve(openRequest.result)
    })
    const state = await new Promise<string | undefined>((resolve, reject) => {
      const tx = database.transaction('powerProgress', 'readonly')
      const request = tx.objectStore('powerProgress').get(id)
      request.onsuccess = () => {
        const result = request.result as { state?: string } | undefined
        resolve(result?.state)
      }
      request.onerror = () => reject(new Error(request.error?.message ?? 'Progress lookup failed'))
    })
    database.close()
    return state === 'fully-realized'
  }, powerId)
}

async function markAllMechanicalRequirementsComplete(page: Page) {
  const ordinaryIds = ordinaryPowerDefinitions.map((power) => power.id)
  await page.evaluate(async (ids) => {
    const openRequest = indexedDB.open('dumare-power-realization-tracker')
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onerror = () =>
        reject(new Error(openRequest.error?.message ?? 'IndexedDB open failed'))
      openRequest.onsuccess = () => resolve(openRequest.result)
    })
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(
        ['powerProgress', 'narrativeRequirements', 'livingAnswer'],
        'readwrite',
      )
      const progressStore = tx.objectStore('powerProgress')
      for (const id of ids) {
        progressStore.put({
          powerId: id,
          state: 'fully-realized',
          manifestationCount: 1,
          appearanceCount: 2,
          lastAdvancedAt: '2026-12-01T00:00:00.000Z',
          advancedSessionIds: ['seed-a', 'seed-b'],
          narrativeLocked: false,
          temporaryExcluded: false,
          randomSelectionAllowed: true,
          backlashStatus: 'not-triggered',
        })
      }
      progressStore.put({
        powerId: 'convergence-engine',
        state: 'fully-realized',
        manifestationCount: 1,
        appearanceCount: 3,
        lastAdvancedAt: '2026-12-01T00:00:00.000Z',
        advancedSessionIds: ['seed-convergence'],
        narrativeLocked: false,
        temporaryExcluded: false,
        randomSelectionAllowed: false,
        backlashStatus: 'not-triggered',
      })
      const reqStore = tx.objectStore('narrativeRequirements')
      reqStore.put({
        id: 'living-dm-approval',
        label: 'DM approval',
        description: 'E2E complete',
        complete: true,
        completedAt: '2026-12-01T00:00:00.000Z',
        source: 'living-answer',
      })
      reqStore.put({
        id: 'living-final-sign',
        label: 'Final sign revealed',
        description: 'E2E complete',
        complete: true,
        completedAt: '2026-12-01T00:00:00.000Z',
        source: 'living-answer',
      })
      tx.objectStore('livingAnswer').put({
        id: 'the-living-answer',
        status: 'mechanically-available',
        mechanicallyAvailableAt: '2026-12-01T00:00:00.000Z',
        manaBatteryEmergencyOnly: true,
        manaBatteryFullActivation: 'inactive',
      })
      tx.oncomplete = () => {
        database.close()
        resolve()
      }
      tx.onerror = () => reject(new Error(tx.error?.message ?? 'IndexedDB transaction failed'))
    })
  }, ordinaryIds)
}

test.describe('desktop campaign workflows', () => {
  test.beforeEach(({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chromium',
      'Workflow coverage runs once on desktop.',
    )
    page.on('dialog', (dialog) => dialog.accept('E2E reason'))
  })

  test('E2E Workflow 1: New Campaign', async ({ page }) => {
    await completeOnboarding(page)
    await page.goto('/powers')
    await expect(page.getByTestId(`power-state-${ordinaryPowerDefinitions[0]!.id}`)).toHaveText(
      'Locked',
    )
    await page.goto('/living-answer')
    await expect(page.getByText(/Status: Requirements in progress|Status: Sealed/)).toBeVisible()
    await page.goto('/audit')
    await expect(page.getByRole('heading', { name: 'Campaign Created' })).toBeVisible()
  })

  test('E2E Workflow 2: First Random Advancement', async ({ page }) => {
    await completeOnboarding(page)
    await createSession(page, true, 'First Draw Session')
    const powerName = await firstRandomAdvancement(page)
    const powerId = ordinaryPowerDefinitions.find((power) => power.name === powerName)!.id
    await page.goto('/powers')
    await expect(page.getByText(powerName)).toBeVisible()
    await expect(page.getByTestId(`power-state-${powerId}`)).toHaveText('Manifested')
    await page.goto('/audit')
    await expect(page.getByRole('heading', { name: 'Advancement Committed' })).toBeVisible()
  })

  test('E2E Workflow 3: Full Realization', async ({ page }) => {
    await completeOnboarding(page)
    await createSession(page, true, 'Realization Session')
    const powerName = await firstRandomAdvancement(page)
    const powerId = ordinaryPowerDefinitions.find((power) => power.name === powerName)!.id
    await manualAdvance(page, powerName)
    await page.goto('/powers')
    await expect(page.getByTestId(`power-state-${powerId}`)).toHaveText('Fully Realized')
    await page.goto('/draw')
    await expect(page.getByText('Already fully realized').first()).toBeVisible()
  })

  test('E2E Workflow 4: Missed Sessions', async ({ page }) => {
    await completeOnboarding(page)
    await createSession(page, false, 'Missed One')
    await createSession(page, false, 'Missed Two')
    await page.goto('/catch-up')
    await expect(page.getByText(/Missed session/).first()).toBeVisible()
    await page.getByRole('button', { name: 'Approve' }).first().click()
    await expect(page.getByText('Approved').first()).toBeVisible()
    await createSession(page, true, 'Return Session')
    await page.goto('/draw')
    await page.getByLabel('Draw type').selectOption('catch-up')
    await page.getByRole('button', { name: 'Draw and Reveal' }).click()
    const creditSelect = page.getByLabel('Catch-up credit to use')
    await expect(creditSelect.locator('option')).toHaveCount(2)
    await creditSelect.selectOption({ index: 1 })
    await expect(creditSelect).not.toHaveValue('')
    await page.getByRole('button', { name: 'Confirm and Commit' }).click()
    await expect(page.getByText('No draw preview is active')).toBeVisible()
    await page.goto('/audit')
    await expect(page.getByRole('heading', { name: 'Catch Up Credit Used' })).toBeVisible()
  })

  test('E2E Workflow 5: Convergence Engine', async ({ page }) => {
    await completeOnboarding(page)
    await markAllMechanicalRequirementsComplete(page)
    await page.goto('/convergence')
    await expect(page.getByText('Complete').first()).toBeVisible()
    await expect(
      page.getByText(/19 ordinary powers fully realized|Fully Realized Ordinary Powers/),
    ).toBeVisible()
  })

  test('E2E Workflow 6: The Living Answer', async ({ page }) => {
    await completeOnboarding(page)
    await markAllMechanicalRequirementsComplete(page)
    await page.goto('/living-answer')
    await expect(page.getByText(/Status: Mechanically available/)).toBeVisible()
    await expect(page.getByText(/emergency-only mechanism/)).toBeVisible()
    await page.getByRole('button', { name: 'Confirm Narrative Reveal' }).click()
    await expect(page.getByText(/Status: Narratively revealed/)).toBeVisible()
    await page.goto('/audit')
    await expect(page.getByRole('heading', { name: 'Living Answer Revealed' })).toBeVisible()
  })

  test('E2E Workflow 7: Backup and Restore', async ({ page }) => {
    await completeOnboarding(page)
    await createSession(page, true, 'Backup Session')
    await firstRandomAdvancement(page)
    await page.goto('/backup')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export Campaign Backup' }).click()
    const download = await downloadPromise
    const path = await download.path()
    if (!path) throw new Error('Backup download path was not created.')
    await page.getByRole('button', { name: 'Reset Campaign' }).click()
    await expect(
      page.getByRole('heading', { name: 'Dumare: Power Realization Tracker' }),
    ).toBeVisible()
    await completeOnboarding(page)
    await page.goto('/backup')
    await page.locator('input[type="file"]').setInputFiles(path)
    await expect(page.getByText(/Backup exported/)).toBeVisible()
    await page.getByRole('button', { name: 'Confirm Import' }).click()
    await expect(page.getByText(/Backup exported/)).toBeHidden()
    await page.goto('/sessions')
    await expect(page.getByText('Backup Session')).toBeVisible()
  })
})

test('E2E Workflow 8: Responsive Layout', async ({ page }) => {
  await completeOnboarding(page)
  await page.goto('/tree')
  await expect(page.getByRole('heading', { name: 'Interactive Skill Tree' })).toBeVisible()
  await page.getByRole('button', { name: 'Zoom In' }).click()
  await page.getByRole('button', { name: 'Reset View' }).click()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(2)
  await page.mouse.move(500, 500)
  await page.mouse.down()
  await page.mouse.move(560, 540)
  await page.mouse.up()
  await expect(page.getByRole('link', { name: /Petrifying Gaze/ })).toBeVisible()
})
