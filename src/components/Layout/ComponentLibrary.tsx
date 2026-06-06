import { useState } from 'react'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { getNodeIcon, getNodeColor } from '../../utils/elementUtils.tsx'

const COMPONENT_CATEGORIES = {
  'ArchiMate': ['mission', 'vision', 'process', 'system', 'data_store'],
  'Technologies': ['system', 'data_store'],
  'Analysis': ['bottleneck', 'gap'],
  'Solutions': ['solution'],
}

const COMPONENT_LABELS: Record<string, string> = {
  'mission': 'Mission',
  'vision': 'Vision',
  'process': 'Process',
  'system': 'System',
  'data_store': 'Data Store',
  'bottleneck': 'Bottleneck',
  'gap': 'Gap',
  'solution': 'Solution',
}

interface ComponentLibraryProps {
  onAddNode?: (type: string) => void
}

export default function ComponentLibrary({ onAddNode }: ComponentLibraryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'ArchiMate': true,
    'Technologies': true,
    'Analysis': true,
    'Solutions': true,
  })
  const [search, setSearch] = useState('')

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const filteredCategories = Object.entries(COMPONENT_CATEGORIES).map(([category, types]) => ({
    category,
    types: types.filter(type =>
      COMPONENT_LABELS[type].toLowerCase().includes(search.toLowerCase())
    )
  })).filter(({ types }) => types.length > 0)

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Component Library</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* My Elements */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">My Elements</h3>
          <button className="p-1 hover:bg-gray-200 rounded transition-colors" title="Add new element">
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="text-xs text-gray-500">
          No elements yet. Create one from the library or add a new one.
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {search === '' && Object.entries(COMPONENT_CATEGORIES).map(([category, types]) => (
          <div key={category} className="border-b border-gray-100">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  !expandedCategories[category] ? '-rotate-90' : ''
                }`}
              />
              <span className="text-sm font-medium text-gray-900">{category}</span>
              <span className="text-xs text-gray-500 ml-auto">{types.length}</span>
            </button>

            {/* Components */}
            {expandedCategories[category] && (
              <div className="px-2 pb-2 space-y-1">
                {types.map(type => {
                  const colors = getNodeColor(type)
                  return (
                    <button
                      key={type}
                      onClick={() => onAddNode?.(type)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border ${colors.border} ${colors.bg} hover:opacity-80 transition-opacity cursor-pointer`}
                      draggable
                    >
                      <div className={colors.text}>
                        {getNodeIcon(type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {COMPONENT_LABELS[type]}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {/* Search results */}
        {search !== '' && filteredCategories.map(({ category, types }) => (
          <div key={category} className="border-b border-gray-100">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {category}
            </div>
            <div className="px-2 pb-2 space-y-1">
              {types.map(type => {
                const colors = getNodeColor(type)
                return (
                  <button
                    key={type}
                    onClick={() => onAddNode?.(type)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border ${colors.border} ${colors.bg} hover:opacity-80 transition-opacity cursor-pointer`}
                  >
                    <div className={colors.text}>
                      {getNodeIcon(type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {COMPONENT_LABELS[type]}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <p>💡 Click a component to add it to the canvas</p>
      </div>
    </div>
  )
}
