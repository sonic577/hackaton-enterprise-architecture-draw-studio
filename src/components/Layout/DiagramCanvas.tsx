import { useState, useRef, useEffect } from 'react'
import { DiagramNode, DiagramConnector, Selection } from '../../types'
import { getNodeColor, getNodeIcon, getConnectorStyle, getStatusBadgeColor } from '../../utils/elementUtils.tsx'
import { ZoomIn, ZoomOut, Download } from 'lucide-react'

const GRID_SIZE = 20
const NODE_WIDTH = 180
const NODE_HEIGHT = 120

interface CanvasProps {
  nodes: DiagramNode[]
  connectors: DiagramConnector[]
  selection: Selection
  onSelectNode: (nodeId: string) => void
  onSelectConnector: (connectorId: string) => void
  onCanvasClick: () => void
  onUpdateNodePosition?: (nodeId: string, x: number, y: number) => void
  onDoubleClickNode?: (node: DiagramNode) => void
}

export default function Canvas({
  nodes,
  connectors,
  selection,
  onSelectNode,
  onSelectConnector,
  onCanvasClick,
  onUpdateNodePosition,
  onDoubleClickNode
}: CanvasProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const canvasWidth = 2000
  const canvasHeight = 1500

  // Handle mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!svgRef.current) return
      e.preventDefault()

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.5, Math.min(3, zoom * delta))
      setZoom(newZoom)
    }

    svgRef.current?.addEventListener('wheel', handleWheel, { passive: false })
    return () => svgRef.current?.removeEventListener('wheel', handleWheel)
  }, [zoom])

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 || e.ctrlKey) {
      // Right click or Ctrl+left click for pan
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }

    // Handle node dragging
    if (draggingNodeId) {
      e.preventDefault()
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingNodeId(null)
  }

  // Handle node drag start
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    
    // Only drag on left click without modifier keys
    if (e.button !== 0) return
    if (e.ctrlKey || e.shiftKey || e.altKey) return

    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    setDraggingNodeId(nodeId)
    setDragOffset({
      x: e.clientX - node.position.x * zoom - pan.x,
      y: e.clientY - node.position.y * zoom - pan.y
    })
  }

  // Handle node dragging
  const handleSvgMouseMove = (e: React.MouseEvent) => {
    handleMouseMove(e)

    if (draggingNodeId) {
      const newX = (e.clientX - dragOffset.x - pan.x) / zoom
      const newY = (e.clientY - dragOffset.y - pan.y) / zoom

      // Snap to grid (optional, but nice)
      const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE
      const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE

      onUpdateNodePosition?.(draggingNodeId, snappedX, snappedY)
    }
  }

  // Get node bounds
  const getNodeBounds = (node: DiagramNode) => ({
    x: node.position.x,
    y: node.position.y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  })

  // Calculate connector path (curved)
  const getConnectorPath = (sourceId: string, targetId: string) => {
    const source = nodes.find(n => n.id === sourceId)
    const target = nodes.find(n => n.id === targetId)
    if (!source || !target) return ''

    const sourceBounds = getNodeBounds(source)
    const targetBounds = getNodeBounds(target)

    const x1 = sourceBounds.x + sourceBounds.width / 2
    const y1 = sourceBounds.y + sourceBounds.height / 2
    const x2 = targetBounds.x + targetBounds.width / 2
    const y2 = targetBounds.y + targetBounds.height / 2

    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Bezier curve control points
    const cpx = x1 + dx / 2
    const cpy = y1 + dy / 2 + Math.min(dist / 4, 100)

    return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col">
      {/* Canvas Toolbar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Zoom In">
          <ZoomIn className="w-5 h-5 text-gray-600" onClick={() => setZoom(Math.min(3, zoom + 0.2))} />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Zoom Out">
          <ZoomOut className="w-5 h-5 text-gray-600" onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} />
        </button>
        <span className="text-sm text-gray-500 ml-2">{Math.round(zoom * 100)}%</span>
        <div className="flex-1" />
        <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Export">
          <Download className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-auto bg-gray-50 relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : draggingNodeId ? 'grabbing' : 'grab' }}
      >
        <svg
          ref={svgRef}
          width={canvasWidth}
          height={canvasHeight}
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            cursor: isPanning ? 'grabbing' : 'default'
          }}
          onClick={onCanvasClick}
        >
          {/* Grid background */}
          <defs>
            <pattern
              id="grid"
              width={GRID_SIZE}
              height={GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width={canvasWidth} height={canvasHeight} fill="url(#grid)" />

          {/* Connectors */}
          <g>
            {connectors.map(connector => (
              <g key={connector.id}>
                <path
                  d={getConnectorPath(connector.sourceId, connector.targetId)}
                  fill="none"
                  stroke={selection.type === 'connector' && selection.id === connector.id ? '#3b82f6' : '#9ca3af'}
                  strokeWidth={selection.type === 'connector' && selection.id === connector.id ? 3 : 2}
                  strokeDasharray={connector.type === 'related_to' ? '5,5' : '0'}
                  markerEnd="url(#arrowhead)"
                  className="cursor-pointer hover:stroke-blue-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectConnector(connector.id)
                  }}
                />
                {/* Connector label */}
                {connector.label && (
                  <text
                    x={(nodes.find(n => n.id === connector.sourceId)?.position.x || 0) +
                       (nodes.find(n => n.id === connector.targetId)?.position.x || 0) / 2}
                    y={(nodes.find(n => n.id === connector.sourceId)?.position.y || 0) +
                       (nodes.find(n => n.id === connector.targetId)?.position.y || 0) / 2 - 10}
                    className="text-xs fill-gray-600 pointer-events-none"
                    textAnchor="middle"
                  >
                    {connector.label}
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
            </marker>
          </defs>

          {/* Nodes */}
          <g>
            {nodes.map(node => {
              const bounds = getNodeBounds(node)
              const colors = getNodeColor(node.type)
              const isSelected = selection.type === 'node' && selection.id === node.id

              return (
                <g
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectNode(node.id)
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    onDoubleClickNode?.(node)
                  }}
                  className="cursor-move"
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  {/* Node background */}
                  <rect
                    x={bounds.x}
                    y={bounds.y}
                    width={bounds.width}
                    height={bounds.height}
                    rx={8}
                    fill={isSelected ? '#dbeafe' : 'white'}
                    stroke={isSelected ? '#3b82f6' : colors.border.replace('border-', '#')}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all"
                    style={{ userSelect: 'none' }}
                  />

                  {/* Node content */}
                  <foreignObject
                    x={bounds.x}
                    y={bounds.y}
                    width={bounds.width}
                    height={bounds.height}
                    className="pointer-events-none"
                  >
                    <div className="h-full p-3 flex flex-col bg-white rounded-lg">
                      {/* Icon and title */}
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`${colors.text} flex-shrink-0 mt-0.5`}>
                          {getNodeIcon(node.type)}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                          {node.title}
                        </h3>
                      </div>

                      {/* Status badge */}
                      {node.status && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded w-fit ${getStatusBadgeColor(node.status)} mb-2`}>
                          {node.status}
                        </span>
                      )}

                      {/* Description */}
                      <p className="text-xs text-gray-600 line-clamp-2 flex-1">
                        {node.description}
                      </p>
                    </div>
                  </foreignObject>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </div>
  )
}
