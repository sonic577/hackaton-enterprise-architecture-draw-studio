import { ArchitectureElement } from '../../types'
import { getElementIcon, getElementColor, getElementLabel } from '../../utils/elementUtils.tsx'
import { X } from 'lucide-react'

interface PropertiesPanelProps {
  element: ArchitectureElement | null
}

export default function PropertiesPanel({ element }: PropertiesPanelProps) {
  if (!element) {
    return (
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col p-6">
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <div className="text-gray-300 text-5xl mb-4">→</div>
            <p className="text-gray-500">Select an element to view details</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`${getElementColor(element.type)} p-2 rounded text-white flex-shrink-0`}>
            {getElementIcon(element.type)}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {getElementLabel(element.type)}
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              {element.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {element.description}
          </p>
        </div>

        {/* Context */}
        {element.context && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Context</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {element.context}
            </p>
          </div>
        )}

        {/* Properties */}
        {Object.keys(element.properties).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Properties</h4>
            <div className="space-y-2">
              {Object.entries(element.properties).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-xs font-medium text-gray-600 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold text-gray-900">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact */}
        {element.impact && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-semibold text-blue-900 mb-1">💥 Impact</h4>
            <p className="text-sm text-blue-800">
              {element.impact}
            </p>
          </div>
        )}

        {/* Evidence */}
        {element.evidence && element.evidence.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Evidence</h4>
            <ul className="space-y-2">
              {element.evidence.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-gray-400 mt-1 flex-shrink-0">✓</span>
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Relationships */}
        {(element.relationships?.parentId || element.relationships?.childIds?.length || element.relationships?.relatedIds?.length) && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Relationships</h4>
            <div className="space-y-2 text-xs">
              {element.relationships?.parentId && (
                <p className="text-gray-600">
                  <span className="font-medium">Parent:</span> {element.relationships.parentId}
                </p>
              )}
              {element.relationships?.childIds && element.relationships.childIds.length > 0 && (
                <p className="text-gray-600">
                  <span className="font-medium">Children:</span> {element.relationships.childIds.length}
                </p>
              )}
              {element.relationships?.relatedIds && element.relationships.relatedIds.length > 0 && (
                <p className="text-gray-600">
                  <span className="font-medium">Related:</span> {element.relationships.relatedIds.length}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
