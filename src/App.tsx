import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { OnboardingWizard } from './components/OnboardingWizard'
import { AppStateProvider, useAppState } from './state/AppState'
import { AuditScreen } from './routes/AuditScreen'
import { BackupScreen } from './routes/BackupScreen'
import { CatchUpScreen } from './routes/CatchUpScreen'
import { ConvergenceScreen } from './routes/ConvergenceScreen'
import { DashboardScreen } from './routes/DashboardScreen'
import { DrawScreen } from './routes/DrawScreen'
import { HelpScreen } from './routes/HelpScreen'
import { LivingAnswerScreen } from './routes/LivingAnswerScreen'
import { PowerDetailScreen } from './routes/PowerDetailScreen'
import { PowerLibraryScreen } from './routes/PowerLibraryScreen'
import { SessionsScreen } from './routes/SessionsScreen'
import { SettingsScreen } from './routes/SettingsScreen'
import { SkillTreeScreen } from './routes/SkillTreeScreen'
import { TimelineScreen } from './routes/TimelineScreen'

function AppRoutes() {
  const { data, ready } = useAppState()
  if (!ready) {
    return (
      <main className="loading-screen" aria-live="polite">
        <div className="sigil" />
        <p>Opening Dumare campaign ledger...</p>
      </main>
    )
  }
  if (!data.campaign) {
    return <OnboardingWizard />
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardScreen />} />
          <Route path="sessions" element={<SessionsScreen />} />
          <Route path="draw" element={<DrawScreen />} />
          <Route path="powers" element={<PowerLibraryScreen />} />
          <Route path="powers/:powerId" element={<PowerDetailScreen />} />
          <Route path="tree" element={<SkillTreeScreen />} />
          <Route path="timeline" element={<TimelineScreen />} />
          <Route path="catch-up" element={<CatchUpScreen />} />
          <Route path="convergence" element={<ConvergenceScreen />} />
          <Route path="living-answer" element={<LivingAnswerScreen />} />
          <Route path="audit" element={<AuditScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="backup" element={<BackupScreen />} />
          <Route path="help" element={<HelpScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <AppRoutes />
    </AppStateProvider>
  )
}
