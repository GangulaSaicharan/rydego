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
  ArrowRightLeft,
} from "lucide-react"
import { getCitiesAction, searchRidesAction } from "@/lib/actions/ride"
import { RideCard } from "./RideCard"
import { RideDetailsModal } from "./RideDetailsModal"
import { CityCombobox } from "@/components/ui/city-combobox"
import { todayDateStringIST, formatDateShortIST, offsetDateStringIST } from "@/lib/date-time"
const STORAGE_KEY = "ride-search-prefs"
const RECENT_SEARCHES_KEY = "recent-ride-searches-v1"

type RecentSearch = {
  fromLocationId: string
  toLocationId: string
  date: string
  fromCity: string
  toCity: string
}

type SearchParams = {
  fromLocationId: string
  toLocationId: string
  date: string
}

type RideSearchResult = {
  id: string
  departureTime: string | Date
  arrivalTime?: string | Date | null
  pricePerSeat: string | number
  seatsAvailable: number
  seatsTotal: number
  fromLocation: { city: string; state?: string | null }
  toLocation: { city: string; state?: string | null }
  driver: { id: string; name: string | null; image: string | null }
}

function buildSearchQuery(params: SearchParams): string {
  const sp = new URLSearchParams()
  sp.set("fromLocationId", params.fromLocationId)
  sp.set("toLocationId", params.toLocationId)
  sp.set("date", params.date)
  return sp.toString()
}

function getTodayDate(): string {
  return todayDateStringIST()
}

// Only call on client after mount to avoid server/client hydration mismatch
function getStoredDefaultsFromStorage(): Pick<SearchParams, "fromLocationId" | "toLocationId"> {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (!s) return { fromLocationId: "", toLocationId: "" }
    const j = JSON.parse(s) as Partial<SearchParams>
    return { fromLocationId: j.fromLocationId ?? "", toLocationId: j.toLocationId ?? "" }
  } catch {
    return { fromLocationId: "", toLocationId: "" }
  }
}

function saveToStorage(params: SearchParams) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
  } catch {
    // ignore
  }
}

function saveRecentSearch(search: RecentSearch) {
  try {
    const s = localStorage.getItem(RECENT_SEARCHES_KEY)
    let recent: RecentSearch[] = s ? JSON.parse(s) : []

    // Filter out duplicates (same route and date)
    recent = recent.filter(r =>
      !(r.fromLocationId === search.fromLocationId &&
        r.toLocationId === search.toLocationId &&
        r.date === search.date)
    )

    // Add to front and keep only 2
    recent.unshift(search)
    recent = recent.slice(0, 2)

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent))
  } catch {
    // ignore
  }
}

function getRecentSearches(): RecentSearch[] {
  try {
    const s = localStorage.getItem(RECENT_SEARCHES_KEY)
    return s ? JSON.parse(s) : []
  } catch {
    return []
  }
}

// Stable initial state so server and client render the same (avoids hydration error)
const INITIAL_DEFAULTS: SearchParams = {
  fromLocationId: "",
  toLocationId: "",
  date: "",
}

export function RideSearchForm({ userId }: { userId?: string }) {
  const router = useRouter()
  const searchParamsFromUrl = useSearchParams()
  const [defaults, setDefaults] = useState<SearchParams>(INITIAL_DEFAULTS)
  const [minDate, setMinDate] = useState("")
  const [cities, setCities] = useState<{ id: string; city: string }[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [results, setResults] = useState<RideSearchResult[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasRestoredFromUrl = useRef(false)
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

  const getShortcutDate = (offset: number) => {
    return offsetDateStringIST(offset)
  }

  const dateShortcuts = [
    { label: "Today", value: getShortcutDate(0) },
    { label: "Tomorrow", value: getShortcutDate(1) },
    { label: "Day After", value: getShortcutDate(2) },
  ]

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
    setRecentSearches(getRecentSearches())
  }, [])

  useEffect(() => {
    async function fetchCities() {
      try {
        const result = await getCitiesAction()
        if (result.success && result.cities) {
          setCities(result.cities)
        }
      } finally {
        setCitiesLoading(false)
      }
    }
    fetchCities()
  }, [])

  // Restore search from URL when user returns from ride details
  useEffect(() => {
    if (hasRestoredFromUrl.current) return
    const fromLocationId = searchParamsFromUrl.get("fromLocationId")
    const toLocationId = searchParamsFromUrl.get("toLocationId")
    const date = searchParamsFromUrl.get("date")
    if (!fromLocationId || !toLocationId || !date) return
    hasRestoredFromUrl.current = true
    const params: SearchParams = { fromLocationId, toLocationId, date }
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
      fromLocationId: formData.get("fromLocationId") as string,
      toLocationId: formData.get("toLocationId") as string,
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

        // Save to recent searches
        const fromCity = cities.find(c => c.id === params.fromLocationId)?.city || "Unknown"
        const toCity = cities.find(c => c.id === params.toLocationId)?.city || "Unknown"
        const searchEntry = { ...params, fromCity, toCity }
        saveRecentSearch(searchEntry)
        setRecentSearches(getRecentSearches())
      } else {
        setError(result.error || "Search failed")
        setResults([])
        setHasMore(false)
      }
    } catch {
      setError("An unexpected error occurred")
      setResults([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  function handleRecentSearchClick(search: RecentSearch) {
    setDefaults({
      fromLocationId: search.fromLocationId,
      toLocationId: search.toLocationId,
      date: search.date
    })
    // Trigger search immediately
    setLoading(true)
    setError(null)
    setSearched(true)
    setSearchParams(search)

    searchRidesAction(search)
      .then((result) => {
        if (result.success) {
          setResults(result.rides || [])
          setHasMore(result.hasMore ?? false)
          router.replace(`/search?${buildSearchQuery(search)}`, { scroll: false })
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

  const handleSwap = () => {
    setDefaults((prev) => ({
      ...prev,
      fromLocationId: prev.toLocationId,
      toLocationId: prev.fromLocationId,
    }))
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
                <div className="flex-1 flex flex-col p-4 pb-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    From
                  </label>
                  <CityCombobox
                    name="fromLocationId"
                    value={defaults.fromLocationId}
                    onValueChange={(v) => setDefaults((prev) => ({ ...prev, fromLocationId: v }))}
                    cities={cities}
                    loading={citiesLoading}
                    placeholder="City or area"
                    required
                    controlClassName="h-11 border-0 bg-muted/40 shadow-none"
                  />
                </div>
                <div className="flex items-center justify-center -mx-3 z-10 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleSwap}
                    className="h-8 w-8 rounded-full bg-background border shadow-sm hover:bg-accent text-muted-foreground/70 hover:text-primary transition-all duration-300 hover:rotate-180"
                    title="Swap cities"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex-1 flex flex-col p-4 pt-0 border-b sm:border-b-0 sm:border-r border-border/50">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    To
                  </label>
                  <CityCombobox
                    name="toLocationId"
                    value={defaults.toLocationId}
                    onValueChange={(v) => setDefaults((prev) => ({ ...prev, toLocationId: v }))}
                    cities={cities}
                    loading={citiesLoading}
                    placeholder="City or area"
                    required
                    controlClassName="h-11 border-0 bg-muted/40 shadow-none"
                  />
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
                  <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-1">
                    {dateShortcuts.map((sc) => (
                      <button
                        key={sc.label}
                        type="button"
                        onClick={() => setDefaults(prev => ({ ...prev, date: sc.value }))}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors whitespace-nowrap ${defaults.date === sc.value
                          ? "bg-primary border-primary text-primary-foreground font-semibold shadow-sm"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                          }`}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
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
        </Card >
      )
      }

      {
        !searched && recentSearches.length > 0 && (
          <div className="space-y-3 px-1 mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">
              Recent Searches
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              {recentSearches.map((search, idx) => (
                <button
                  key={`${search.fromLocationId}-${search.toLocationId}-${search.date}-${idx}`}
                  onClick={() => handleRecentSearchClick(search)}
                  className="group flex flex-col items-start p-3 bg-background border border-border/60 rounded-xl hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-md transition-all duration-300 text-left min-w-[200px] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Search className="h-3 w-3 text-primary/40" />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <span>{search.fromCity}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary/60 transition-colors" />
                    <span>{search.toCity}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{formatDateShortIST(new Date(search.date))}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      }

      {
        searched && (
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
              {loading && (
                <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </span>
                </h2>
              )}
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
                  onViewDetails={(id) => setSelectedRideId(id)}
                />
              ))}

              {loading && (
                <div className="flex items-center justify-center py-4 h-96">
                </div>
              )}

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
        )
      }

      <RideDetailsModal
        rideId={selectedRideId}
        userId={userId}
        onClose={() => setSelectedRideId(null)}
      />
    </div >
  )
}
