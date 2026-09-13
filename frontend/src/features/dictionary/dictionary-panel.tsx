import { useState, useMemo, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { PanelShell } from '@/components/panel/panel-shell'
import { RunScriptBlock } from '@/components/panel/run-script-block'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAddDict,
  useDeleteDict,
  useDictBrowsePaginated,
  useDictSearch,
  useNonZolaiCheck,
  useUpdateDict,
} from '@/lib/zolai-core/hooks'
import type { DictEntry, RunScriptResult } from '@/lib/zolai-core/types'
import { ChevronLeft, ChevronRight, Search, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'

/** Clean dictionary text for display: strip HTML entities, control chars, truncate. */
function cleanDisplay(text: string | undefined | null): string {
  if (!text) return '—'
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\u2413/g, '')
    .replace(/["'\u201C\u201D]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

/** Highlight matching text */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function DictEntryCard({ entry, highlight }: { entry: DictEntry; highlight?: string }) {
  const zolai = cleanDisplay(entry.zolai ?? entry.word ?? entry.key)
  const english = cleanDisplay(entry.english)
  const myanmar = cleanDisplay(entry.myanmar)
  return (
    <div className="rounded-lg border border-border/60 bg-muted/10 p-3 transition-colors hover:bg-muted/25">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-foreground">
          {highlight ? <HighlightText text={zolai} query={highlight} /> : zolai}
        </span>
        {entry.pos ? <Badge variant="outline" className="text-[10px]">{entry.pos}</Badge> : null}
        <Badge variant="secondary" className="text-[10px] bg-primary/10">ZO→EN</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {highlight ? <HighlightText text={english} query={highlight} /> : english}
      </p>
      {myanmar && myanmar !== '—' ? (
        <p className="mt-0.5 text-xs text-muted-foreground/70">{myanmar}</p>
      ) : null}
    </div>
  )
}

const LETTERS = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const PAGE_SIZE = 25

export function DictionaryPanel() {
  const [activeTab, setActiveTab] = useState('browse')
  const [page, setPage] = useState(1)
  const [letter, setLetter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const browse = useDictBrowsePaginated(page, PAGE_SIZE, letter || undefined)
  const search = useDictSearch(debouncedQuery, 50)
  const nonZolai = useNonZolaiCheck()

  // CRUD
  const [form, setForm] = useState({ word: '', english: '', myanmar: '', pos: '' })
  const [edit, setEdit] = useState({ word: '', field: '', value: '' })
  const add = useAddDict()
  const update = useUpdateDict()
  const remove = useDeleteDict()

  const totalPages = useMemo(() => {
    const total = browse.data?.count ?? browse.data?.results?.length ?? 0
    return Math.max(1, Math.ceil(total / PAGE_SIZE))
  }, [browse.data])

  const entries = useMemo(() => {
    const data = browse.data
    if (!data) return []
    if (Array.isArray(data.results) && data.results.length > 0) return data.results as DictEntry[]
    if (Array.isArray(data.rows)) {
      return data.rows.map((r) => ({
        zolai: String(r.zolai ?? r.word ?? r.headword ?? ''),
        english: String(r.english ?? ''),
        myanmar: String(r.myanmar ?? ''),
        pos: String(r.pos ?? ''),
      })) as DictEntry[]
    }
    return []
  }, [browse.data])

  const searchEntries = useMemo(() => {
    if (!search.data) return []
    return Array.isArray(search.data.results) ? search.data.results : []
  }, [search.data])

  const handleLetterChange = useCallback((l: string) => {
    setLetter(l === '#' ? '' : l)
    setPage(1)
  }, [])

  function handleAdd() {
    if (!form.word.trim()) return
    void add.mutateAsync(form)
      .then(() => {
        toast.success(`Added "${form.word}"`)
        setForm({ word: '', english: '', myanmar: '', pos: '' })
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)))
  }

  function handleUpdate() {
    if (!edit.word.trim() || !edit.field.trim()) return
    void update.mutateAsync(edit)
      .then(() => toast.success('Updated'))
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)))
  }

  function handleDelete() {
    if (!edit.word.trim()) return
    void remove.mutateAsync(edit.word)
      .then(() => toast.success(`Deleted "${edit.word}"`))
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)))
  }

  const nonZolaiResult: RunScriptResult | null = nonZolai.data ?? (nonZolai.error ? { error: nonZolai.error.message } : null)

  return (
    <PanelShell title="Dictionary" description="Search · browse · add · edit · delete · non-Zolai check">
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Zolai / English / Myanmar…"
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="add"><Plus className="mr-1 size-3" />Add</TabsTrigger>
            <TabsTrigger value="edit"><Pencil className="mr-1 size-3" />Edit</TabsTrigger>
            <TabsTrigger value="nonzolai"><AlertTriangle className="mr-1 size-3" />Non-Zolai</TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="pt-2 space-y-3">
            {/* Letter filter */}
            <div className="flex flex-wrap gap-1">
              {LETTERS.map((l) => (
                <button
                  key={l}
                  onClick={() => handleLetterChange(l)}
                  className={`size-7 rounded text-xs font-medium transition-colors ${
                    (l === '#' && letter === '') || l === letter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {browse.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : entries.length > 0 ? (
              <>
                <div className="space-y-2">
                  {entries.map((e, i) => (
                    <DictEntryCard key={`${e.zolai ?? ''}-${i}`} entry={e} />
                  ))}
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                    {browse.data?.count ? ` · ${browse.data.count.toLocaleString()} entries` : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-3" /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No entries found.</p>
            )}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="pt-2">
            {debouncedQuery.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Type in the search bar above to search.</p>
            ) : search.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : searchEntries.length > 0 ? (
              <div className="space-y-2">
                {searchEntries.map((e, i) => (
                  <DictEntryCard key={`${e.zolai ?? ''}-${i}`} entry={e} highlight={debouncedQuery} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No results for "{debouncedQuery}".</p>
            )}
          </TabsContent>

          {/* Add Tab */}
          <TabsContent value="add" className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Zolai word" value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} />
              <Input placeholder="POS (noun/verb…)" value={form.pos} onChange={(e) => setForm({ ...form, pos: e.target.value })} />
              <Input placeholder="English" value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} />
              <Input placeholder="Myanmar" value={form.myanmar} onChange={(e) => setForm({ ...form, myanmar: e.target.value })} />
            </div>
            <Button onClick={handleAdd} disabled={!form.word.trim() || add.isPending}>
              <Plus className="mr-1 size-3" /> Add word
            </Button>
          </TabsContent>

          {/* Edit/Delete Tab */}
          <TabsContent value="edit" className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Word to edit/delete" value={edit.word} onChange={(e) => setEdit({ ...edit, word: e.target.value })} />
              <Input placeholder="Field (english/myanmar/pos…)" value={edit.field} onChange={(e) => setEdit({ ...edit, field: e.target.value })} />
              <Input placeholder="New value" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={!edit.word.trim() || !edit.field.trim() || update.isPending}>
                <Pencil className="mr-1 size-3" /> Save field
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={!edit.word.trim() || remove.isPending}>
                <Trash2 className="mr-1 size-3" /> Delete word
              </Button>
            </div>
          </TabsContent>

          {/* Non-Zolai Tab */}
          <TabsContent value="nonzolai" className="pt-2">
            <RunScriptBlock result={nonZolaiResult} />
            {!nonZolaiResult ? <p className="text-sm text-muted-foreground">Loads on mount — re-run by switching to this tab.</p> : null}
            <Button size="sm" className="mt-2" onClick={() => void nonZolai.refetch()}>Re-check</Button>
          </TabsContent>
        </Tabs>
      </div>
    </PanelShell>
  )
}
