"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  Loader2,
  MapPin,
  Calendar as CalendarIcon,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { searchRidesAction } from "@/lib/actions/ride"
import { RideCard } from "./RideCard"
import { CITIES } from "@/lib/constants/locations"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
const STORAGE_KEY = "ride-search-prefs"

type SearchParams = {
  fromCity: string
  toCity: string
  date: string
}

function buildSearchQuery(params: SearchParams): string {
  return new URLSearchParams({
    fromCity: params.fromCity,
    toCity: params.toCity,
    date: params.date,
  }).toString()
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

// Only call on client after mount to avoid server/client hydration mismatch
function getStoredDefaultsFromStorage(): Pick<SearchParams, "fromCity" | "toCity"> {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (!s) return { fromCity: "", toCity: "" }
    const j = JSON.parse(s) as Partial<SearchParams>
    return { fromCity: j.fromCity ?? "", toCity: j.toCity ?? "" }
  } catch {
    return { fromCity: "", toCity: "" }
  }
}

function saveToStorage(params: SearchParams) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
  } catch {
    // ignore
  }
}

// Stable initial state so server and client render the same (avoids hydration error)
const INITIAL_DEFAULTS: SearchParams = { fromCity: "", toCity: "", date: "" }

export function RideSearchForm() {
  const router = useRouter()
  const searchParamsFromUrl = useSearchParams()
  const [defaults, setDefaults] = useState<SearchParams>(INITIAL_DEFAULTS)
  const [minDate, setMinDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasRestoredFromUrl = useRef(false)

  const loadMore = useCallback(async () => {
    if (!searchParams || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const result = await searchRidesAction({
        ...searchParams,
        skip: results.length,
      })
      if (result.success && result.rides?.length) {
        setResults((prev) => [...prev, ...result.rides!])
        setHasMore(result.hasMore ?? false)
      } else {
        setHasMore(false)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [searchParams, loadingMore, hasMore, results.length])

  // Restore from localStorage and set date/min only on client (after mount)
  useEffect(() => {
    setMinDate(getTodayDate())
    const stored = getStoredDefaultsFromStorage()
    setDefaults((prev) => ({
      ...prev,
      ...stored,
      date: getTodayDate(),
    }))
  }, [])

  // Restore search from URL when user returns from ride details
  useEffect(() => {
    if (hasRestoredFromUrl.current) return
    const fromCity = searchParamsFromUrl.get("fromCity")
    const toCity = searchParamsFromUrl.get("toCity")
    const date = searchParamsFromUrl.get("date")
    if (!fromCity || !toCity || !date) return
    hasRestoredFromUrl.current = true
    const params: SearchParams = { fromCity, toCity, date }
    setSearchParams(params)
    saveToStorage(params)
    setSearched(true)
    setLoading(true)
    setError(null)
    searchRidesAction(params)
      .then((result) => {
        if (result.success) {
          setResults(result.rides || [])
          setHasMore(result.hasMore ?? false)
        } else {
          setError(result.error || "Search failed")
          setResults([])
          setHasMore(false)
        }
      })
      .catch(() => {
        setError("An unexpected error occurred")
        setResults([])
        setHasMore(false)
      })
      .finally(() => setLoading(false))
  }, [searchParamsFromUrl])

  useEffect(() => {
    if (!searched || !hasMore || loading || loadingMore) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) loadMore()
      },
      { rootMargin: "100px", threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [searched, hasMore, loading, loadingMore, loadMore])

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSearched(true)

    const formData = new FormData(event.currentTarget)
    const params: SearchParams = {
      fromCity: formData.get("fromCity") as string,
      toCity: formData.get("toCity") as string,
      date: formData.get("date") as string,
    }
    setSearchParams(params)
    saveToStorage(params)

    try {
      const result = await searchRidesAction(params)
      if (result.success) {
        setResults(result.rides || [])
        setHasMore(result.hasMore ?? false)
        router.replace(`/search?${buildSearchQuery(params)}`, { scroll: false })
      } else {
        setError(result.error || "Search failed")
        setResults([])
        setHasMore(false)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      setResults([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setSearched(false)
    setResults([])
    setHasMore(false)
    setSearchParams(null)
    setError(null)
    hasRestoredFromUrl.current = false
    router.replace("/search", { scroll: false })
  }

  return (
    <div className="space-y-8">
      {!searched && (
        <Card className="border shadow-lg shadow-black/5 overflow-hidden">
          <CardContent className="p-0">
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row md:items-stretch"
            >
              <div className="flex flex-col sm:flex-row flex-1 gap-0 sm:gap-0">
                <div className="flex-1 flex flex-col p-4 border-b sm:border-b-0 sm:border-r border-border/50">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    From
                  </label>
                  <Select
                    name="fromCity"
                    required
                    value={defaults.fromCity || null}
                    onValueChange={(v) =>
                      setDefaults((prev) => ({ ...prev, fromCity: v ?? "" }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full border-0 bg-muted/40 shadow-none focus:ring-2 focus:ring-primary/20 px-3">
                      <SelectValue placeholder="City or area" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.filter((city) => city.status).map((city) => (
                        <SelectItem key={city.name} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="hidden sm:flex items-center justify-center px-2 text-muted-foreground/50 shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="flex-1 flex flex-col p-4 border-b sm:border-b-0 sm:border-r border-border/50">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    To
                  </label>
                  <Select
                    name="toCity"
                    required
                    value={defaults.toCity || null}
                    onValueChange={(v) =>
                      setDefaults((prev) => ({ ...prev, toCity: v ?? "" }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full border-0 bg-muted/40 shadow-none focus:ring-2 focus:ring-primary/20 px-3">
                      <SelectValue placeholder="City or area" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.filter((city) => city.status).map((city) => (
                        <SelectItem key={city.name} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex flex-col p-4 border-b sm:border-b-0 sm:border-r border-border/50">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Date
                  </label>
                  <Input
                    name="date"
                    type="date"
                    min={minDate || undefined}
                    value={defaults.date}
                    onChange={(e) =>
                      setDefaults((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="h-11 border-0 bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
              <div className="p-4 flex items-end md:items-center">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-auto md:min-w-[140px] h-11 font-semibold shadow-md hover:shadow-lg transition-shadow"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {searched && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </Button>
            <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                <>
                  {results.length === 0 ? "No" : results.length} ride
                  {results.length !== 1 ? "s" : ""} found
                </>
              )}
            </h2>
          </div>

          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-4">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {results.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                backToSearchQuery={searchParams ? buildSearchQuery(searchParams) : undefined}
              />
            ))}

            {!loading && results.length === 0 && !error && (
              <Card className="border-2 border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">No rides match your search</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Try a different date or route, or be the first to Publish a ride on this path.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="min-h-4 flex items-center justify-center py-4">
              {loadingMore && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
