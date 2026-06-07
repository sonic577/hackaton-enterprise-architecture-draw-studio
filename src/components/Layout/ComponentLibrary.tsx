import { useState } from 'react'
import { ChevronDown, Plus, Search } from 'lucide-react'
import {
  BPMN_COMPONENT_DEFINITIONS,
  BPMN_COMPONENT_GROUPS,
  BPMN_COMPONENT_TYPES,
  TOGAF_COMPONENT_DEFINITIONS,
  TOGAF_COMPONENT_GROUPS,
  TOGAF_COMPONENT_TYPES
} from '../../data/componentDefinitions'
import { getNodeIcon, getNodeColor } from '../../utils/elementUtils.tsx'

const TOGAF_CATEGORY = 'TOGAF / Enterprise Architecture'
const BPMN_CATEGORY = 'BPMN / Process Engineering'

const COMPONENT_CATEGORIES = {
  'ArchiMate': ['mission', 'vision', 'process', 'system', 'data_store'],
  'Technologies': ['system', 'data_store'],
  'Analysis': ['bottleneck', 'gap'],
  'Solutions': ['solution'],
  [TOGAF_CATEGORY]: TOGAF_COMPONENT_TYPES,
  [BPMN_CATEGORY]: BPMN_COMPONENT_TYPES,
  'Drawing': [
    'shape_rectangle',
    'shape_rounded_rectangle',
    'shape_ellipse',
    'shape_diamond',
    'shape_hexagon',
    'shape_cylinder',
    'shape_cloud',
    'shape_document',
    'shape_sticky_note',
    'shape_text_label',
    'shape_container'
  ],
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
  'shape_rectangle': 'Rectangle',
  'shape_rounded_rectangle': 'Rounded Rectangle',
  'shape_ellipse': 'Circle / Ellipse',
  'shape_diamond': 'Diamond',
  'shape_hexagon': 'Hexagon',
  'shape_cylinder': 'Cylinder / Database',
  'shape_cloud': 'Cloud',
  'shape_document': 'Document',
  'shape_sticky_note': 'Sticky Note',
  'shape_text_label': 'Text Label',
  'shape_container': 'Container / Group',
}

interface ComponentLibraryProps {
  onAddNode?: (type: string) => void
  className?: string
}

export default function ComponentLibrary({ onAddNode, className = 'w-80 border-r border-gray-200' }: ComponentLibraryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'ArchiMate': true,
    'Technologies': true,
    'Analysis': true,
    'Solutions': true,
    [TOGAF_CATEGORY]: true,
    [BPMN_CATEGORY]: true,
    'Drawing': true,
  })
  const [search, setSearch] = useState('')

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const getComponentLabel = (type: string) =>
    COMPONENT_LABELS[type] ?? TOGAF_COMPONENT_DEFINITIONS[type]?.label ?? BPMN_COMPONENT_DEFINITIONS[type]?.label ?? type

  const filteredCategories = Object.entries(COMPONENT_CATEGORIES).map(([category, types]) => ({
    category,
    types: types.filter(type =>
      getComponentLabel(type).toLowerCase().includes(search.toLowerCase())
    )
  })).filter(({ types }) => types.length > 0)

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/x-diagram-node-type', type)
    e.dataTransfer.setData('text/plain', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const renderComponentButton = (type: string) => {
    const colors = getNodeColor(type)
    return (
      <button
        key={type}
        onClick={() => onAddNode?.(type)}
        onDragStart={(e) => handleDragStart(e, type)}
        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border ${colors.border} ${colors.bg} hover:opacity-80 transition-opacity cursor-grab active:cursor-grabbing`}
        draggable
      >
        <div className={colors.text}>
          {getNodeIcon(type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {getComponentLabel(type)}
          </p>
          {(TOGAF_COMPONENT_DEFINITIONS[type] || BPMN_COMPONENT_DEFINITIONS[type]) && (
            <p className="text-xs text-gray-500 truncate">
              {TOGAF_COMPONENT_DEFINITIONS[type]?.layer ?? BPMN_COMPONENT_DEFINITIONS[type]?.category}
            </p>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className={`${className} bg-white flex flex-col overflow-hidden`}>
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
              category === TOGAF_CATEGORY || category === BPMN_CATEGORY ? (
                <div className="px-2 pb-2 space-y-3">
                  {(category === TOGAF_CATEGORY ? TOGAF_COMPONENT_GROUPS : BPMN_COMPONENT_GROUPS).map(group => (
                    <div key={group.layer}>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {group.layer}
                      </p>
                      <div className="space-y-1">
                        {group.components.map(component => renderComponentButton(component.type))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-2 pb-2 space-y-1">
                  {types.map(type => renderComponentButton(type))}
                </div>
              )
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
                return renderComponentButton(type)
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
