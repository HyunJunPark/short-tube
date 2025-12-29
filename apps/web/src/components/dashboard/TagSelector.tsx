'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'

const AVAILABLE_TAGS = [
  'AI',
  'Tech',
  'Business',
  'Education',
  'Entertainment',
  'News',
  'Gaming',
  'Music',
  'Sports',
  'Science',
]

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [customTagInput, setCustomTagInput] = useState('')

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  const addCustomTag = () => {
    const trimmedTag = customTagInput.trim()
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onChange([...selectedTags, trimmedTag])
      setCustomTagInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Tags</div>
      
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge key={tag} variant="default" className="flex items-center gap-1">
            {tag}
            <X
              className="h-3 w-3 cursor-pointer hover:opacity-70"
              onClick={() => toggleTag(tag)}
            />
          </Badge>
        ))}
      </div>

      {/* Available Tags */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Suggested tags</div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag)
            return (
              <Badge
                key={tag}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Custom Tag Input */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Add custom tag</div>
        <div className="flex gap-2">
          <Input
            placeholder="Type custom tag..."
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addCustomTag}
            disabled={!customTagInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
