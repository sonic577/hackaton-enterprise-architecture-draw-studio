import { useRef, useState } from 'react'
import Toolbar from './components/Layout/Toolbar'
import ComponentLibrary from './components/Layout/ComponentLibrary'
import { DiagramExplorer } from './components/Layout/DiagramExplorer'
import DiagramCanvas from './components/Layout/DiagramCanvas'
import Inspector from './components/Layout/Inspector'
import { mockDiagrams, rootDiagram } from './data/mockData'
import { createComponentMetadata } from './data/componentDefinitions'
import { generateDiagramFromText } from './utils/mockDiagramGenerator'
import { analyzeProcess, ProcessAnalysisResult } from './utils/processAnalyzer'
import { Selection, Diagram, DiagramNode, Position } from './types'

interface DiagramStackItem {
  diagram: Diagram
  parentNodeId?: string
  parentNodeTitle?: string
}

interface SavedProject {
  projectSchemaVersion: number
  metadata: {
    id: string
    name: string
    version: string
    savedAt: string
  }
  currentDiagramId: string
  diagrams: Diagram[]
}

const PROJECT_SCHEMA_VERSION = 1

export default function App() {
  // Map of all diagrams by ID
  const [diagrams, setDiagrams] = useState<Map<string, Diagram>>(() => {
    const map = new Map()
    mockDiagrams.forEach(diagram => map.set(diagram.id, diagram))
    return map
  })

  // Stack of opened diagrams for navigation
  const [diagramStack, setDiagramStack] = useState<DiagramStackItem[]>([
    { diagram: rootDiagram }
  ])

  const currentDiagramItem = diagramStack[diagramStack.length - 1]
  const currentDiagram = currentDiagramItem.diagram
  const canGoBack = diagramStack.length > 1
  const parentDiagram = currentDiagram.parentId ? diagrams.get(currentDiagram.parentId) : undefined

  // Selection state
  const [selection, setSelection] = useState<Selection>({ type: null })
  const [activeTool, setActiveTool] = useState('select')
  const [isAiInputOpen, setIsAiInputOpen] = useState(false)
  const [quickCreateText, setQuickCreateText] = useState('')
  const [projectMessage, setProjectMessage] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<ProcessAnalysisResult[]>([])
  const [highlightedAnalysisNodeIds, setHighlightedAnalysisNodeIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectNode = (nodeId: string) => {
    setSelection({ type: 'node', id: nodeId })
  }

  const handleSelectConnector = (connectorId: string) => {
    setSelection({ type: 'connector', id: connectorId })
  }

  const handleCanvasClick = () => {
    setSelection({ type: null })
  }

  const issueNodeIds = Array.from(new Set(analysisResults.flatMap(result => result.relatedNodeIds)))

  const handleAnalyzeProcess = () => {
    const results = analyzeProcess(currentDiagram.nodes, currentDiagram.connectors)
    setAnalysisResults(results)
    setHighlightedAnalysisNodeIds([])
    setSelection({ type: null })
    setProjectMessage(`Process analysis complete: ${results.length} result${results.length === 1 ? '' : 's'} found.`)
  }

  const handleSelectAnalysisResult = (result: ProcessAnalysisResult) => {
    setHighlightedAnalysisNodeIds(result.relatedNodeIds)
    setSelection({ type: null })
  }

  const formatNodeTitle = (type: string) =>
    type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

  const handleAddNode = (type: string, position: Position = { x: 400, y: 300 }) => {
    const nodeTitle = formatNodeTitle(type)
    const componentMetadata = createComponentMetadata(type)
    const newNode: DiagramNode = {
      id: `node-${Date.now()}`,
      type,
      title: componentMetadata.title ?? 'New ' + nodeTitle,
      description: componentMetadata.description ?? `New ${nodeTitle.toLowerCase()} node`,
      position,
      width: 180,
      height: 120,
      status: 'extracted' as const,
      ...componentMetadata
    }

    const updatedDiagram = {
      ...currentDiagram,
      nodes: [...currentDiagram.nodes, newNode]
    }

    // Update in diagrams map
    const newDiagrams = new Map(diagrams)
    newDiagrams.set(currentDiagram.id, updatedDiagram)
    setDiagrams(newDiagrams)

    // Update in stack
    const newStack = [...diagramStack]
    newStack[newStack.length - 1].diagram = updatedDiagram
    setDiagramStack(newStack)
    setSelection({ type: 'node', id: newNode.id })
  }

  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    const updatedDiagram = {
      ...currentDiagram,
      nodes: currentDiagram.nodes.map(node =>
        node.id === nodeId ? { ...node, position: { x, y } } : node
      )
    }

    const newDiagrams = new Map(diagrams)
    newDiagrams.set(currentDiagram.id, updatedDiagram)
    setDiagrams(newDiagrams)

    const newStack = [...diagramStack]
    newStack[newStack.length - 1].diagram = updatedDiagram
    setDiagramStack(newStack)
  }

  const handleUpdateNodeSize = (nodeId: string, width: number, height: number) => {
    const updatedDiagram = {
      ...currentDiagram,
      nodes: currentDiagram.nodes.map(node =>
        node.id === nodeId ? { ...node, width, height } : node
      )
    }

    const newDiagrams = new Map(diagrams)
    newDiagrams.set(currentDiagram.id, updatedDiagram)
    setDiagrams(newDiagrams)

    const newStack = [...diagramStack]
    newStack[newStack.length - 1].diagram = updatedDiagram
    setDiagramStack(newStack)
  }

  const createChildDiagramForNode = (node: DiagramNode) => {
    const linkedDiagramId = `diagram-${node.id}-child`
    const childDiagram: Diagram = {
      id: linkedDiagramId,
      name: node.title,
      parentId: currentDiagram.id,
      parentNodeId: node.id,
      nodes: [],
      connectors: []
    }

    const updatedDiagram = {
      ...currentDiagram,
      nodes: currentDiagram.nodes.map(n =>
        n.id === node.id ? { ...n, linkedDiagramId } : n
      )
    }

    const newDiagrams = new Map(diagrams)
    newDiagrams.set(currentDiagram.id, updatedDiagram)
    newDiagrams.set(linkedDiagramId, childDiagram)
    setDiagrams(newDiagrams)

    const newStack = [...diagramStack]
    newStack[newStack.length - 1].diagram = updatedDiagram
    newStack.push({
      diagram: childDiagram,
      parentNodeId: node.id,
      parentNodeTitle: node.title
    })
    setDiagramStack(newStack)
    setSelection({ type: null })
  }

  const handleDoubleClickNode = (node: DiagramNode) => {
    // Create child diagram if it doesn't exist
    let linkedDiagramId = node.linkedDiagramId ?? node.childDiagramId
    if (!linkedDiagramId) {
      createChildDiagramForNode(node)
      return
    }

    // Navigate to child diagram
    const childDiagram = diagrams.get(linkedDiagramId)
    if (childDiagram) {
      setDiagramStack([
        ...diagramStack,
        {
          diagram: childDiagram,
          parentNodeId: node.id,
          parentNodeTitle: node.title
        }
      ])
      setSelection({ type: null })
    }
  }

  const handleOpenDiagram = (diagramId: string) => {
    const diagram = diagrams.get(diagramId)
    if (!diagram) return

    const parentNode = currentDiagram.nodes.find(node => node.linkedDiagramId === diagramId)

    setDiagramStack([
      ...diagramStack,
      {
        diagram,
        parentNodeId: parentNode?.id ?? diagram.parentNodeId,
        parentNodeTitle: parentNode?.title ?? diagram.name
      }
    ])
    setSelection({ type: null })
  }

  const handleCreateChildDiagram = (nodeId: string) => {
    const node = currentDiagram.nodes.find(n => n.id === nodeId)
    if (!node || node.linkedDiagramId) return

    createChildDiagramForNode(node)
  }

  const handleDeleteNode = (nodeId: string) => {
    const updatedDiagram = {
      ...currentDiagram,
      nodes: currentDiagram.nodes.filter(node => node.id !== nodeId),
      connectors: currentDiagram.connectors.filter(
        connector => connector.sourceId !== nodeId && connector.targetId !== nodeId
      )
    }

    const newDiagrams = new Map(diagrams)
    newDiagrams.set(currentDiagram.id, updatedDiagram)
    setDiagrams(newDiagrams)

    const newStack = [...diagramStack]
    newStack[newStack.length - 1].diagram = updatedDiagram
    setDiagramStack(newStack)
    setSelection({ type: null })
  }

  const handleDeleteConnector = (connectorId: string) => {
    const updatedDiagram = {
      ...currentDiagram,
      connectors: currentDiagram.connectors.filter(connector => connector.id !== connectorId)
    }

    const newDiagrams = new Map(diagrams)
    newDiagrams.set(currentDiagram.id, updatedDiagram)
    setDiagrams(newDiagrams)

    const newStack = [...diagramStack]
    newStack[newStack.length - 1].diagram = updatedDiagram
    setDiagramStack(newStack)
    setSelection({ type: null })
  }

  const handleAddConnector = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return

    const newConnector = {
      id: `conn-${Date.now()}`,
      sourceId,
      targetId,
      type: 'related_to' as const,
      label: 'Related to',
      status: 'inferred' as const
    }

    const updatedDiagram = {
      ...currentDiagram,
      connectors: [...currentDiagram.connectors, newConnector]
    }

    const newDiagrams = new Map(diagrams)
    newDiagrams.set(currentDiagram.id, updatedDiagram)
    setDiagrams(newDiagrams)

    const newStack = [...diagramStack]
    newStack[newStack.length - 1].diagram = updatedDiagram
    setDiagramStack(newStack)
    setSelection({ type: 'connector', id: newConnector.id })
  }

  const handleGenerateDiagram = () => {
    const input = quickCreateText.trim()
    if (!input) return

    const result = generateDiagramFromText(input)
    const existingBottom = currentDiagram.nodes.reduce(
      (maxY, node) => Math.max(maxY, node.position.y + (node.height ?? 120)),
      0
    )
    const generatedTop = result.nodes.reduce(
      (minY, node) => Math.min(minY, node.position.y),
      Number.POSITIVE_INFINITY
    )
    const yOffset = existingBottom > 0 ? existingBottom + 160 - generatedTop : 0
    const generatedNodes = result.nodes.map(node => ({
      ...node,
      position: {
        x: node.position.x,
        y: node.position.y + yOffset
      }
    }))
    const updatedDiagram = {
      ...currentDiagram,
      nodes: [...currentDiagram.nodes, ...generatedNodes],
      connectors: [...currentDiagram.connectors, ...result.connectors]
    }

    const newDiagrams = new Map(diagrams)
    newDiagrams.set(currentDiagram.id, updatedDiagram)
    setDiagrams(newDiagrams)

    const newStack = [...diagramStack]
    newStack[newStack.length - 1].diagram = updatedDiagram
    setDiagramStack(newStack)
    setSelection(generatedNodes[0] ? { type: 'node', id: generatedNodes[0].id } : { type: null })
    setQuickCreateText('')
  }

  const handleSelectDiagram = (diagramId: string) => {
    const diagram = diagrams.get(diagramId)
    if (!diagram) return

    setDiagramStack(buildDiagramStack(diagram, diagrams))
    setSelection({ type: null })
  }

  const buildDiagramStack = (diagram: Diagram, sourceDiagrams: Map<string, Diagram>) => {
    const path: DiagramStackItem[] = []
    let nextDiagram: Diagram | undefined = diagram

    while (nextDiagram) {
      const parent: Diagram | undefined = nextDiagram.parentId ? sourceDiagrams.get(nextDiagram.parentId) : undefined
      const parentNode = parent?.nodes.find(node => node.linkedDiagramId === nextDiagram?.id)

      path.unshift({
        diagram: nextDiagram,
        parentNodeId: parentNode?.id ?? nextDiagram.parentNodeId,
        parentNodeTitle: parentNode?.title
      })

      nextDiagram = parent
    }

    return path.length > 0 ? path : [{ diagram }]
  }

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

  const isPosition = (value: unknown) =>
    isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number'

  const isDiagramNode = (value: unknown): value is DiagramNode =>
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.title === 'string' &&
    isPosition(value.position) &&
    (value.width === undefined || typeof value.width === 'number') &&
    (value.height === undefined || typeof value.height === 'number') &&
    (value.name === undefined || typeof value.name === 'string') &&
    (value.layer === undefined || typeof value.layer === 'string') &&
    (value.bpmnType === undefined || typeof value.bpmnType === 'string') &&
    (value.category === undefined || typeof value.category === 'string') &&
    (value.source === undefined || typeof value.source === 'string') &&
    (value.linkedDiagramId === undefined || typeof value.linkedDiagramId === 'string')

  const isDiagramConnector = (value: unknown) =>
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.sourceId === 'string' &&
    typeof value.targetId === 'string' &&
    typeof value.type === 'string' &&
    (value.label === undefined || typeof value.label === 'string')

  const isDiagram = (value: unknown): value is Diagram =>
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.parentId === undefined || typeof value.parentId === 'string') &&
    (value.parentNodeId === undefined || typeof value.parentNodeId === 'string') &&
    Array.isArray(value.nodes) &&
    value.nodes.every(isDiagramNode) &&
    Array.isArray(value.connectors) &&
    value.connectors.every(isDiagramConnector)

  const parseSavedProject = (value: unknown): SavedProject | null => {
    if (!isRecord(value)) return null
    if (value.projectSchemaVersion !== PROJECT_SCHEMA_VERSION) return null
    if (!isRecord(value.metadata)) return null
    if (
      typeof value.metadata.id !== 'string' ||
      typeof value.metadata.name !== 'string' ||
      typeof value.metadata.version !== 'string' ||
      typeof value.metadata.savedAt !== 'string'
    ) return null
    if (typeof value.currentDiagramId !== 'string') return null
    if (!Array.isArray(value.diagrams) || !value.diagrams.every(isDiagram)) return null
    if (!value.diagrams.some(diagram => diagram.id === value.currentDiagramId)) return null

    return {
      projectSchemaVersion: value.projectSchemaVersion,
      metadata: {
        id: value.metadata.id,
        name: value.metadata.name,
        version: value.metadata.version,
        savedAt: value.metadata.savedAt
      },
      currentDiagramId: value.currentDiagramId,
      diagrams: value.diagrams
    }
  }

  const handleSaveProject = () => {
    const project: SavedProject = {
      projectSchemaVersion: PROJECT_SCHEMA_VERSION,
      metadata: {
        id: 'local-project',
        name: 'Architecture Studio Project',
        version: '0.1.0',
        savedAt: new Date().toISOString()
      },
      currentDiagramId: currentDiagram.id,
      diagrams: Array.from(diagrams.values())
    }
    const json = JSON.stringify(project, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

    link.href = url
    link.download = `architecture-studio-project-${timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setProjectMessage('Project saved as JSON.')
  }

  const handleLoadProjectClick = () => {
    fileInputRef.current?.click()
  }

  const handleLoadProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const parsed = parseSavedProject(JSON.parse(text))

      if (!parsed) {
        setProjectMessage('Could not load project. Choose a valid Architecture Studio JSON file.')
        return
      }

      const loadedDiagrams = new Map(parsed.diagrams.map(diagram => [diagram.id, diagram]))
      const loadedCurrentDiagram = loadedDiagrams.get(parsed.currentDiagramId)
      if (!loadedCurrentDiagram) {
        setProjectMessage('Could not load project. The saved current diagram is missing.')
        return
      }

      setDiagrams(loadedDiagrams)
      setDiagramStack(buildDiagramStack(loadedCurrentDiagram, loadedDiagrams))
      setSelection({ type: null })
      setProjectMessage(`Loaded ${parsed.metadata.name}.`)
    } catch {
      setProjectMessage('Could not load project. The selected file is not valid JSON.')
    }
  }

  const handleGoBack = () => {
    if (canGoBack) {
      setDiagramStack(diagramStack.slice(0, -1))
      setSelection({ type: null })
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        currentDiagramName={currentDiagram.name}
        parentDiagramName={parentDiagram?.name ?? currentDiagramItem.parentNodeTitle}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        onOpenAiInput={() => setIsAiInputOpen(true)}
        onAnalyzeProcess={handleAnalyzeProcess}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProjectClick}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleLoadProject}
      />
      {projectMessage && (
        <div className="border-b border-blue-100 bg-blue-50 px-6 py-2 text-sm text-blue-800">
          <span>{projectMessage}</span>
          <button
            onClick={() => setProjectMessage(null)}
            className="ml-3 font-medium text-blue-700 hover:text-blue-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Diagram navigation and component library */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <DiagramExplorer
            diagrams={Array.from(diagrams.values())}
            currentDiagramId={currentDiagram.id}
            onSelectDiagram={handleSelectDiagram}
            className="w-full h-56 border-b border-gray-200"
          />
          <ComponentLibrary
            onAddNode={handleAddNode}
            className="w-full flex-1 min-h-0"
          />
        </div>

        {/* Center: Diagram Canvas */}
        <DiagramCanvas
          nodes={currentDiagram.nodes}
          connectors={currentDiagram.connectors}
          selection={selection}
          onSelectNode={handleSelectNode}
          onSelectConnector={handleSelectConnector}
          onCanvasClick={handleCanvasClick}
          onUpdateNodePosition={handleUpdateNodePosition}
          onUpdateNodeSize={handleUpdateNodeSize}
          onDoubleClickNode={handleDoubleClickNode}
          onAddNode={handleAddNode}
          onOpenDiagram={handleOpenDiagram}
          onCreateChildDiagram={handleCreateChildDiagram}
          onDeleteNode={handleDeleteNode}
          onDeleteConnector={handleDeleteConnector}
          onAddConnector={handleAddConnector}
          isQuickCreateOpen={isAiInputOpen}
          quickCreateText={quickCreateText}
          onOpenQuickCreate={() => setIsAiInputOpen(true)}
          onCloseQuickCreate={() => setIsAiInputOpen(false)}
          onQuickCreateTextChange={setQuickCreateText}
          onGenerateDiagram={handleGenerateDiagram}
          highlightedNodeIds={highlightedAnalysisNodeIds}
          issueNodeIds={issueNodeIds}
        />

        {/* Right: Inspector */}
        <Inspector
          selection={selection}
          nodes={currentDiagram.nodes}
          connectors={currentDiagram.connectors}
          onClearSelection={() => setSelection({ type: null })}
          onOpenDiagram={handleOpenDiagram}
          onCreateChildDiagram={handleCreateChildDiagram}
          analysisResults={analysisResults}
          onSelectAnalysisResult={handleSelectAnalysisResult}
        />
      </div>
    </div>
  )
}
