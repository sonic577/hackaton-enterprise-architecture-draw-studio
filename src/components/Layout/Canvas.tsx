import { ArchitectureElement } from '../../types'
import { getElementIcon, getElementColor, getElementLabel } from '../../utils/elementUtils.tsx'
import ElementCard from '../Elements/ElementCard'

interface CanvasProps {
  elements: ArchitectureElement[]
  selectedElement: ArchitectureElement | null
  onSelectElement: (element: ArchitectureElement) => void
}

export default function Canvas({ elements, selectedElement, onSelectElement }: CanvasProps) {
  // Organize elements by type for visual hierarchy
  const elementsByType: Record<string, ArchitectureElement[]> = {}
  elements.forEach(el => {
    if (!elementsByType[el.type]) {
      elementsByType[el.type] = []
    }
    elementsByType[el.type].push(el)
  })

  const typeOrder = [
    'mission',
    'vision',
    'value_chain',
    'process',
    'bottleneck',
    'gap',
    'risk',
    'recommendation',
    'solution'
  ]

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome message if nothing selected */}
        {!selectedElement && (
          <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Enterprise Architecture Canvas
            </h2>
            <p className="text-gray-600">
              Click on any element below to explore its details, relationships, and impact.
            </p>
          </div>
        )}

        {/* Elements by type */}
        {typeOrder.map(type => {
          const typeElements = elementsByType[type]
          if (!typeElements || typeElements.length === 0) return null

          return (
            <div key={type} className="mb-12">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`${getElementColor(type)} p-2 rounded text-white`}>
                  {getElementIcon(type)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getElementLabel(type)}
                </h3>
                <span className="text-sm text-gray-500 ml-auto">
                  {typeElements.length} {typeElements.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Elements grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeElements.map(element => (
                  <ElementCard
                    key={element.id}
                    element={element}
                    isSelected={selectedElement?.id === element.id}
                    onClick={() => onSelectElement(element)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
