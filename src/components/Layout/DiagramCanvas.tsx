import { useState, useRef, useEffect } from 'react'
import { DiagramNode, DiagramConnector, Position, Selection } from '../../types'
import { getNodeColor, getNodeIcon, getStatusBadgeColor } from '../../utils/elementUtils.tsx'
import { ZoomIn, ZoomOut, Download, Send, X } from 'lucide-react'

const GRID_SIZE = 20
const NODE_WIDTH = 180
const NODE_HEIGHT = 120
const MIN_NODE_WIDTH = 120
const MIN_NODE_HEIGHT = 80
const RESIZE_HANDLE_SIZE = 12

type ContextMenuState =
  | { type: 'canvas'; x: number; y: number; canvasPosition: Position }
  | { type: 'node'; x: number; y: number; nodeId: string }
  | { type: 'connector'; x: number; y: number; connectorId: string }

interface ContextMenuItem {
  label: string
  disabled?: boolean
  danger?: boolean
  onClick?: () => void
}

interface CanvasProps {
  activeTool?: string
  nodes: DiagramNode[]
  connectors: DiagramConnector[]
  selection: Selection
  onSelectNode: (nodeId: string) => void
  onSelectConnector: (connectorId: string) => void
  onCanvasClick: () => void
  onUpdateNodePosition?: (nodeId: string, x: number, y: number) => void
  onUpdateNodeSize?: (nodeId: string, width: number, height: number) => void
  onUpdateNode?: (nodeId: string, updates: Partial<DiagramNode>) => void
  onDoubleClickNode?: (node: DiagramNode) => void
  onAddNode?: (type: string, position?: Position) => void
  onOpenDiagram?: (diagramId: string, focusNodeIds?: string[]) => void
  onCreateChildDiagram?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onDeleteConnector?: (connectorId: string) => void
  onDeleteSelection?: () => void
  onAddConnector?: (sourceId: string, targetId: string) => void
  onReverseConnector?: (connectorId: string) => void
  onUpdateConnector?: (connectorId: string, updates: Partial<DiagramConnector>) => void
  onCopySelection?: () => void
  onCutSelection?: () => void
  onPaste?: (position?: Position) => void
  onSelectAll?: () => void
  onAutoOrganize?: () => void
  onCreateDiagramNote?: (position: Position) => void
  hasClipboard?: boolean
  isQuickCreateOpen?: boolean
  quickCreateText?: string
  onOpenQuickCreate?: () => void
  onCloseQuickCreate?: () => void
  onQuickCreateTextChange?: (text: string) => void
  onGenerateDiagram?: () => void | Promise<void>
  highlightedNodeIds?: string[]
  issueNodeIds?: string[]
}

export default function Canvas({
  activeTool = 'select',
  nodes,
  connectors,
  selection,
  onSelectNode,
  onSelectConnector,
  onCanvasClick,
  onUpdateNodePosition,
  onUpdateNodeSize,
  onUpdateNode,
  onDoubleClickNode,
  onAddNode,
  onOpenDiagram,
  onCreateChildDiagram,
  onDeleteNode,
  onDeleteConnector,
  onDeleteSelection,
  onAddConnector,
  onReverseConnector,
  onUpdateConnector,
  onCopySelection,
  onCutSelection,
  onPaste,
  onSelectAll,
  onAutoOrganize,
  onCreateDiagramNote,
  hasClipboard = false,
  isQuickCreateOpen = false,
  quickCreateText = '',
  onOpenQuickCreate,
  onCloseQuickCreate,
  onQuickCreateTextChange,
  onGenerateDiagram,
  highlightedNodeIds = [],
  issueNodeIds = []
}: CanvasProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizingNode, setResizingNode] = useState<{
    nodeId: string
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [connectorDraft, setConnectorDraft] = useState<{
    sourceId: string
    start: Position
    end: Position
  } | null>(null)
  const [editingText, setEditingText] = useState<{
    kind: 'node-title' | 'node-description' | 'connector-label'
    id: string
    value: string
  } | null>(null)
  const [isQuickCreateSubmitting, setIsQuickCreateSubmitting] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const quickCreateInputRef = useRef<HTMLTextAreaElement>(null)

  const contentBounds = nodes.reduce(
    (bounds, node) => {
      const nodeBounds = {
        x: node.position.x,
        y: node.position.y,
        width: node.width ?? NODE_WIDTH,
        height: node.height ?? NODE_HEIGHT
      }
      return {
        width: Math.max(bounds.width, nodeBounds.x + nodeBounds.width + 240),
        height: Math.max(bounds.height, nodeBounds.y + nodeBounds.height + 180)
      }
    },
    { width: 2000, height: 1500 }
  )
  const canvasWidth = contentBounds.width
  const canvasHeight = contentBounds.height
  const isConnectMode = activeTool === 'connect'
  const isPresentationMode = activeTool === 'present'

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

  useEffect(() => {
    if (!contextMenu) return

    const closeMenu = () => setContextMenu(null)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }

    window.addEventListener('click', closeMenu)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  useEffect(() => {
    if (isQuickCreateOpen) {
      quickCreateInputRef.current?.focus()
      resizeQuickCreateInput()
    }
  }, [isQuickCreateOpen])

  useEffect(() => {
    resizeQuickCreateInput()
  }, [quickCreateText])

  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isEditingText =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        Boolean(target?.isContentEditable)

      if (isEditingText) return

      const isCommand = e.ctrlKey || e.metaKey

      if (isCommand && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        onCopySelection?.()
        return
      }

      if (isCommand && e.key.toLowerCase() === 'x') {
        e.preventDefault()
        onCutSelection?.()
        return
      }

      if (isCommand && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        onPaste?.()
        return
      }

      if (isCommand && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        onSelectAll?.()
        return
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return

      if (selection.type === 'multi') {
        e.preventDefault()
        onDeleteSelection?.()
        return
      }

      if (selection.type === 'node' && selection.id) {
        e.preventDefault()
        onDeleteNode?.(selection.id)
      }

      if (selection.type === 'connector' && selection.id) {
        e.preventDefault()
        onDeleteConnector?.(selection.id)
      }
    }

    window.addEventListener('keydown', handleKeyboardShortcuts)
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts)
  }, [selection, onDeleteNode, onDeleteConnector, onDeleteSelection, onCopySelection, onCutSelection, onPaste, onSelectAll])

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    canvasContainerRef.current?.focus({ preventScroll: true })

    if (e.ctrlKey) {
      // Ctrl+left click for pan
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
    if (draggingNodeId || resizingNode || connectorDraft) {
      e.preventDefault()
    }
  }

  const handleMouseUp = (e?: React.MouseEvent) => {
    if (connectorDraft && e) {
      const dropPosition = getCanvasPositionFromEvent(e)
      const targetNode = nodes.find(node => {
        if (node.id === connectorDraft.sourceId) return false
        const bounds = getNodeBounds(node)
        return (
          dropPosition.x >= bounds.x &&
          dropPosition.x <= bounds.x + bounds.width &&
          dropPosition.y >= bounds.y &&
          dropPosition.y <= bounds.y + bounds.height
        )
      })

      if (targetNode) {
        onAddConnector?.(connectorDraft.sourceId, targetNode.id)
      }
    }

    setIsPanning(false)
    setDraggingNodeId(null)
    setResizingNode(null)
    setConnectorDraft(null)
  }

  const handleCanvasKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/' && !isQuickCreateOpen) {
      e.preventDefault()
      onOpenQuickCreate?.()
    }

    if (e.key === 'Escape' && isQuickCreateOpen) {
      e.preventDefault()
      onCloseQuickCreate?.()
    }
  }

  // Handle node drag start
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    if (editingText) return
    
    // Only drag on left click without modifier keys
    if (e.button !== 0) return
    if (e.ctrlKey || e.shiftKey || e.altKey) return
    if (isConnectMode || isPresentationMode) return

    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    setDraggingNodeId(nodeId)
    setDragOffset({
      x: e.clientX - node.position.x * zoom - pan.x,
      y: e.clientY - node.position.y * zoom - pan.y
    })
  }

  const getCanvasPositionFromClient = (clientX: number, clientY: number): Position => {
    const svgRect = svgRef.current?.getBoundingClientRect()
    const offsetX = svgRect ? clientX - svgRect.left : clientX
    const offsetY = svgRect ? clientY - svgRect.top : clientY

    return {
      x: Math.round(offsetX / zoom / GRID_SIZE) * GRID_SIZE,
      y: Math.round(offsetY / zoom / GRID_SIZE) * GRID_SIZE
    }
  }

  const getCanvasPositionFromEvent = (e: React.MouseEvent): Position =>
    getCanvasPositionFromClient(e.clientX, e.clientY)

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('application/x-diagram-node-type')) return

    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    const type = e.dataTransfer.getData('application/x-diagram-node-type')
    if (!type) return

    e.preventDefault()
    e.stopPropagation()
    onAddNode?.(type, getCanvasPositionFromClient(e.clientX, e.clientY))
  }

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isPresentationMode) return

    setContextMenu({
      type: 'canvas',
      x: e.clientX,
      y: e.clientY,
      canvasPosition: getCanvasPositionFromEvent(e)
    })
  }

  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    onSelectNode(nodeId)
    setContextMenu({
      type: 'node',
      x: e.clientX,
      y: e.clientY,
      nodeId
    })
  }

  const handleConnectorContextMenu = (e: React.MouseEvent, connectorId: string) => {
    e.preventDefault()
    e.stopPropagation()
    onSelectConnector(connectorId)
    setContextMenu({
      type: 'connector',
      x: e.clientX,
      y: e.clientY,
      connectorId
    })
  }

  const handleResizeMouseDown = (e: React.MouseEvent, node: DiagramNode) => {
    e.stopPropagation()
    e.preventDefault()

    if (e.button !== 0) return

    const bounds = getNodeBounds(node)
    onSelectNode(node.id)
    setDraggingNodeId(null)
    setResizingNode({
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: bounds.width,
      startHeight: bounds.height
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

    if (resizingNode) {
      const width = Math.max(
        MIN_NODE_WIDTH,
        resizingNode.startWidth + (e.clientX - resizingNode.startX) / zoom
      )
      const height = Math.max(
        MIN_NODE_HEIGHT,
        resizingNode.startHeight + (e.clientY - resizingNode.startY) / zoom
      )

      onUpdateNodeSize?.(resizingNode.nodeId, width, height)
    }

    if (connectorDraft) {
      setConnectorDraft({
        ...connectorDraft,
        end: getCanvasPositionFromEvent(e)
      })
    }
  }

  // Get node bounds
  const getNodeBounds = (node: DiagramNode) => ({
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? NODE_WIDTH,
    height: node.height ?? NODE_HEIGHT
  })

  const getArchitectureAnnotationVisuals = () => {
    const noteWidth = 230
    const noteHeight = 76

    return nodes.flatMap(node => {
      if (!node.architectureAnnotations?.length) return []

      const bounds = getNodeBounds(node)

      return node.architectureAnnotations.map((annotation, index) => {
        const preferAbove = bounds.y - noteHeight - 18 > 16
        const noteX = bounds.x + Math.min(24 + index * 18, Math.max(24, bounds.width - 42))
        const noteY = preferAbove
          ? bounds.y - noteHeight - 18 - index * 10
          : bounds.y + bounds.height + 18 + index * 10
        const sourcePoint = {
          x: bounds.x + bounds.width / 2,
          y: preferAbove ? bounds.y : bounds.y + bounds.height
        }
        const targetPoint = {
          x: noteX + 22,
          y: preferAbove ? noteY + noteHeight : noteY
        }

        return {
          sourceNodeId: node.id,
          annotation,
          noteBounds: { x: noteX, y: noteY, width: noteWidth, height: noteHeight },
          sourcePoint,
          targetPoint
        }
      })
    })
  }

  const isDrawingShape = (type: string) => type.startsWith('shape_')
  const isBpmnNode = (type: string) => type.startsWith('bpmn_')
  const isBpmnLane = (type: string) => type === 'bpmn_lane' || type === 'bpmn_pool'

  const getNodeStrokeColor = (type: string, isSelected: boolean) => {
    if (isSelected) return '#3b82f6'
    if (type.startsWith('togaf_business_')) return '#bfdbfe'
    if (type.startsWith('togaf_data_')) return '#fed7aa'
    if (type.startsWith('togaf_application_')) return '#a7f3d0'
    if (type.startsWith('togaf_technology_')) return '#cbd5e1'
    if (type.startsWith('togaf_motivation_')) return '#c7d2fe'
    if (type.startsWith('togaf_governance_')) return '#ddd6fe'
    if (type === 'bpmn_start_event') return '#65a30d'
    if (type === 'bpmn_end_event') return '#b91c1c'
    if (type.includes('gateway')) return '#a3a300'
    if (type.startsWith('bpmn_')) return '#0284c7'

    switch (type) {
      case 'mission':
        return '#bfdbfe'
      case 'vision':
        return '#e9d5ff'
      case 'process':
        return '#a5f3fc'
      case 'system':
        return '#bbf7d0'
      case 'data_store':
        return '#fed7aa'
      case 'bottleneck':
      case 'risk':
        return '#fecaca'
      case 'gap':
      case 'shape_sticky_note':
        return '#fde68a'
      case 'solution':
      case 'recommendation':
        return '#c7d2fe'
      case 'shape_text_label':
        return 'transparent'
      case 'shape_container':
        return '#94a3b8'
      default:
        return '#d1d5db'
    }
  }

  const getNodeFillColor = (type: string, isSelected: boolean) => {
    if (isSelected) return '#dbeafe'
    if (type === 'shape_sticky_note') return '#fef3c7'
    if (type === 'shape_container') return '#f8fafc'
    if (type === 'shape_text_label') return 'transparent'
    if (type === 'bpmn_start_event') return '#f7fee7'
    if (type === 'bpmn_end_event') return '#fef2f2'
    if (type.includes('gateway')) return '#fffde7'
    if (type.startsWith('bpmn_')) return 'white'
    return 'white'
  }

  const renderCylinderShape = (
    x: number,
    y: number,
    w: number,
    h: number,
    commonProps: Record<string, unknown>,
    stroke: string,
    strokeWidth: number
  ) => (
    <g>
      <path
        d={`M ${x} ${y + h * 0.16} C ${x} ${y - h * 0.05}, ${x + w} ${y - h * 0.05}, ${x + w} ${y + h * 0.16} L ${x + w} ${y + h * 0.84} C ${x + w} ${y + h * 1.05}, ${x} ${y + h * 1.05}, ${x} ${y + h * 0.84} Z`}
        {...commonProps}
      />
      <ellipse cx={x + w / 2} cy={y + h * 0.16} rx={w / 2} ry={h * 0.16} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  )

  const renderDocumentShape = (
    x: number,
    y: number,
    w: number,
    h: number,
    commonProps: Record<string, unknown>,
    stroke: string,
    strokeWidth: number
  ) => (
    <g>
      <path d={`M ${x} ${y} H ${x + w * 0.8} L ${x + w} ${y + h * 0.2} V ${y + h} H ${x} Z`} {...commonProps} />
      <path d={`M ${x + w * 0.8} ${y} V ${y + h * 0.2} H ${x + w}`} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  )

  const renderBpmnShape = (node: DiagramNode, bounds: ReturnType<typeof getNodeBounds>, isSelected: boolean) => {
    const stroke = getNodeStrokeColor(node.type, isSelected)
    const fill = getNodeFillColor(node.type, isSelected)
    const strokeWidth = isSelected ? 3 : 2
    const commonProps = {
      fill,
      stroke,
      strokeWidth,
      className: 'transition-all',
      style: { userSelect: 'none' as const }
    }
    const x = bounds.x
    const y = bounds.y
    const w = bounds.width
    const h = bounds.height
    const cx = x + w / 2
    const cy = y + h / 2
    const r = Math.max(28, Math.min(w, h) / 2 - 8)

    if (node.category === 'Events' || node.type.endsWith('_event')) {
      const eventStrokeWidth = node.type === 'bpmn_end_event' ? 5 : strokeWidth
      return (
        <g>
          <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={eventStrokeWidth} className="transition-all" />
          {node.type === 'bpmn_intermediate_event' && (
            <circle cx={cx} cy={cy} r={Math.max(20, r - 7)} fill="none" stroke={stroke} strokeWidth={2} />
          )}
        </g>
      )
    }

    if (node.category === 'Gateways' || node.type.includes('gateway')) {
      const marker = node.type === 'bpmn_exclusive_gateway_x'
        ? 'X'
        : node.type === 'bpmn_parallel_gateway'
          ? '+'
          : node.type === 'bpmn_inclusive_gateway_o'
            ? 'O'
            : ''

      return (
        <g>
          <polygon
            points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
            {...commonProps}
          />
          {marker && (
            <text x={cx} y={cy + 8} textAnchor="middle" className="pointer-events-none fill-sky-800 text-3xl font-semibold">
              {marker}
            </text>
          )}
        </g>
      )
    }

    if (node.type === 'bpmn_data_store') {
      return renderCylinderShape(x, y, w, h, commonProps, stroke, strokeWidth)
    }

    if (node.type === 'bpmn_data_object' || node.type === 'bpmn_data_input' || node.type === 'bpmn_data_output') {
      return renderDocumentShape(x, y, w, h, commonProps, stroke, strokeWidth)
    }

    if (isBpmnLane(node.type)) {
      return <rect x={x} y={y} width={w} height={h} rx={0} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} />
    }

    if (node.type === 'bpmn_group') {
      return <rect x={x} y={y} width={w} height={h} rx={10} fill="transparent" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="8,6" />
    }

    if (node.type === 'bpmn_text_annotation') {
      return (
        <g>
          <path d={`M ${x + w * 0.18} ${y} H ${x} V ${y + h} H ${x + w * 0.18}`} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={x} y={y} width={w} height={h} rx={4} fill={isSelected ? '#eff6ff' : 'transparent'} stroke={isSelected ? '#3b82f6' : 'transparent'} strokeWidth={strokeWidth} />
        </g>
      )
    }

    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={12} {...commonProps} />
        {(node.type === 'bpmn_subprocess' || node.type === 'bpmn_collapsed_subprocess') && (
          <g>
            <rect x={cx - 8} y={y + h - 22} width={16} height={16} rx={2} fill="white" stroke={stroke} strokeWidth={1.5} />
            <text x={cx} y={y + h - 9} textAnchor="middle" className="pointer-events-none fill-sky-800 text-sm font-semibold">
              +
            </text>
          </g>
        )}
      </g>
    )
  }

  const getBpmnTaskIcon = (type: string) => {
    if (type === 'bpmn_user_task') return 'person'
    if (type === 'bpmn_service_task') return 'settings'
    if (type === 'bpmn_manual_task') return 'pan_tool'
    return ''
  }

  const isBpmnEventOrGateway = (type: string) =>
    type.endsWith('_event') || type.includes('gateway')

  const renderBpmnNodeContent = (node: DiagramNode, bounds: ReturnType<typeof getNodeBounds>) => {
    const taskIcon = getBpmnTaskIcon(node.type)

    if (isBpmnEventOrGateway(node.type)) {
      return (
        <foreignObject
          x={bounds.x - 36}
          y={bounds.y + bounds.height + 4}
          width={bounds.width + 72}
          height={44}
          className="overflow-visible"
        >
          {editingText?.kind === 'node-title' && editingText.id === node.id ? (
            <input
              autoFocus
              value={editingText.value}
              onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
              onKeyDown={(e) => handleEditKeyDown(e)}
              onBlur={commitTextEdit}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded border border-blue-300 bg-white px-1 text-center text-xs text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <div
              className="flex h-full items-start justify-center px-1 text-center text-[11px] font-medium leading-tight text-gray-700"
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => startNodeTextEdit(e, node, 'node-title')}
              title={node.title}
            >
              {node.title}
            </div>
          )}
        </foreignObject>
      )
    }

    return (
      <foreignObject
        x={bounds.x + 8}
        y={bounds.y + 8}
        width={bounds.width - 16}
        height={bounds.height - 16}
        className="overflow-hidden"
      >
        <div className="flex h-full flex-col justify-center gap-1 bg-transparent px-2 text-center">
          {taskIcon && (
            <span className="material-symbols-rounded self-start text-[16px] leading-none text-sky-700" aria-hidden="true">
              {taskIcon}
            </span>
          )}
          {editingText?.kind === 'node-title' && editingText.id === node.id ? (
            <input
              autoFocus
              value={editingText.value}
              onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
              onKeyDown={(e) => handleEditKeyDown(e)}
              onBlur={commitTextEdit}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded border border-blue-300 bg-white px-1 text-center text-xs font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <div
              className="line-clamp-3 cursor-text text-xs font-semibold leading-tight text-gray-800"
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => startNodeTextEdit(e, node, 'node-title')}
              title={node.title}
            >
              {node.title}
            </div>
          )}
        </div>
      </foreignObject>
    )
  }

  const renderNodeShape = (node: DiagramNode, bounds: ReturnType<typeof getNodeBounds>, isSelected: boolean) => {
    const stroke = getNodeStrokeColor(node.type, isSelected)
    const fill = getNodeFillColor(node.type, isSelected)
    const strokeWidth = isSelected ? 3 : 2
    const commonProps = {
      fill,
      stroke,
      strokeWidth,
      className: 'transition-all',
      style: { userSelect: 'none' as const }
    }
    const x = bounds.x
    const y = bounds.y
    const w = bounds.width
    const h = bounds.height

    if (isBpmnNode(node.type)) {
      return renderBpmnShape(node, bounds, isSelected)
    }

    switch (node.type) {
      case 'shape_rectangle':
        return <rect x={x} y={y} width={w} height={h} rx={0} {...commonProps} />
      case 'shape_rounded_rectangle':
        return <rect x={x} y={y} width={w} height={h} rx={14} {...commonProps} />
      case 'shape_ellipse':
        return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...commonProps} />
      case 'shape_diamond':
        return (
          <polygon
            points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`}
            {...commonProps}
          />
        )
      case 'shape_hexagon':
        return (
          <polygon
            points={`${x + w * 0.25},${y} ${x + w * 0.75},${y} ${x + w},${y + h / 2} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${y + h / 2}`}
            {...commonProps}
          />
        )
      case 'shape_cylinder':
        return renderCylinderShape(x, y, w, h, commonProps, stroke, strokeWidth)
      case 'shape_cloud':
        return (
          <path
            d={`M ${x + w * 0.25} ${y + h * 0.72} C ${x + w * 0.08} ${y + h * 0.72}, ${x + w * 0.02} ${y + h * 0.55}, ${x + w * 0.15} ${y + h * 0.45} C ${x + w * 0.15} ${y + h * 0.26}, ${x + w * 0.36} ${y + h * 0.18}, ${x + w * 0.5} ${y + h * 0.3} C ${x + w * 0.65} ${y + h * 0.12}, ${x + w * 0.9} ${y + h * 0.25}, ${x + w * 0.86} ${y + h * 0.5} C ${x + w} ${y + h * 0.56}, ${x + w * 0.93} ${y + h * 0.72}, ${x + w * 0.76} ${y + h * 0.72} Z`}
            {...commonProps}
          />
        )
      case 'shape_document':
        return renderDocumentShape(x, y, w, h, commonProps, stroke, strokeWidth)
      case 'shape_sticky_note':
        return (
          <g>
            <rect x={x} y={y} width={w} height={h} rx={4} {...commonProps} />
            <path d={`M ${x + w * 0.78} ${y} H ${x + w} V ${y + h * 0.22} Z`} fill="#fde68a" stroke={stroke} strokeWidth={strokeWidth} />
          </g>
        )
      case 'shape_text_label':
        return <rect x={x} y={y} width={w} height={h} rx={4} fill={isSelected ? '#eff6ff' : 'transparent'} stroke={isSelected ? '#3b82f6' : 'transparent'} strokeWidth={strokeWidth} />
      case 'shape_container':
        return <rect x={x} y={y} width={w} height={h} rx={8} strokeDasharray="8,6" {...commonProps} />
      default:
        return (
          <rect
            x={bounds.x}
            y={bounds.y}
            width={bounds.width}
            height={bounds.height}
            rx={8}
            {...commonProps}
          />
        )
    }
  }

  const getNodeCenter = (node: DiagramNode) => {
    const bounds = getNodeBounds(node)
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    }
  }

  const getConnectorHandlePosition = (node: DiagramNode): Position => {
    const bounds = getNodeBounds(node)
    return {
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height / 2
    }
  }

  const handleConnectorHandleMouseDown = (e: React.MouseEvent, node: DiagramNode) => {
    e.stopPropagation()
    e.preventDefault()

    if (e.button !== 0) return

    const start = getConnectorHandlePosition(node)
    setDraggingNodeId(null)
    setResizingNode(null)
    setConnectorDraft({
      sourceId: node.id,
      start,
      end: start
    })
    onSelectNode(node.id)
  }

  const getConnectorPairKey = (sourceId: string, targetId: string) =>
    [sourceId, targetId].sort().join('::')

  const getConnectorLineStyle = (connector: DiagramConnector) => {
    const connectorType = connector.type as string
    const lineStyle = connector.lineStyle ?? (connectorType === 'flow' || connectorType === 'sequence_flow' ? 'solid' : connector.type === 'related_to' ? 'dashed' : 'solid')
    if (lineStyle === 'dashed') return '8,6'
    if (lineStyle === 'dotted') return '2,6'
    return '0'
  }

  const getDefaultEndMarker = (connector: DiagramConnector) => {
    if (connector.endMarker) return connector.endMarker
    if (connector.type === 'association') return 'none'
    if (connector.type === 'contains') return 'diamond'
    return 'arrow'
  }

  const getMarkerUrl = (marker?: string) => {
    if (!marker || marker === 'none') return undefined
    return `url(#connector-${marker})`
  }

  const shouldShowConnectorLabel = (connector: DiagramConnector) =>
    Boolean(connector.label) && connector.label?.toLowerCase() !== 'sequence flow'

  const getQuadraticPoint = (
    start: Position,
    control: Position,
    end: Position,
    t: number
  ): Position => {
    const inverseT = 1 - t
    return {
      x: inverseT * inverseT * start.x + 2 * inverseT * t * control.x + t * t * end.x,
      y: inverseT * inverseT * start.y + 2 * inverseT * t * control.y + t * t * end.y
    }
  }

  const getEdgeConnectionPoints = (source: DiagramNode, target: DiagramNode) => {
    const sourceBounds = getNodeBounds(source)
    const targetBounds = getNodeBounds(target)
    const sourceCenter = getNodeCenter(source)
    const targetCenter = getNodeCenter(target)
    const dx = targetCenter.x - sourceCenter.x
    const dy = targetCenter.y - sourceCenter.y

    if (Math.abs(dx) >= Math.abs(dy)) {
      return {
        start: {
          x: dx >= 0 ? sourceBounds.x + sourceBounds.width : sourceBounds.x,
          y: sourceCenter.y
        },
        end: {
          x: dx >= 0 ? targetBounds.x : targetBounds.x + targetBounds.width,
          y: targetCenter.y
        }
      }
    }

    return {
      start: {
        x: sourceCenter.x,
        y: dy >= 0 ? sourceBounds.y + sourceBounds.height : sourceBounds.y
      },
      end: {
        x: targetCenter.x,
        y: dy >= 0 ? targetBounds.y : targetBounds.y + targetBounds.height
      }
    }
  }

  const getConnectorVisual = (connector: DiagramConnector) => {
    const source = nodes.find(n => n.id === connector.sourceId)
    const target = nodes.find(n => n.id === connector.targetId)
    if (!source || !target) return null

    const connectorType = connector.type as string
    const isBpmnConnector =
      connectorType === 'flow' ||
      connectorType === 'sequence_flow' ||
      isBpmnNode(source.type) ||
      isBpmnNode(target.type)

    if (isBpmnConnector && !isBpmnLane(source.type) && !isBpmnLane(target.type)) {
      const { start, end } = getEdgeConnectionPoints(source, target)
      const midX = start.x + (end.x - start.x) / 2
      const hasLaneChange = Math.abs(start.y - end.y) > 12
      const path = hasLaneChange
        ? `M ${start.x} ${start.y} H ${midX} V ${end.y} H ${end.x}`
        : `M ${start.x} ${start.y} L ${end.x} ${end.y}`

      return {
        path,
        labelPosition: {
          x: hasLaneChange ? midX : start.x + (end.x - start.x) / 2,
          y: hasLaneChange ? start.y + (end.y - start.y) / 2 - 8 : start.y - 10
        }
      }
    }

    const sourceCenter = getNodeCenter(source)
    const targetCenter = getNodeCenter(target)
    const start = { x: sourceCenter.x, y: sourceCenter.y }
    const end = { x: targetCenter.x, y: targetCenter.y }
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
    const relatedConnectors = connectors.filter(candidate =>
      getConnectorPairKey(candidate.sourceId, candidate.targetId) === getConnectorPairKey(connector.sourceId, connector.targetId)
    )
    const total = relatedConnectors.length
    const index = Math.max(relatedConnectors.findIndex(candidate => candidate.id === connector.id), 0)
    const midpoint = {
      x: start.x + dx / 2,
      y: start.y + dy / 2
    }
    const [firstNodeId, secondNodeId] = [connector.sourceId, connector.targetId].sort()
    const firstNode = nodes.find(node => node.id === firstNodeId)
    const secondNode = nodes.find(node => node.id === secondNodeId)
    const firstCenter = firstNode ? getNodeCenter(firstNode) : start
    const secondCenter = secondNode ? getNodeCenter(secondNode) : end
    const referenceDx = secondCenter.x - firstCenter.x
    const referenceDy = secondCenter.y - firstCenter.y
    const referenceDistance = Math.max(Math.sqrt(referenceDx * referenceDx + referenceDy * referenceDy), 1)
    const normal = {
      x: -referenceDy / referenceDistance,
      y: referenceDx / referenceDistance
    }
    const offset = total <= 1 ? Math.min(distance / 4, 100) : (index - (total - 1) / 2) * 36
    const control = total <= 1
      ? { x: midpoint.x, y: midpoint.y + offset }
      : {
        x: midpoint.x + normal.x * offset,
        y: midpoint.y + normal.y * offset
      }
    const labelPoint = getQuadraticPoint(start, control, end, 0.5)
    const labelOffset = total <= 1 ? { x: 0, y: -10 } : { x: normal.x * 14, y: normal.y * 14 - 8 }

    return {
      path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
      labelPosition: {
        x: labelPoint.x + labelOffset.x,
        y: labelPoint.y + labelOffset.y
      }
    }
  }

  const resetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleGenerateFromQuickCreate = async () => {
    if (!quickCreateText.trim() || isQuickCreateSubmitting) return

    setIsQuickCreateSubmitting(true)
    try {
      await onGenerateDiagram?.()
    } finally {
      setIsQuickCreateSubmitting(false)
      quickCreateInputRef.current?.focus()
    }
  }

  const startNodeTextEdit = (
    e: React.MouseEvent,
    node: DiagramNode,
    kind: 'node-title' | 'node-description'
  ) => {
    e.preventDefault()
    e.stopPropagation()
    onSelectNode(node.id)
    setDraggingNodeId(null)
    setEditingText({
      kind,
      id: node.id,
      value: kind === 'node-title' ? node.title : node.description ?? ''
    })
  }

  const startConnectorLabelEdit = (e: React.MouseEvent, connector: DiagramConnector) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPresentationMode) return
    onSelectConnector(connector.id)
    setEditingText({
      kind: 'connector-label',
      id: connector.id,
      value: connector.label ?? ''
    })
  }

  const commitTextEdit = () => {
    if (!editingText) return
    const value = editingText.value.trim()

    if (editingText.kind === 'node-title') {
      onUpdateNode?.(editingText.id, { title: value || 'Untitled', name: value || 'Untitled' })
    } else if (editingText.kind === 'node-description') {
      onUpdateNode?.(editingText.id, { description: value })
    } else {
      onUpdateConnector?.(editingText.id, { label: value })
    }

    setEditingText(null)
  }

  const cancelTextEdit = () => setEditingText(null)

  const handleEditKeyDown = (e: React.KeyboardEvent, multiline = false) => {
    e.stopPropagation()

    if (e.key === 'Escape') {
      e.preventDefault()
      cancelTextEdit()
      return
    }

    if (e.key === 'Enter' && (!multiline || !e.shiftKey)) {
      e.preventDefault()
      commitTextEdit()
    }
  }

  const resizeQuickCreateInput = () => {
    const input = quickCreateInputRef.current
    if (!input) return

    input.style.height = '0px'
    input.style.height = `${Math.min(input.scrollHeight, 72)}px`
  }

  const closeContextMenu = () => setContextMenu(null)

  const getContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenu) return []

    if (contextMenu.type === 'canvas') {
      return [
        {
          label: 'Add node',
          onClick: () => onAddNode?.('process', contextMenu.canvasPosition)
        },
        { label: 'Paste', disabled: !hasClipboard, onClick: () => onPaste?.(contextMenu.canvasPosition) },
        { label: 'Select all', onClick: () => onSelectAll?.() },
        { label: 'Auto organize', onClick: () => onAutoOrganize?.() },
        { label: 'Create diagram note', onClick: () => onCreateDiagramNote?.(contextMenu.canvasPosition) },
        { label: 'Reset zoom', onClick: resetZoom }
      ]
    }

    if (contextMenu.type === 'node') {
      const node = nodes.find(n => n.id === contextMenu.nodeId)
      const hasLinkedDiagram = Boolean(node?.linkedDiagramId)

      return [
        {
          label: 'Open linked diagram',
          disabled: !node?.linkedDiagramId,
          onClick: () => node?.linkedDiagramId && onOpenDiagram?.(node.linkedDiagramId)
        },
        {
          label: 'Create child diagram',
          disabled: hasLinkedDiagram,
          onClick: () => node && onCreateChildDiagram?.(node.id)
        },
        { label: 'Rename', disabled: true },
        { label: 'Duplicate', disabled: true },
        {
          label: 'Delete',
          danger: true,
          onClick: () => onDeleteNode?.(contextMenu.nodeId)
        },
        { label: 'Bring to front', disabled: true },
        { label: 'Send to back', disabled: true },
        { label: 'Add connector', disabled: true },
        { label: 'Change node type', disabled: true },
        { label: 'Edit properties', disabled: true }
      ]
    }

    return [
      { label: 'Edit relationship', onClick: () => onSelectConnector(contextMenu.connectorId) },
      { label: 'Change relationship type', onClick: () => onSelectConnector(contextMenu.connectorId) },
      { label: 'Change line style', onClick: () => onSelectConnector(contextMenu.connectorId) },
      { label: 'Change start marker', onClick: () => onSelectConnector(contextMenu.connectorId) },
      { label: 'Change end marker', onClick: () => onSelectConnector(contextMenu.connectorId) },
      { label: 'Reverse direction', onClick: () => onReverseConnector?.(contextMenu.connectorId) },
      {
        label: 'Delete connector',
        danger: true,
        onClick: () => onDeleteConnector?.(contextMenu.connectorId)
      },
      { label: 'Add label', disabled: true },
      { label: 'Edit properties', disabled: true }
    ]
  }

  const ContextMenu = () => {
    if (!contextMenu) return null

    return (
      <div
        className="fixed z-50 min-w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {getContextMenuItems().map(item => (
          <button
            key={item.label}
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return
              item.onClick?.()
              closeContextMenu()
            }}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              item.disabled
                ? 'cursor-not-allowed text-gray-400'
                : item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    )
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
        ref={canvasContainerRef}
        tabIndex={0}
        className="flex-1 overflow-auto bg-gray-50 relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => handleMouseUp()}
        onContextMenu={handleCanvasContextMenu}
        onKeyDown={handleCanvasKeyDown}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
        style={{
          cursor: resizingNode
            ? 'nwse-resize'
            : isPanning || draggingNodeId
              ? 'grabbing'
              : isConnectMode
                ? 'crosshair'
                : isPresentationMode
                  ? 'default'
                  : 'grab'
        }}
      >
        <svg
          ref={svgRef}
          data-diagram-export-svg="true"
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

          {/* BPMN lanes as background bands */}
          <g>
            {nodes.filter(node => isBpmnLane(node.type)).map(node => {
              const bounds = getNodeBounds(node)
              return (
                <g key={node.id} className="pointer-events-none">
                  <rect
                    x={bounds.x}
                    y={bounds.y}
                    width={Math.max(bounds.width, canvasWidth - bounds.x - 120)}
                    height={Math.max(bounds.height, 130)}
                    fill="#f8fafc"
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
                  />
                  <rect
                    x={bounds.x}
                    y={bounds.y}
                    width={160}
                    height={Math.max(bounds.height, 130)}
                    fill="#eef2f7"
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
                  />
                  <text
                    x={bounds.x + 18}
                    y={bounds.y + Math.max(bounds.height, 130) / 2 + 5}
                    className="fill-slate-700 text-sm font-semibold"
                  >
                    {node.title}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Connectors */}
          <g>
            {connectors.map(connector => {
              const visual = getConnectorVisual(connector)
              if (!visual) return null

              return (
                <g key={connector.id}>
                  <path
                    d={visual.path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    pointerEvents="stroke"
                    className="cursor-pointer"
                    onContextMenu={(e) => {
                      if (isPresentationMode) {
                        e.preventDefault()
                        return
                      }
                      handleConnectorContextMenu(e, connector.id)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isPresentationMode) return
                      onSelectConnector(connector.id)
                    }}
                  />
                  <path
                    d={visual.path}
                    fill="none"
                    stroke={
                      (selection.type === 'connector' && selection.id === connector.id) ||
                      (selection.type === 'multi' && selection.connectorIds?.includes(connector.id))
                        ? '#3b82f6'
                        : '#9ca3af'
                    }
                    strokeWidth={
                      (selection.type === 'connector' && selection.id === connector.id) ||
                      (selection.type === 'multi' && selection.connectorIds?.includes(connector.id))
                        ? 3
                        : 2
                    }
                    strokeDasharray={getConnectorLineStyle(connector)}
                    markerStart={getMarkerUrl(connector.startMarker)}
                    markerEnd={getMarkerUrl(getDefaultEndMarker(connector))}
                    className="pointer-events-none"
                    onContextMenu={(e) => {
                      if (isPresentationMode) {
                        e.preventDefault()
                        return
                      }
                      handleConnectorContextMenu(e, connector.id)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isPresentationMode) return
                      onSelectConnector(connector.id)
                    }}
                  />
                  {editingText?.kind === 'connector-label' && editingText.id === connector.id ? (
                    <foreignObject
                      x={visual.labelPosition.x - 80}
                      y={visual.labelPosition.y - 18}
                      width={160}
                      height={34}
                      className="overflow-visible"
                    >
                      <input
                        autoFocus
                        value={editingText.value}
                        onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
                        onKeyDown={(e) => handleEditKeyDown(e)}
                        onBlur={commitTextEdit}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="h-7 w-full rounded border border-blue-300 bg-white px-2 text-center text-xs text-gray-800 shadow outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </foreignObject>
                  ) : shouldShowConnectorLabel(connector) && (
                    <text
                      x={visual.labelPosition.x}
                      y={visual.labelPosition.y}
                      className="cursor-text text-xs fill-gray-600"
                      textAnchor="middle"
                      onDoubleClick={(e) => startConnectorLabelEdit(e, connector)}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isPresentationMode) onSelectConnector(connector.id)
                      }}
                    >
                      {connector.label}
                    </text>
                  )}
                </g>
              )
            })}
          </g>

          {/* Arrow marker */}
          <defs>
            <marker
              id="connector-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
            </marker>
            <marker
              id="connector-open_arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <path d="M 0 0 L 10 3 L 0 6" fill="none" stroke="#9ca3af" strokeWidth="1.8" />
            </marker>
            <marker
              id="connector-diamond"
              markerWidth="12"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <polygon points="0 5, 5 0, 10 5, 5 10" fill="#9ca3af" />
            </marker>
            <marker
              id="connector-circle"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
            >
              <circle cx="5" cy="5" r="3.5" fill="#9ca3af" />
            </marker>
          </defs>

          {/* Nodes */}
          <g>
            {nodes.filter(node => !isBpmnLane(node.type)).map(node => {
              const bounds = getNodeBounds(node)
              const colors = getNodeColor(node.type)
              const isSelected =
                (selection.type === 'node' && selection.id === node.id) ||
                (selection.type === 'multi' && Boolean(selection.nodeIds?.includes(node.id)))
              const isSingleNodeSelected = selection.type === 'node' && selection.id === node.id
              const isAnalysisHighlighted = highlightedNodeIds.includes(node.id)
              const hasAnalysisIssue = issueNodeIds.includes(node.id)
              const nestedDiagramId = node.linkedDiagramId ?? node.childDiagramId
              const hasNestedDiagram = Boolean(nestedDiagramId)
              const showConnectorHandle = isConnectMode || isSelected || hoveredNodeId === node.id || connectorDraft?.sourceId === node.id
              const handlePosition = getConnectorHandlePosition(node)

              return (
                <g
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isPresentationMode) return
                    onSelectNode(node.id)
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (isPresentationMode) return
                    onDoubleClickNode?.(node)
                  }}
                  className={isConnectMode ? 'cursor-crosshair' : isPresentationMode ? 'cursor-default' : 'cursor-move'}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onContextMenu={(e) => {
                    if (isPresentationMode) {
                      e.preventDefault()
                      e.stopPropagation()
                      return
                    }
                    handleNodeContextMenu(e, node.id)
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(current => current === node.id ? null : current)}
                >
                  {/* Node background */}
                  {renderNodeShape(node, bounds, isSelected)}

                  {isAnalysisHighlighted && (
                    <rect
                      x={bounds.x - 8}
                      y={bounds.y - 8}
                      width={bounds.width + 16}
                      height={bounds.height + 16}
                      rx={14}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      strokeDasharray="8,6"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Node content */}
                  {isBpmnNode(node.type) ? (
                    renderBpmnNodeContent(node, bounds)
                  ) : (
                    <foreignObject
                      x={bounds.x}
                      y={bounds.y}
                      width={bounds.width}
                      height={bounds.height}
                      className="overflow-hidden"
                    >
                      <div className={`h-full p-3 flex flex-col ${isDrawingShape(node.type) ? 'bg-transparent' : 'bg-white rounded-lg'}`}>
                        {/* Icon and title */}
                        <div className="flex items-start gap-2 mb-2">
                          <div className={`${colors.text} flex-shrink-0 mt-0.5`}>
                            {getNodeIcon(node.type)}
                          </div>
                          {editingText?.kind === 'node-title' && editingText.id === node.id ? (
                            <input
                              autoFocus
                              value={editingText.value}
                              onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
                              onKeyDown={(e) => handleEditKeyDown(e)}
                              onBlur={commitTextEdit}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              className="min-w-0 flex-1 rounded border border-blue-300 bg-white px-1 text-sm font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <h3
                              className="min-w-0 flex-1 cursor-text text-sm font-semibold leading-tight text-gray-900"
                              onMouseDown={(e) => e.stopPropagation()}
                              onDoubleClick={(e) => startNodeTextEdit(e, node, 'node-title')}
                            >
                              {node.title}
                            </h3>
                          )}
                        </div>

                        {/* Status badge */}
                        {node.status && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded w-fit ${getStatusBadgeColor(node.status)} mb-2`}>
                            {node.status}
                          </span>
                        )}

                        {/* Description */}
                        {editingText?.kind === 'node-description' && editingText.id === node.id ? (
                          <textarea
                            autoFocus
                            value={editingText.value}
                            onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
                            onKeyDown={(e) => handleEditKeyDown(e, true)}
                            onBlur={commitTextEdit}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="min-h-10 flex-1 resize-none rounded border border-blue-300 bg-white px-1 py-0.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <p
                            className="line-clamp-2 flex-1 cursor-text text-xs text-gray-600"
                            onMouseDown={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => startNodeTextEdit(e, node, 'node-description')}
                          >
                            {node.description}
                          </p>
                        )}
                      </div>
                    </foreignObject>
                  )}

                  {isSingleNodeSelected && (
                    <rect
                      x={bounds.x + bounds.width - RESIZE_HANDLE_SIZE / 2}
                      y={bounds.y + bounds.height - RESIZE_HANDLE_SIZE / 2}
                      width={RESIZE_HANDLE_SIZE}
                      height={RESIZE_HANDLE_SIZE}
                      rx={2}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={2}
                      className="cursor-nwse-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, node)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {hasNestedDiagram && (
                    <foreignObject
                      x={bounds.x + bounds.width - 36}
                      y={bounds.y + 6}
                      width={30}
                      height={30}
                      className="overflow-visible"
                    >
                      <button
                        type="button"
                        title="Open nested diagram"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!isPresentationMode && nestedDiagramId) {
                            onOpenDiagram?.(nestedDiagramId)
                          }
                        }}
                      >
                        <span className="material-symbols-rounded text-[16px] leading-none" aria-hidden="true">
                          account_tree
                        </span>
                      </button>
                    </foreignObject>
                  )}

                  {showConnectorHandle && (
                    <circle
                      cx={handlePosition.x}
                      cy={handlePosition.y}
                      r={7}
                      fill="#2563eb"
                      stroke="white"
                      strokeWidth={2}
                      className="cursor-crosshair"
                      onMouseDown={(e) => handleConnectorHandleMouseDown(e, node)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {hasAnalysisIssue && (
                    <g className="pointer-events-none">
                      <circle
                        cx={bounds.x + bounds.width - 12}
                        cy={bounds.y + (hasNestedDiagram ? 38 : 12)}
                        r={9}
                        fill="#f59e0b"
                        stroke="white"
                        strokeWidth={2}
                      />
                      <text
                        x={bounds.x + bounds.width - 12}
                        y={bounds.y + (hasNestedDiagram ? 42 : 16)}
                        textAnchor="middle"
                        className="fill-white text-xs font-bold"
                      >
                        !
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>

          {/* BPMN architecture annotations */}
          <g>
            {getArchitectureAnnotationVisuals().map(({ annotation, sourceNodeId, noteBounds, sourcePoint, targetPoint }) => (
              <g key={`${sourceNodeId}-${annotation.id}`}>
                <path
                  d={`M ${sourcePoint.x} ${sourcePoint.y} L ${targetPoint.x} ${targetPoint.y}`}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="5,5"
                  className="pointer-events-none"
                />
                <foreignObject
                  x={noteBounds.x}
                  y={noteBounds.y}
                  width={noteBounds.width}
                  height={noteBounds.height}
                  className="overflow-visible"
                >
                  <button
                    type="button"
                    title="Open related architecture view"
                    className="flex h-full w-full cursor-pointer gap-2 rounded-md border border-amber-200 bg-amber-50/95 p-2 text-left text-amber-950 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-100"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!isPresentationMode) {
                        onOpenDiagram?.(annotation.targetDiagramId, annotation.targetNodeIds)
                      }
                    }}
                  >
                    <span className="material-symbols-rounded mt-0.5 text-[18px] leading-none text-amber-700" aria-hidden="true">
                      {annotation.icon ?? 'sticky_note_2'}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold leading-tight">{annotation.title}</span>
                      <span className="line-clamp-2 text-[10px] leading-snug text-amber-900/85">{annotation.text}</span>
                    </span>
                  </button>
                </foreignObject>
              </g>
            ))}
          </g>

          {connectorDraft && (
            <path
              d={`M ${connectorDraft.start.x} ${connectorDraft.start.y} Q ${(connectorDraft.start.x + connectorDraft.end.x) / 2} ${connectorDraft.start.y} ${connectorDraft.end.x} ${connectorDraft.end.y}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="5,5"
              className="pointer-events-none"
            />
          )}
        </svg>
        <div
          className="absolute bottom-5 left-1/2 z-30 w-[min(620px,calc(100%-48px))] -translate-x-1/2"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
        >
          {isQuickCreateOpen ? (
            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-xl backdrop-blur">
              <textarea
                ref={quickCreateInputRef}
                rows={1}
                value={quickCreateText}
                onChange={(e) => {
                  onQuickCreateTextChange?.(e.target.value)
                  resizeQuickCreateInput()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    onCloseQuickCreate?.()
                    return
                  }

                  if (e.key === 'Enter') {
                    if (e.shiftKey) return

                    e.preventDefault()
                    void handleGenerateFromQuickCreate()
                  }
                }}
                className="max-h-[72px] min-h-[36px] flex-1 resize-none overflow-y-auto rounded-xl border-0 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none"
                placeholder="Describe a process, gap, mission, or architecture..."
              />
              <button
                onClick={() => void handleGenerateFromQuickCreate()}
                disabled={!quickCreateText.trim() || isQuickCreateSubmitting}
                className="mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                title={isQuickCreateSubmitting ? 'Generating...' : 'Generate'}
              >
                <Send className="h-4 w-4" />
              </button>
              <button
                onClick={() => onCloseQuickCreate?.()}
                className="mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenQuickCreate?.()}
              className="mx-auto flex h-11 max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-4 text-sm text-gray-500 shadow-lg backdrop-blur transition-colors hover:border-blue-200 hover:text-gray-800"
              title="Open Quick Capture (/)"
            >
              <span className="font-medium text-gray-700">Quick Capture</span>
              <span className="hidden text-gray-400 sm:inline">Describe a process, gap, mission, or architecture...</span>
              <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">/</kbd>
            </button>
          )}
        </div>
        <ContextMenu />
      </div>
    </div>
  )
}
