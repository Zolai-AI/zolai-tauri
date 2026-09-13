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
import type { BibleBook, BibleVerseParallel } from '@/lib/zolai-core/types'

// OT and NT book abbreviations
const OT_BOOKS = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
  '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
  'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER',
  'LAM', 'EZK', 'DAN', 'HOS', 'JOE', 'AMO', 'OBA', 'JON',
  'MIC', 'NAH', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
]
const NT_BOOKS = [
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO',
  'GAL', 'EPH', 'PHI', 'COL', '1TH', '2TH', '1TI', '2TI',
  'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN',
  '3JN', 'JUD', 'REV',
]

type LanguageKey = 'zo_tdb77' | 'zo_tedim2010' | 'en_kJV' | 'myanmar'
const LANGUAGES: { key: LanguageKey; label: string; short: string }[] = [
  { key: 'zo_tdb77', label: 'ZO (TDB77)', short: 'ZO TDB77' },
  { key: 'zo_tedim2010', label: 'ZO (Tedim2010)', short: 'ZO T2010' },
  { key: 'en_kJV', label: 'EN (KJV)', short: 'EN' },
  { key: 'myanmar', label: 'Myanmar', short: 'MY' },
]

function BookGrid({
  books,
  selectedBook,
  onSelect,
}: {
  books: BibleBook[]
  selectedBook: string | null
  onSelect: (abbr: string) => void
}) {
  const bookMap = new Map(books.map((b) => [b.abbr, b]))

  const renderSection = (abbrList: string[], title: string) => {
    const present = abbrList.filter((a) => bookMap.has(a))
    if (present.length === 0) return null
    return (
      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-10">
          {present.map((abbr) => {
            const book = bookMap.get(abbr)!
            return (
              <button
                key={abbr}
                onClick={() => onSelect(abbr)}
                className={`rounded px-1.5 py-1 text-xs font-medium transition-colors ${
                  selectedBook === abbr
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
                title={book.name}
              >
                {abbr}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {renderSection(OT_BOOKS, 'Old Testament')}
      {renderSection(NT_BOOKS, 'New Testament')}
    </div>
  )
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
    <div className="space-y-2">
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
  const [q, setQ] = useState('')
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [visibleLangs, setVisibleLangs] = useState<Set<LanguageKey>>(
    new Set(['zo_tdb77', 'en_kJV']),
  )

  const booksQuery = useBibleBooks()
  const chaptersQuery = useBibleChapters(selectedBook)
  const versesQuery = useBibleVerses(selectedBook, selectedChapter)
  const searchQuery = useBibleSearch(q, 'tdb77', 20)

  const books = booksQuery.data?.books ?? []
  const chapters = chaptersQuery.data?.chapters ?? []
  const verses = versesQuery.data?.verses ?? []

  const toggleLang = (key: LanguageKey) => {
    setVisibleLangs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <PanelShell title="Bible" description="Browse · search · parallel translations">
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search verses (EN or ZO)…"
          />
          <Button
            size="sm"
            disabled={!q.trim() || searchQuery.isFetching}
            onClick={() => void searchQuery.refetch()}
          >
            Search
          </Button>
        </div>

        {/* Book selector */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Select a book
          </p>
          {booksQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <BookGrid
              books={books}
              selectedBook={selectedBook}
              onSelect={(abbr) => {
                setSelectedBook(abbr)
                setSelectedChapter(null)
              }}
            />
          )}
        </div>

        {/* Chapter selector */}
        {selectedBook && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Chapter</label>
            <Select
              value={selectedChapter?.toString() ?? ''}
              onValueChange={(v) => setSelectedChapter(Number(v))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Ch…" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => (
                  <SelectItem key={c.chapter} value={c.chapter.toString()}>
                    {c.chapter} ({c.verses}v)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {versesQuery.data?.book_name ?? selectedBook}
            </span>
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
            />
          </div>
        ) : versesQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : selectedBook && selectedChapter ? (
          <VerseDisplay verses={verses} visibleLangs={visibleLangs} />
        ) : null}
      </div>
    </PanelShell>
  )
}
