import { Suspense, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { PanelSkeleton } from '@/components/panel/panel-suspense'
import { Layout } from '@/components/shell/layout'
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { PANELS, getPanel } from '@/features'
import { useHealth } from '@/lib/zolai-core/hooks'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function ZolaiStudio() {
  const [activeId, setActiveId] = useState('dashboard')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const health = useHealth()
  const [refreshTick, setRefreshTick] = useState(0)

  const panel = getPanel(activeId)

  function handleRefresh() {
    void queryClient.invalidateQueries()
    setRefreshTick((t) => t + 1)
  }

  return (
    <>
      <Layout
        items={PANELS.map(({ id, label, section, icon }) => ({ id, label, section, icon }))}
        activeId={activeId}
        onSelect={setActiveId}
        connected={health.isSuccess && health.data?.status === 'ok'}
        refreshing={refreshTick > 0 && health.isFetching}
        onRefresh={handleRefresh}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        {panel ? (
          <Suspense fallback={<PanelSkeleton />}>
            <panel.component />
          </Suspense>
        ) : (
          <p className="text-sm text-muted-foreground">Unknown panel.</p>
        )}
      </Layout>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toaster theme="dark" position="bottom-right" />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ZolaiStudio />
    </QueryClientProvider>
  )
}