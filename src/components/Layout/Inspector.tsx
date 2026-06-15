import { ConnectorLineStyle, ConnectorMarker, ConnectorType, DiagramNode, DiagramConnector, Selection } from '../../types'
import { getNodeIcon, getNodeColor, getStatusBadgeColor } from '../../utils/elementUtils.tsx'
import { groupAnalysisResults, ProcessAnalysisResult } from '../../utils/processAnalyzer'
import { ArrowRight, Plus, X } from 'lucide-react'

interface InspectorProps {
  selection: Selection
  nodes: DiagramNode[]
  connectors: DiagramConnector[]
  onClearSelection: () => void
  onOpenDiagram?: (diagramId: string) => void
  onCreateChildDiagram?: (nodeId: string) => void
  onUpdateNode?: (nodeId: string, updates: Partial<DiagramNode>) => void
  onUpdateConnector?: (connectorId: string, updates: Partial<DiagramConnector>) => void
  onReverseConnector?: (connectorId: string) => void
  analysisResults?: ProcessAnalysisResult[]
  analysisMessage?: string | null
  onSelectAnalysisResult?: (result: ProcessAnalysisResult) => void
  allDiagrams?: unknown[]
}

export default function Inspector({ 
  selection, 
  nodes, 
  connectors, 
  onClearSelection,
  onOpenDiagram,
  onCreateChildDiagram,
  onUpdateNode,
  onUpdateConnector,
  onReverseConnector,
  analysisResults = [],
  analysisMessage = null,
  onSelectAnalysisResult
}: InspectorProps) {
  if (selection.type === null) {
    if (analysisMessage) {
      return (
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Reasoning Panel</h3>
            <p className="mt-1 text-xs text-gray-500">
              Local process analysis for the current diagram.
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">No process elements found</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-800">{analysisMessage}</p>
            </div>
          </div>
        </div>
      )
    }

    if (analysisResults.length > 0) {
      const groupedResults = groupAnalysisResults(analysisResults)
      const severityClasses: Record<string, string> = {
        low: 'bg-gray-100 text-gray-700',
        medium: 'bg-amber-100 text-amber-800',
        high: 'bg-red-100 text-red-800'
      }

      return (
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Reasoning Panel</h3>
            <p className="mt-1 text-xs text-gray-500">
              Local process analysis for the current diagram.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {groupedResults.map(({ group, results }) => (
              <div key={group}>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600">{group}</h4>
                  <span className="text-xs text-gray-400">{results.length}</span>
                </div>
                {results.length === 0 ? (
                  <p className="rounded border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    No findings.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {results.map(result => (
                      <button
                        key={result.id}
                        onClick={() => onSelectAnalysisResult?.(result)}
                        className="w-full rounded border border-gray-200 bg-white p-3 text-left transition-colors hover:border-amber-300 hover:bg-amber-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">{result.title}</p>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityClasses[result.severity]}`}>
                            {result.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-gray-600">{result.description}</p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-500">{result.reasoning}</p>
                        <div className="mt-2 rounded bg-gray-50 px-2 py-1 text-xs text-gray-700">
                          {result.suggestedAction}
                        </div>
                        {result.relatedNodeIds.length > 0 && (
                          <p className="mt-2 text-xs text-gray-400">
                            Related nodes: {result.relatedNodeIds.length}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Inspector</h3>
        </div>
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <p className="text-gray-400 text-4xl mb-3">◆</p>
            <p className="text-gray-500 text-sm">Select a node or connector</p>
            <p className="text-gray-400 text-xs mt-2">to view and edit properties</p>
          </div>
        </div>
      </div>
    )
  }

  if (selection.type === 'node' && selection.id) {
    const node = nodes.find(n => n.id === selection.id)
    if (!node) return null

    const colors = getNodeColor(node.type)
    const relatedConnectors = connectors.filter(c => c.sourceId === node.id || c.targetId === node.id)
    const nodeTypeLabel = node.name ?? node.type
      .replace(/^shape_/, '')
      .replace(/^togaf_[a-z]+_/, '')
      .replace(/^bpmn_/, '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    const fieldClass = 'w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

    return (
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`${colors.text} flex-shrink-0 mt-0.5`}>
              {getNodeIcon(node.type)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {node.layer ?? node.type.replace(/_/g, ' ')}
              </p>
              <input
                value={node.title}
                onChange={(e) => onUpdateNode?.(node.id, { title: e.target.value, name: e.target.value })}
                className="mt-1 w-full rounded border border-transparent bg-transparent px-1 text-base font-bold text-gray-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-500"
                aria-label="Node name"
              />
            </div>
          </div>
          <button onClick={onClearSelection} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Layer */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Layer</p>
            <input
              value={node.layer ?? ''}
              onChange={(e) => onUpdateNode?.(node.id, { layer: e.target.value })}
              className={fieldClass}
              placeholder="Layer"
            />
          </div>

          {/* BPMN Metadata */}
          {(node.category || node.bpmnType) && (
            <div className="grid grid-cols-1 gap-3">
              {node.category && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">BPMN Category</p>
                  <p className="text-sm font-medium text-gray-900 bg-sky-50 border border-sky-200 rounded px-3 py-2">
                    {node.category}
                  </p>
                </div>
              )}
              {node.bpmnType && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">BPMN Type</p>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                    {node.bpmnType}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Type */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              {node.type.startsWith('shape_') ? 'Shape Type' : 'Node Type'}
            </p>
            <input
              value={node.type}
              onChange={(e) => onUpdateNode?.(node.id, { type: e.target.value })}
              className={fieldClass}
              placeholder={nodeTypeLabel}
            />
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Status</p>
            <select
              value={node.status ?? 'inferred'}
              onChange={(e) => onUpdateNode?.(node.id, { status: e.target.value as DiagramNode['status'] })}
              className={fieldClass}
            >
              <option value="extracted">Extracted</option>
              <option value="inferred">Inferred</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
            <span className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded ${getStatusBadgeColor(node.status)}`}>
              {node.status ?? 'inferred'}
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Description</p>
            <textarea
              value={node.description ?? ''}
              onChange={(e) => onUpdateNode?.(node.id, { description: e.target.value })}
              className={`${fieldClass} min-h-24 resize-y`}
              placeholder="Node description"
            />
          </div>

          {/* Context */}
          {node.context && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Context</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {node.context}
              </p>
            </div>
          )}

          {/* Source */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Source</p>
            <input
              value={node.source ?? ''}
              onChange={(e) => onUpdateNode?.(node.id, { source: e.target.value })}
              className={fieldClass}
              placeholder="Source"
            />
          </div>

          {/* Properties */}
          {node.properties && Object.keys(node.properties).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Properties</p>
              <div className="space-y-2">
                {Object.entries(node.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start gap-4 text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-900 text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Open Diagram Button */}
          {node.linkedDiagramId && (
            <button
              onClick={() => onOpenDiagram?.(node.linkedDiagramId!)}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight size={16} />
              Open diagram
            </button>
          )}

          {!node.linkedDiagramId && (
            <button
              onClick={() => onCreateChildDiagram?.(node.id)}
              className="w-full px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Create child diagram
            </button>
          )}

          {/* Impact */}
          {node.impact && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs font-semibold text-orange-900 mb-1">💥 Impact</p>
              <p className="text-sm text-orange-800">
                {node.impact}
              </p>
            </div>
          )}

          {/* Evidence editor */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Evidence</p>
            <textarea
              value={(node.evidence ?? []).join('\n')}
              onChange={(e) => onUpdateNode?.(node.id, { evidence: e.target.value.split('\n').map(item => item.trim()).filter(Boolean) })}
              className={`${fieldClass} min-h-20 resize-y`}
              placeholder="One evidence item per line"
            />
          </div>

          {/* Evidence */}
          {false && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Evidence</p>
              <ul className="space-y-2">
                {([] as string[]).map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-gray-400 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Relationships */}
          {relatedConnectors.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">Relationships</p>
              <div className="space-y-2">
                {relatedConnectors.map(conn => {
                  const isSource = conn.sourceId === node.id
                  const relatedNode = nodes.find(n => n.id === (isSource ? conn.targetId : conn.sourceId))
                  if (!relatedNode) return null

                  return (
                    <div key={conn.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                      <span className="text-xs font-medium text-gray-600 flex-shrink-0 mt-0.5">
                        {isSource ? '→' : '←'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700">{conn.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-600 truncate">{relatedNode.title}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (selection.type === 'multi') {
    const selectedNodeCount = selection.nodeIds?.length ?? 0
    const selectedConnectorCount = selection.connectorIds?.length ?? 0

    return (
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selection</p>
            <h3 className="text-base font-bold text-gray-900 mt-1">Multiple elements</h3>
          </div>
          <button onClick={onClearSelection} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-sm font-semibold text-blue-900">{selectedNodeCount} nodes selected</p>
            <p className="mt-1 text-sm text-blue-800">{selectedConnectorCount} connectors selected</p>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            Use Ctrl+C to copy, Ctrl+X to cut, Ctrl+V to paste, or Delete to remove the selected elements.
          </p>
        </div>
      </div>
    )
  }

  if (selection.type === 'connector' && selection.id) {
    const connector = connectors.find(c => c.id === selection.id)
    if (!connector) return null

    const sourceNode = nodes.find(n => n.id === connector.sourceId)
    const targetNode = nodes.find(n => n.id === connector.targetId)
    if (!sourceNode || !targetNode) return null
    const relationshipTypes: Array<{ value: ConnectorType; label: string }> = [
      { value: 'related_to', label: 'Related to' },
      { value: 'uses', label: 'Uses' },
      { value: 'depends_on', label: 'Depends on' },
      { value: 'supports', label: 'Supports' },
      { value: 'contains', label: 'Contains' },
      { value: 'impacts', label: 'Impacts' },
      { value: 'consumes', label: 'Consumes' },
      { value: 'produces', label: 'Produces' },
      { value: 'flow', label: 'Flow' },
      { value: 'association', label: 'Association' }
    ]
    const lineStyles: Array<{ value: ConnectorLineStyle; label: string }> = [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' }
    ]
    const markers: Array<{ value: ConnectorMarker; label: string }> = [
      { value: 'none', label: 'None' },
      { value: 'arrow', label: 'Arrow' },
      { value: 'open_arrow', label: 'Open Arrow' },
      { value: 'diamond', label: 'Diamond' },
      { value: 'circle', label: 'Circle' }
    ]
    const defaultLineStyle: ConnectorLineStyle = connector.type === 'flow' ? 'solid' : connector.type === 'related_to' ? 'dashed' : 'solid'
    const defaultEndMarker: ConnectorMarker = connector.type === 'association' ? 'none' : connector.type === 'contains' ? 'diamond' : 'arrow'
    const fieldClass = 'w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
    const relationshipLabel = relationshipTypes.find(type => type.value === connector.type)?.label ?? connector.type.replace(/_/g, ' ')

    return (
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Relationship</p>
            <h3 className="text-base font-bold text-gray-900 mt-1">
              {connector.label || relationshipLabel}
            </h3>
          </div>
          <button onClick={onClearSelection} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Source Node */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">From</p>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">{sourceNode.type}</p>
              <p className="text-sm font-medium text-gray-900">{sourceNode.title}</p>
            </div>
          </div>

          {/* Target Node */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">To</p>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">{targetNode.type}</p>
              <p className="text-sm font-medium text-gray-900">{targetNode.title}</p>
            </div>
          </div>

          {/* Label */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Label</p>
            <input
              value={connector.label ?? ''}
              onChange={(e) => onUpdateConnector?.(connector.id, { label: e.target.value })}
              className={fieldClass}
              placeholder="Visible relationship label"
            />
          </div>

          {/* Type */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Relationship Type</p>
            <select
              value={connector.type}
              onChange={(e) => {
                const nextType = e.target.value as ConnectorType
                onUpdateConnector?.(connector.id, {
                  type: nextType,
                  label: relationshipTypes.find(type => type.value === nextType)?.label ?? connector.label,
                  lineStyle: nextType === 'flow' ? 'solid' : nextType === 'related_to' ? 'dashed' : connector.lineStyle,
                  endMarker: nextType === 'contains' ? 'diamond' : nextType === 'association' ? 'none' : nextType === 'flow' ? 'arrow' : connector.endMarker
                })
              }}
              className={fieldClass}
            >
              {relationshipTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Line Style</p>
              <select
                value={connector.lineStyle ?? defaultLineStyle}
                onChange={(e) => onUpdateConnector?.(connector.id, { lineStyle: e.target.value as ConnectorLineStyle })}
                className={fieldClass}
              >
                {lineStyles.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Start Marker</p>
                <select
                  value={connector.startMarker ?? 'none'}
                  onChange={(e) => onUpdateConnector?.(connector.id, { startMarker: e.target.value as ConnectorMarker })}
                  className={fieldClass}
                >
                  {markers.map(marker => (
                    <option key={marker.value} value={marker.value}>{marker.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">End Marker</p>
                <select
                  value={connector.endMarker ?? defaultEndMarker}
                  onChange={(e) => onUpdateConnector?.(connector.id, { endMarker: e.target.value as ConnectorMarker })}
                  className={fieldClass}
                >
                  {markers.map(marker => (
                    <option key={marker.value} value={marker.value}>{marker.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Description</p>
            <textarea
              value={connector.description ?? ''}
              onChange={(e) => onUpdateConnector?.(connector.id, { description: e.target.value })}
              className={`${fieldClass} min-h-20 resize-y`}
              placeholder="Relationship notes"
            />
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Status</p>
            <select
              value={connector.status ?? 'inferred'}
              onChange={(e) => onUpdateConnector?.(connector.id, { status: e.target.value as DiagramConnector['status'] })}
              className={fieldClass}
            >
              <option value="extracted">Extracted</option>
              <option value="inferred">Inferred</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
            <span className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded ${getStatusBadgeColor(connector.status)}`}>
              {connector.status ?? 'inferred'}
            </span>
          </div>

          <button
            onClick={() => onReverseConnector?.(connector.id)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Reverse direction
          </button>

          {connector.source && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Source</p>
              <p className="text-sm text-gray-700 leading-relaxed">{connector.source}</p>
            </div>
          )}

          {/* Impact */}
          {connector.impact && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs font-semibold text-orange-900 mb-1">💥 Impact</p>
              <p className="text-sm text-orange-800">
                {connector.impact}
              </p>
            </div>
          )}

          {/* Evidence */}
          {connector.evidence && connector.evidence.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Evidence</p>
              <ul className="space-y-2">
                {connector.evidence.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-gray-400 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
