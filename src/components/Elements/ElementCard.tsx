import { ArchitectureElement } from '../../types'
import { getElementIcon, getElementColor } from '../../utils/elementUtils.tsx'
import { ChevronRight } from 'lucide-react'

interface ElementCardProps {
  element: ArchitectureElement
  isSelected: boolean
  onClick: () => void
}

export default function ElementCard({ element, isSelected, onClick }: ElementCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow'
      }`}
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-3 mb-2">
        <div className={`${getElementColor(element.type)} p-2 rounded text-white flex-shrink-0`}>
          {getElementIcon(element.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight">
            {element.title}
          </h4>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
        {element.description}
      </p>

      {/* Footer with indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex gap-1">
          {element.relationships?.childIds && element.relationships.childIds.length > 0 && (
            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">
              {element.relationships.childIds.length} children
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </button>
  )
}
