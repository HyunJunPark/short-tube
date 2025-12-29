'use client'

import { useState } from 'react'
import { Search, Filter, ExternalLink, Loader2, Calendar } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSummaries } from '@/hooks/useSummaries'

const AVAILABLE_TAGS = [
  'AI',
  'ChatGPT',
  '신기술',
  '부동산',
  '주식',
  '코딩',
  '뉴스',
  '비즈니스',
  '동기부여',
]

export default function ArchivePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<string>('')

  const { data: allSummaries = [], isLoading } = useSummaries({
    year: selectedYear ? Number(selectedYear) : undefined,
    month: selectedMonth ? Number(selectedMonth) : undefined,
    day: selectedDay ? Number(selectedDay) : undefined,
  })

  // Filter summaries
  const filteredSummaries = allSummaries.filter((summary) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      summary.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.channel_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.content?.toLowerCase().includes(searchQuery.toLowerCase())

    // Tag filter
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some(tag => summary.tags?.includes(tag))

    return matchesSearch && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <MainLayout title="Archive">
      <div className="space-y-6">
        {/* Search & Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>
              Find specific summaries by keyword or tag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, channel, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Filters */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Filter by Upload Date
              </div>
              <div className="flex gap-2">
                {/* Year Selector */}
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Years</SelectItem>
                    {[2025, 2024, 2023].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Month Selector */}
                <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={!selectedYear}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Months</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2000, month - 1).toLocaleDateString('ko-KR', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Day Selector */}
                <Select value={selectedDay} onValueChange={setSelectedDay} disabled={!selectedMonth}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Days</SelectItem>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}일
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(selectedYear || selectedMonth || selectedDay) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedYear('')
                    setSelectedMonth('')
                    setSelectedDay('')
                  }}
                >
                  Clear date filter
                </Button>
              )}
            </div>

            <Separator />

            {/* Tag Filters */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Filter by Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  )
                })}
              </div>
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              Summaries ({filteredSummaries.length})
            </CardTitle>
            <CardDescription>
              {filteredSummaries.length === allSummaries.length
                ? 'All summaries'
                : `Filtered from ${allSummaries.length} total summaries`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>
                  {allSummaries.length === 0
                    ? 'No summaries archived yet'
                    : 'No summaries match your filters'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSummaries.map((summary, index) => (
                  <div key={`${summary.video_id}-${index}`}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg line-clamp-2">
                            {summary.title || 'Untitled'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{summary.channel_name}</span>
                            {summary.date && (
                              <>
                                <span>•</span>
                                <span>
                                  {new Date(summary.date).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {summary.video_id && !summary.video_id.startsWith('BRIEFING_') && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={`https://youtube.com/watch?v=${summary.video_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-3 w-3" />
                              Watch
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* Tags */}
                      {summary.tags && summary.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {summary.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <div className="text-sm text-muted-foreground line-clamp-3">
                        {summary.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
