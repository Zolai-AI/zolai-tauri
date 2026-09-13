import { useState } from 'react'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  useAddDict,
  useDeleteDict,
  useDictBrowse,
  useDictSearch,
  useNonZolaiCheck,
  useUpdateDict,
} from '@/lib/zolai-core/hooks'
import type { DictEntry, RunScriptResult } from '@/lib/zolai-core/types'

function DictTable({ entries }: { entries: DictEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No results.</p>
  return (
    <div className="max-h-96 overflow-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zolai</TableHead>
            <TableHead>English</TableHead>
            <TableHead>Myanmar</TableHead>
            <TableHead>POS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{e.zolai ?? e.word ?? e.key ?? ''}</TableCell>
              <TableCell className="text-muted-foreground">{e.english ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{e.myanmar ?? '—'}</TableCell>
              <TableCell>{e.pos ? <Badge variant="outline">{e.pos}</Badge> : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function DictionaryPanel() {
  const [q, setQ] = useState('')
  const search = useDictSearch(q, 20)
  const browse = useDictBrowse(50)
  const nonZolai = useNonZolaiCheck()

  // CRUD
  const [form, setForm] = useState({ word: '', english: '', myanmar: '', pos: '' })
  const [edit, setEdit] = useState({ word: '', field: '', value: '' })
  const add = useAddDict()
  const update = useUpdateDict()
  const remove = useDeleteDict()

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
    if (!edit.word.trim() || !edit.field.trim()) return
    void remove.mutateAsync(edit.word)
      .then(() => toast.success(`Deleted "${edit.word}"`))
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)))
  }

  const nonZolaiResult: RunScriptResult | null = nonZolai.data ?? (nonZolai.error ? { error: nonZolai.error.message } : null)

  return (
    <PanelShell title="Dictionary" description="Search · browse · add · edit · delete · non-Zolai check">
      <div className="space-y-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Zolai / English / Myanmar…"
        />

        <Tabs defaultValue="results">
          <TabsList>
            <TabsTrigger value="results">Search results</TabsTrigger>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="add">Add</TabsTrigger>
            <TabsTrigger value="edit">Edit / Delete</TabsTrigger>
            <TabsTrigger value="nonzolai">Non-Zolai</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="pt-2">
            {search.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <DictTable
                entries={Array.isArray(search.data?.results) ? search.data.results : []}
              />
            )}
          </TabsContent>

          <TabsContent value="browse" className="pt-2">
            {browse.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <DictTable
                entries={
                  Array.isArray(browse.data?.results)
                    ? browse.data.results
                    : Array.isArray(browse.data?.rows)
                      ? browse.data.rows
                      : []
                }
              />
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Zolai word" value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} />
              <Input placeholder="POS (noun/verb…)" value={form.pos} onChange={(e) => setForm({ ...form, pos: e.target.value })} />
              <Input placeholder="English" value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} />
              <Input placeholder="Myanmar" value={form.myanmar} onChange={(e) => setForm({ ...form, myanmar: e.target.value })} />
            </div>
            <Button onClick={handleAdd} disabled={!form.word.trim() || add.isPending}>Add word</Button>
          </TabsContent>

          <TabsContent value="edit" className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Word to edit/delete" value={edit.word} onChange={(e) => setEdit({ ...edit, word: e.target.value })} />
              <Input placeholder="Field (english/myanmar/pos…)" value={edit.field} onChange={(e) => setEdit({ ...edit, field: e.target.value })} />
              <Input placeholder="New value" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={!edit.word.trim() || !edit.field.trim() || update.isPending}>Save field</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={!edit.word.trim() || !edit.field.trim() || remove.isPending}>Delete word</Button>
            </div>
          </TabsContent>

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