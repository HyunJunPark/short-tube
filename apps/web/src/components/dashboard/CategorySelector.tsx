'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { AVAILABLE_CATEGORIES } from '@short-tube/types'

interface CategorySelectorProps {
  selectedCategories: string[]
  onChange: (categories: string[]) => void
}

export function CategorySelector({ selectedCategories, onChange }: CategorySelectorProps) {
  const [customCategoryInput, setCustomCategoryInput] = useState('')

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter((c) => c !== category))
    } else {
      onChange([...selectedCategories, category])
    }
  }

  const addCustomCategory = () => {
    const trimmedCategory = customCategoryInput.trim()
    if (trimmedCategory && !selectedCategories.includes(trimmedCategory)) {
      onChange([...selectedCategories, trimmedCategory])
      setCustomCategoryInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomCategory()
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Categories</div>

      {/* Selected Categories Display */}
      <div className="flex flex-wrap gap-2">
        {selectedCategories.map((category) => (
          <Badge key={category} variant="default" className="flex items-center gap-1">
            {category}
            <X
              className="h-3 w-3 cursor-pointer hover:opacity-70"
              onClick={() => toggleCategory(category)}
            />
          </Badge>
        ))}
      </div>

      {/* Available Categories */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Suggested categories</div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category)
            return (
              <Badge
                key={category}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Custom Category Input */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Add custom category</div>
        <div className="flex gap-2">
          <Input
            placeholder="Type custom category..."
            value={customCategoryInput}
            onChange={(e) => setCustomCategoryInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addCustomCategory}
            disabled={!customCategoryInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
