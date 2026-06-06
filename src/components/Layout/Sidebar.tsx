import { ArchitectureElement } from '../../types'
import { getElementIcon, getElementColor, getElementLabel } from '../../utils/elementUtils.tsx'

interface SidebarProps {
  selectedElement: ArchitectureElement | null
  onSelectElement: (element: ArchitectureElement | null) => void
}

export default function Sidebar({ onSelectElement }: SidebarProps) {
  const elementTypes = [
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
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Architecture Elements</h2>
        <p className="text-sm text-gray-500 mt-1">Filter by type</p>
      </div>

      {/* Element Types */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {elementTypes.map(type => (
          <button
            key={type}
            onClick={() => onSelectElement(null)}
            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
          >
            <div className={`${getElementColor(type)} p-2 rounded text-white`}>
              {getElementIcon(type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900">
                {getElementLabel(type)}
              </p>
              <p className="text-xs text-gray-500">View elements</p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600">
          💡 Click elements on the canvas to view properties
        </p>
      </div>
    </div>
  )
}
