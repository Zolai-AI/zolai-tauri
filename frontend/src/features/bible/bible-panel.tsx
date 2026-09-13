import { useState } from 'react'

import { PanelShell } from '@/components/panel/panel-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useBibleBooks,
  useBibleChapters,
  useBibleSearch,
  useBibleVerses,
} from '@/lib/zolai-core/hooks'
import type { BibleVerseParallel } from '@/lib/zolai-core/types'

type LanguageKey = 'zo_tdb77' | 'zo_tedim2010' | 'en_kJV' | 'myanmar'
const LANGUAGES: { key: LanguageKey; label: string; short: string }[] = [
  { key: 'zo_tdb77', label: 'ZO (TDB77)', short: 'ZO TDB77' },
  { key: 'zo_tedim2010', label: 'ZO (Tedim2010)', short: 'ZO T2010' },
  { key: 'en_kJV', label: 'EN (KJV)', short: 'EN' },
  { key: 'myanmar', label: 'Myanmar', short: 'MY' },
]

const VERSE_RANGES = [
  { label: 'All verses', start: null, end: null },
  { label: '1\u20135', start: 1, end: 5 },
  { label: '1\u201310', start: 1, end: 10 },
  { label: '1\u201320', start: 1, end: 20 },
  { label: '1\u201350', start: 1, end: 50 },
]

// NT book abbreviations for section splitting
const NT_ABBRS = new Set([
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO',
  'GAL', 'EPH', 'PHI', 'COL', '1TH', '2TH', '1TI', '2TI',
  'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN',
  '3JN', 'JUD', 'REV',
])

function VerseDisplay({
  verses,
  visibleLangs,
  selectedVerse,
  onSelectVerse,
}: {
  verses: BibleVerseParallel[]
  visibleLangs: Set<LanguageKey>
  selectedVerse: number | null
  onSelectVerse: (v: number) => void
}) {
  if (verses.length === 0) {
    return <p className="text-sm text-muted-foreground">No verses found.</p>
  }
  return (
    <div className="space-y-1.5">
      {verses.map((v) => (
        <div
          key={v.verse}
          onClick={() => onSelectVerse(v.verse)}
          className={`rounded-md border p-2 text-sm cursor-pointer transition-colors ${
            selectedVerse === v.verse
              ? 'border-primary bg-primary/10'
              : 'border-border bg-muted/20 hover:bg-muted/40'
          }`}
        >
          <p className="text-xs font-medium text-primary">
            {v.book_name} {v.verse}
          </p>
          {LANGUAGES.filter((l) => visibleLangs.has(l.key)).map((l) => {
            const text = v[l.key]
            if (!text) return null
            return (
              <p key={l.key} className="mt-1 text-foreground">
                <span className="mr-1 text-[10px] font-medium text-muted-foreground">
                  {l.short}:
                </span>
                {text}
              </p>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function BiblePanel() {
  const [q, setQ] = useState('')
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verseRange, setVerseRange] = useState<number>(0) // index into VERSE_RANGES
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [visibleLangs, setVisibleLangs] = useState<Set<LanguageKey>>(
    new Set(['zo_tdb77', 'en_kJV']),
  )

  const booksQuery = useBibleBooks()
  const chaptersQuery = useBibleChapters(selectedBook)

  const isCustomRange = verseRange === VERSE_RANGES.length
  const range = isCustomRange ? null : VERSE_RANGES[verseRange]
  const verseStart = isCustomRange
    ? Number(customStart) || null
    : range?.start ?? null
  const verseEnd = isCustomRange
    ? Number(customEnd) || null
    : range?.end ?? null

  const versesQuery = useBibleVerses(selectedBook, selectedChapter, verseStart, verseEnd)
  const searchQuery = useBibleSearch(q, 'tdb77', 20)

  const books = booksQuery.data?.books ?? []
  const chapters = chaptersQuery.data?.chapters ?? []
  const verses = versesQuery.data?.verses ?? []
  const bookName = versesQuery.data?.book_name ?? selectedBook ?? ''

  const toggleLang = (key: LanguageKey) => {
    setVisibleLangs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const otBooks = books.filter((b) => !NT_ABBRS.has(b.abbr))
  const ntBooks = books.filter((b) => NT_ABBRS.has(b.abbr))

  return (
    <PanelShell title="Bible" description="Browse \u00b7 search \u00b7 parallel translations">
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search verses (EN or ZO)..."
          />
          <Button
            size="sm"
            disabled={!q.trim() || searchQuery.isFetching}
            onClick={() => void searchQuery.refetch()}
          >
            Search
          </Button>
        </div>

        {/* Book dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground w-12">Book</label>
          <Select
            value={selectedBook ?? ''}
            onValueChange={(v) => {
              setSelectedBook(v)
              setSelectedChapter(null)
              setSelectedVerse(null)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a book..." />
            </SelectTrigger>
            <SelectContent>
              {otBooks.length > 0 && (
                <>
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Old Testament</p>
                  {otBooks.map((b) => (
                    <SelectItem key={b.abbr} value={b.abbr}>
                      {b.name} ({b.abbr})
                    </SelectItem>
                  ))}
                </>
              )}
              {ntBooks.length > 0 && (
                <>
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground">New Testament</p>
                  {ntBooks.map((b) => (
                    <SelectItem key={b.abbr} value={b.abbr}>
                      {b.name} ({b.abbr})
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Chapter dropdown */}
        {selectedBook && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-12">Chapter</label>
            <Select
              value={selectedChapter?.toString() ?? ''}
              onValueChange={(v) => {
                setSelectedChapter(Number(v))
                setSelectedVerse(null)
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Chapter..." />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => (
                  <SelectItem key={c.chapter} value={c.chapter.toString()}>
                    {c.chapter} ({c.verses}v)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Verse range selector */}
        {selectedBook && selectedChapter && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-12">Verses</label>
            <div className="flex flex-wrap gap-1">
              {VERSE_RANGES.map((r, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={verseRange === i ? 'default' : 'outline'}
                  className="h-6 px-2 text-xs"
                  onClick={() => { setVerseRange(i); setSelectedVerse(null) }}
                >
                  {r.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant={isCustomRange ? 'default' : 'outline'}
                className="h-6 px-2 text-xs"
                onClick={() => { setVerseRange(VERSE_RANGES.length); setSelectedVerse(null) }}
              >
                Custom
              </Button>
            </div>
            {isCustomRange && (
              <div className="flex items-center gap-1 ml-2">
                <Input
                  type="number"
                  min={1}
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  placeholder="Start"
                  className="w-16 h-6 text-xs"
                />
                <span className="text-xs text-muted-foreground">-</span>
                <Input
                  type="number"
                  min={1}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  placeholder="End"
                  className="w-16 h-6 text-xs"
                />
              </div>
            )}
          </div>
        )}

        {/* Language toggles */}
        <div className="flex flex-wrap gap-1">
          {LANGUAGES.map((l) => (
            <Button
              key={l.key}
              size="sm"
              variant={visibleLangs.has(l.key) ? 'default' : 'outline'}
              className="h-6 px-2 text-xs"
              onClick={() => toggleLang(l.key)}
            >
              {l.short}
            </Button>
          ))}
        </div>

        {/* Results */}
        {searchQuery.isLoading || searchQuery.isFetching ? (
          <Skeleton className="h-32 w-full" />
        ) : q.trim() && searchQuery.data?.results ? (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">
              Search results ({searchQuery.data.results.length})
            </p>
            <VerseDisplay
              verses={searchQuery.data.results.map((r) => ({
                verse: r.verse ?? 0,
                zo_tdb77: (r as Record<string, unknown>).zo_tdb77 as string ?? '',
                zo_tedim2010: (r as Record<string, unknown>).zo_tedim2010 as string ?? '',
                en_kJV: r.en ?? '',
                myanmar: (r as Record<string, unknown>).myanmar as string ?? '',
                book_name: r.book ?? '',
              }))}
              visibleLangs={visibleLangs}
              selectedVerse={selectedVerse}
              onSelectVerse={setSelectedVerse}
            />
          </div>
        ) : versesQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : selectedBook && selectedChapter ? (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">
              {bookName} {selectedChapter}
              {verseStart != null && verseEnd != null ? `:${verseStart}\u2013${verseEnd}` : ''}
              {' '}({verses.length} verses)
            </p>
            <VerseDisplay
              verses={verses}
              visibleLangs={visibleLangs}
              selectedVerse={selectedVerse}
              onSelectVerse={setSelectedVerse}
            />
          </div>
        ) : null}
      </div>
    </PanelShell>
  )
}
