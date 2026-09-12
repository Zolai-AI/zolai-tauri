import { useState } from 'react'

import { PanelShell } from '@/components/panel/panel-shell'
import { RunScriptBlock } from '@/components/panel/run-script-block'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  useBibleContext,
  useBibleLearn,
  useBibleSearch,
  useBibleStudy,
  useBibleTopics,
} from '@/lib/zolai-core/hooks'
import type { BibleVerseResult } from '@/lib/zolai-core/types'

function VerseList({ results }: { results: BibleVerseResult[] }) {
  if (results.length === 0) return <p className="text-sm text-muted-foreground">No verses found.</p>
  return (
    <div className="space-y-2">
      {results.map((v, i) => (
        <div key={i} className="rounded-md border border-border bg-muted/20 p-2 text-sm">
          <p className="text-xs font-medium text-primary">
            {v.book ?? ''} {v.chapter ?? ''}:{v.verse ?? ''}
          </p>
          <p className="mt-1 text-foreground">{v.zo ?? ''}</p>
          {v.en ? <p className="mt-0.5 text-muted-foreground">{v.en}</p> : null}
        </div>
      ))}
    </div>
  )
}

export function BiblePanel() {
  const [q, setQ] = useState('')
  const [book, setBook] = useState('GEN')
  const [level, setLevel] = useState('A1')
  const [contextWord, setContextWord] = useState('')

  const search = useBibleSearch(q, 'tdb77', 10)
  const study = useBibleStudy()
  const learn = useBibleLearn()
  const context = useBibleContext('word')
  const topics = useBibleTopics()

  return (
    <PanelShell title="Bible" description="Search verses · study · learn · context analysis">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search verses (EN or ZO)…"
          />
          <Button
            size="sm"
            disabled={!q.trim() || search.isFetching}
            onClick={() => void search.refetch()}
          >
            Search
          </Button>
        </div>

        <Tabs defaultValue="search">
          <TabsList>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="pt-2">
            {search.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <VerseList
                results={Array.isArray(search.data?.results) ? search.data.results : []}
              />
            )}
          </TabsContent>

          <TabsContent value="study" className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Input
                value={book}
                onChange={(e) => setBook(e.target.value)}
                placeholder="Book (e.g. GEN)"
                className="w-32"
              />
              <Button size="sm" onClick={() => void study.mutateAsync(book)} disabled={study.isPending}>
                {study.isPending ? 'Running…' : 'Study book'}
              </Button>
            </div>
            <RunScriptBlock result={study.data} />
          </TabsContent>

          <TabsContent value="learn" className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Input
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="Level (A1-C2)"
                className="w-32"
              />
              <Button size="sm" onClick={() => void learn.mutateAsync(level)} disabled={learn.isPending}>
                {learn.isPending ? 'Running…' : 'Learn level'}
              </Button>
            </div>
            <RunScriptBlock result={learn.data} />
          </TabsContent>

          <TabsContent value="context" className="space-y-3 pt-2">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Word context</label>
                <Input value={contextWord} onChange={(e) => setContextWord(e.target.value)} placeholder="e.g. pasian" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void context.mutateAsync(contextWord)} disabled={contextWord.trim() === '' || context.isPending}>
                Word context
              </Button>
              <Button size="sm" onClick={() => void topics.mutateAsync()} disabled={topics.isPending}>
                {topics.isPending ? 'Running…' : 'Topics'}
              </Button>
            </div>
            <RunScriptBlock result={context.data ?? topics.data} />
          </TabsContent>
        </Tabs>
      </div>
    </PanelShell>
  )
}