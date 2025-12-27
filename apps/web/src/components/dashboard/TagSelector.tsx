'use client'

import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

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
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Tags</div>
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
              {isSelected && <X className="ml-1 h-3 w-3" />}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
