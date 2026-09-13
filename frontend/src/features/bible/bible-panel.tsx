import { useState, useCallback } from 'react'

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

const NT_ABBRS = new Set([
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO',
  'GAL', 'EPH', 'PHI', 'COL', '1TH', '2TH', '1TI', '2TI',
  'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN',
  '3JN', 'JUD', 'REV',
])

/** Parse a reference string like "GEN 1:1-5" or "1CH 3" */
function parseRef(input: string): { book: string; chapter: number; verseStart: number | null; verseEnd: number | null } | null {
  const m = input.trim().match(/^(\d?[A-Z]{2,3})\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i)
  if (!m) return null
  const book = m[1].toUpperCase()
  const chapter = Number(m[2])
  const verseStart = m[3] ? Number(m[3]) : null
  const verseEnd = m[4] ? Number(m[4]) : (m[3] ? Number(m[3]) : null)
  return { book, chapter, verseStart, verseEnd }
}

/** Build a reference string from parts */
function buildRef(book: string, chapter: number | null, verseStart: number | null, verseEnd: number | null): string {
  if (!book) return ''
  if (!chapter) return book
  if (verseStart != null && verseEnd != null && verseStart !== verseEnd) {
    return `${book} ${chapter}:${verseStart}-${verseEnd}`
  }
  if (verseStart != null) {
    return `${book} ${chapter}:${verseStart}`
  }
  return `${book} ${chapter}`
}

function VerseDisplay({
  verses,
  visibleLangs,
}: {
  verses: BibleVerseParallel[]
  visibleLangs: Set<LanguageKey>
}) {
  if (verses.length === 0) {
    return <p className="text-sm text-muted-foreground">No verses found.</p>
  }
  return (
    <div className="space-y-1.5">
      {verses.map((v) => (
        <div
          key={v.verse}
          className="rounded-md border border-border bg-muted/20 p-2 text-sm"
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
  const [refInput, setRefInput] = useState('GEN 1')
  const [selectedBook, setSelectedBook] = useState<string | null>('GEN')
  const [selectedChapter, setSelectedChapter] = useState<number | null>(1)
  const [verseStart, setVerseStart] = useState<number | null>(null)
  const [verseEnd, setVerseEnd] = useState<number | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [visibleLangs, setVisibleLangs] = useState<Set<LanguageKey>>(
    new Set(['zo_tdb77', 'en_kJV']),
  )

  const booksQuery = useBibleBooks()
  const chaptersQuery = useBibleChapters(selectedBook)
  const versesQuery = useBibleVerses(selectedBook, selectedChapter, verseStart, verseEnd)
  const searchQuery = useBibleSearch(searchQ, 'tdb77', 20)

  const books = booksQuery.data?.books ?? []
  const chapters = chaptersQuery.data?.chapters ?? []
  const verses = versesQuery.data?.verses ?? []
  const bookName = versesQuery.data?.book_name ?? selectedBook ?? ''

  // Parse reference input → update state
  const applyRef = useCallback((value: string) => {
    const parsed = parseRef(value)
    if (!parsed) return
    // Only update if book actually changed
    setSelectedBook((prev) => {
      if (prev !== parsed.book) {
        setSelectedChapter(null)
        setVerseStart(null)
        setVerseEnd(null)
      }
      return parsed.book
    })
    setSelectedChapter(parsed.chapter)
    setVerseStart(parsed.verseStart)
    setVerseEnd(parsed.verseEnd)
  }, [])

  // When user types in reference input, parse and apply on Enter
  const handleRefKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyRef(refInput)
    }
  }

  // Sync dropdowns → reference input
  const syncRef = useCallback((book: string | null, chapter: number | null, vStart: number | null, vEnd: number | null) => {
    setRefInput(buildRef(book ?? '', chapter, vStart, vEnd))
  }, [])

  // Book dropdown change
  const handleBookChange = (book: string) => {
    setSelectedBook(book)
    setSelectedChapter(null)
    setVerseStart(null)
    setVerseEnd(null)
    syncRef(book, null, null, null)
  }

  // Chapter dropdown change
  const handleChapterChange = (ch: string) => {
    const chapter = Number(ch)
    setSelectedChapter(chapter)
    setVerseStart(null)
    setVerseEnd(null)
    syncRef(selectedBook, chapter, null, null)
  }

  // Verse dropdown change
  const handleVerseChange = (val: string) => {
    if (val === 'all') {
      setVerseStart(null)
      setVerseEnd(null)
      syncRef(selectedBook, selectedChapter, null, null)
    } else {
      const [s, e] = val.split('-').map(Number)
      setVerseStart(s)
      setVerseEnd(e ?? s)
      syncRef(selectedBook, selectedChapter, s, e ?? s)
    }
  }

  // Quick verse presets
  const quickVerses = [
    { label: 'All', value: 'all' },
    { label: '1', value: '1' },
    { label: '1–5', value: '1-5' },
    { label: '1–10', value: '1-10' },
    { label: '1–20', value: '1-20' },
  ]

  // Current verse dropdown value
  const currentVerseVal = verseStart != null && verseEnd != null
    ? (verseStart === verseEnd ? `${verseStart}` : `${verseStart}-${verseEnd}`)
    : 'all'

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

  const refLabel = selectedBook
    ? `${bookName} ${selectedChapter ?? ''}` +
      (verseStart != null && verseEnd != null && verseStart !== verseEnd
        ? `:${verseStart}–${verseEnd}`
        : verseStart != null
          ? `:${verseStart}`
          : '')
    : ''

  return (
    <PanelShell title="Bible" description="Browse · search · parallel translations">
      <div className="space-y-4">
        {/* Reference input */}
        <div className="flex items-center gap-2">
          <Input
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            onKeyDown={handleRefKeyDown}
            onBlur={() => applyRef(refInput)}
            placeholder="e.g. GEN 1:1-5"
            className="flex-1"
          />
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2">
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search verses (EN or ZO)..."
            className="flex-1"
          />
          <Button
            size="sm"
            disabled={!searchQ.trim() || searchQuery.isFetching}
            onClick={() => void searchQuery.refetch()}
          >
            Search
          </Button>
        </div>

        {/* Book / Chapter / Verse dropdowns */}
        <div className="flex items-center gap-2">
          <Select value={selectedBook ?? ''} onValueChange={handleBookChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Book…" />
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

          {selectedBook && (
            <Select value={selectedChapter?.toString() ?? ''} onValueChange={handleChapterChange}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Ch…" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => (
                  <SelectItem key={c.chapter} value={c.chapter.toString()}>
                    {c.chapter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedBook && selectedChapter && (
            <Select value={currentVerseVal} onValueChange={handleVerseChange}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Verse…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {quickVerses.filter((v) => v.value !== 'all').map((v) => (
                  <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

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
        ) : searchQ.trim() && searchQuery.data?.results ? (
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
            />
          </div>
        ) : versesQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : selectedBook && selectedChapter ? (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">
              {refLabel} ({verses.length} verses)
            </p>
            <VerseDisplay verses={verses} visibleLangs={visibleLangs} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Select a book and chapter to start reading.
          </p>
        )}
      </div>
    </PanelShell>
  )
}
