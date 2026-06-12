import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
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

  const renderMaterialSymbolPreview = (type: string, className = 'text-[24px]') => (
    <foreignObject x="8" y="6" width="32" height="32" className="pointer-events-none">
      <div className={`flex h-8 w-8 items-center justify-center ${getNodeColor(type).text}`}>
        {getNodeIcon(type, className)}
      </div>
    </foreignObject>
  )

  const renderComponentPreview = (type: string) => {
    const colors = getNodeColor(type)
    const bpmnDefinition = BPMN_COMPONENT_DEFINITIONS[type]
    const strokeClass = type.startsWith('bpmn_') ? 'stroke-sky-700' : 'stroke-gray-700'
    const fillClass = type === 'shape_sticky_note' ? 'fill-amber-100' : 'fill-white'

    if (type === 'shape_rectangle') {
      return <rect x="7" y="8" width="34" height="24" className={`${fillClass} stroke-gray-700`} strokeWidth="2" />
    }

    if (type === 'shape_rounded_rectangle') {
      return <rect x="7" y="8" width="34" height="24" rx="6" className={`${fillClass} stroke-gray-700`} strokeWidth="2" />
    }

    if (type === 'shape_ellipse') {
      return <ellipse cx="24" cy="20" rx="17" ry="12" className={`${fillClass} stroke-gray-700`} strokeWidth="2" />
    }

    if (type === 'shape_diamond' || bpmnDefinition?.category === 'Gateways') {
      const marker = type === 'bpmn_exclusive_gateway_x' ? 'X' : type === 'bpmn_parallel_gateway' ? '+' : type === 'bpmn_inclusive_gateway_o' ? 'O' : ''
      return (
        <>
          <polygon points="24,5 42,20 24,35 6,20" className={`${fillClass} ${strokeClass}`} strokeWidth="2" />
          {marker && <text x="24" y="25" textAnchor="middle" className="fill-sky-800 text-base font-semibold">{marker}</text>}
        </>
      )
    }

    if (type === 'shape_hexagon') {
      return <polygon points="14,7 34,7 43,20 34,33 14,33 5,20" className={`${fillClass} stroke-gray-700`} strokeWidth="2" />
    }

    if (type === 'shape_cylinder' || type === 'bpmn_data_store') {
      return (
        <>
          <path d="M 8 12 C 8 5, 40 5, 40 12 L 40 29 C 40 36, 8 36, 8 29 Z" className={`${fillClass} ${strokeClass}`} strokeWidth="2" />
          <ellipse cx="24" cy="12" rx="16" ry="6" fill="none" className={strokeClass} strokeWidth="2" />
        </>
      )
    }

    if (type === 'shape_cloud') {
      return <path d="M15 29 C7 29,5 21,12 18 C12 10,22 8,26 14 C31 8,43 14,39 23 C45 25,40 32,32 30 Z" className={`${fillClass} stroke-gray-700`} strokeWidth="2" />
    }

    if (type === 'shape_document' || type === 'bpmn_data_object' || type === 'bpmn_data_input' || type === 'bpmn_data_output') {
      return (
        <>
          <path d="M11 6 H31 L39 14 V34 H11 Z" className={`${fillClass} ${strokeClass}`} strokeWidth="2" />
          <path d="M31 6 V14 H39" fill="none" className={strokeClass} strokeWidth="2" />
        </>
      )
    }

    if (type === 'shape_sticky_note') {
      return (
        <>
          <rect x="8" y="7" width="32" height="26" rx="3" className="fill-amber-100 stroke-amber-700" strokeWidth="2" />
          <path d="M32 7 H40 V15 Z" className="fill-amber-200 stroke-amber-700" strokeWidth="2" />
        </>
      )
    }

    if (type === 'shape_text_label' || type === 'bpmn_text_annotation') {
      return (
        <>
          <path d="M16 8 H8 V32 H16" fill="none" className={strokeClass} strokeWidth="2" />
          <text x="23" y="25" textAnchor="middle" className="fill-gray-700 text-lg font-semibold">T</text>
        </>
      )
    }

    if (type === 'shape_container' || type === 'bpmn_pool' || type === 'bpmn_lane' || type === 'bpmn_group') {
      return <rect x="6" y="8" width="36" height="24" rx="3" className={`${fillClass} ${strokeClass}`} strokeWidth="2" strokeDasharray="4,3" />
    }

    if (bpmnDefinition?.category === 'Events') {
      return (
        <>
          <circle cx="24" cy="20" r="14" className="fill-white stroke-sky-700" strokeWidth={type === 'bpmn_end_event' ? 4 : 2} />
          {type === 'bpmn_intermediate_event' && <circle cx="24" cy="20" r="10" fill="none" className="stroke-sky-700" strokeWidth="2" />}
          {renderMaterialSymbolPreview(type, 'text-[17px]')}
        </>
      )
    }

    if (bpmnDefinition?.category === 'Activities') {
      return (
        <>
          <rect x="7" y="9" width="34" height="22" rx="6" className="fill-white stroke-sky-700" strokeWidth="2" />
          {renderMaterialSymbolPreview(type, 'text-[17px]')}
          {(type === 'bpmn_subprocess' || type === 'bpmn_collapsed_subprocess') && <text x="24" y="29" textAnchor="middle" className="fill-sky-800 text-sm font-semibold">+</text>}
        </>
      )
    }

    return (
      <foreignObject x="8" y="6" width="32" height="32">
        <div className={`flex h-8 w-8 items-center justify-center ${colors.text}`}>
          {getNodeIcon(type, 'text-[24px]')}
        </div>
      </foreignObject>
    )
  }

  const renderComponentTile = (type: string) => {
    const colors = getNodeColor(type)
    const label = getComponentLabel(type)
    return (
      <button
        key={type}
        onClick={() => onAddNode?.(type)}
        onDragStart={(e) => handleDragStart(e, type)}
        className={`group flex min-h-[78px] w-full cursor-grab flex-col items-center justify-start rounded-md border ${colors.border} ${colors.bg} px-1.5 py-2 text-center transition-colors hover:border-blue-300 hover:bg-blue-50 active:cursor-grabbing`}
        title={label}
        draggable
      >
        <svg viewBox="0 0 48 40" className="h-10 w-12 flex-shrink-0 overflow-visible">
          {renderComponentPreview(type)}
        </svg>
        <span className="mt-1 line-clamp-2 max-w-full break-words text-[11px] font-medium leading-tight text-gray-700">
          {label}
        </span>
      </button>
    )
  }

  const renderTileGrid = (types: string[]) => (
    <div className="grid grid-cols-3 gap-2">
      {types.map(type => renderComponentTile(type))}
    </div>
  )

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
                <div className="px-3 pb-3 space-y-3">
                  {(category === TOGAF_CATEGORY ? TOGAF_COMPONENT_GROUPS : BPMN_COMPONENT_GROUPS).map(group => (
                    <div key={group.layer}>
                      <p className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {group.layer}
                      </p>
                      {renderTileGrid(group.components.map(component => component.type))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 pb-3">
                  {renderTileGrid(types)}
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
            <div className="px-3 pb-3">
              {renderTileGrid(types)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <p>Drag tiles to the canvas, or click to add.</p>
      </div>
    </div>
  )
}
