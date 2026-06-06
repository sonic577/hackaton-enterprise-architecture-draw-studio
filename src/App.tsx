import { useState } from 'react'
import Toolbar from './components/Layout/Toolbar'
import ComponentLibrary from './components/Layout/ComponentLibrary'
import DiagramCanvas from './components/Layout/DiagramCanvas'
import Inspector from './components/Layout/Inspector'
import { rootDiagram } from './data/mockData'
import { Selection, Diagram, DiagramNode } from './types'

interface DiagramStackItem {
  diagram: Diagram
  parentNodeId?: string
  parentNodeTitle?: string
}

export default function App() {
  // Map of all diagrams by ID
  const [diagrams, setDiagrams] = useState<Map<string, Diagram>>(() => {
    const map = new Map()
    map.set('diagram-root', rootDiagram)
    return map
  })

  // Stack of opened diagrams for navigation
  const [diagramStack, setDiagramStack] = useState<DiagramStackItem[]>([
    { diagram: rootDiagram }
  ])

  const currentDiagramItem = diagramStack[diagramStack.length - 1]
  const currentDiagram = currentDiagramItem.diagram
  const canGoBack = diagramStack.length > 1

  // Selection state
  const [selection, setSelection] = useState<Selection>({ type: null })
  const [activeTool, setActiveTool] = useState('select')

  const handleSelectNode = (nodeId: string) => {
    setSelection({ type: 'node', id: nodeId })
  }

  const handleSelectConnector = (connectorId: string) => {
    setSelection({ type: 'connector', id: connectorId })
  }

  const handleCanvasClick = () => {
    setSelection({ type: null })
  }

  const handleAddNode = (type: string) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      title: 'New ' + type,
      description: 'Double-click to edit',
      position: { x: 400, y: 300 },
      status: 'extracted' as const,
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

  const handleDoubleClickNode = (node: DiagramNode) => {
    // Create child diagram if it doesn't exist
    let childDiagramId = node.childDiagramId
    if (!childDiagramId) {
      // Generate new ID for child diagram
      childDiagramId = `diagram-${node.id}-child`
      
      // Create empty child diagram
      const childDiagram: Diagram = {
        id: childDiagramId,
        parentNodeId: node.id,
        nodes: [],
        connectors: []
      }

      // Save it
      const newDiagrams = new Map(diagrams)
      newDiagrams.set(childDiagramId, childDiagram)
      setDiagrams(newDiagrams)

      // Update parent node to reference the child diagram
      const updatedDiagram = {
        ...currentDiagram,
        nodes: currentDiagram.nodes.map(n =>
          n.id === node.id ? { ...n, childDiagramId } : n
        )
      }
      newDiagrams.set(currentDiagram.id, updatedDiagram)
      setDiagrams(newDiagrams)
    }

    // Navigate to child diagram
    const childDiagram = diagrams.get(childDiagramId)
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
        currentNodeTitle={currentDiagramItem.parentNodeTitle}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component Library */}
        <ComponentLibrary onAddNode={handleAddNode} />

        {/* Center: Diagram Canvas */}
        <DiagramCanvas
          nodes={currentDiagram.nodes}
          connectors={currentDiagram.connectors}
          selection={selection}
          onSelectNode={handleSelectNode}
          onSelectConnector={handleSelectConnector}
          onCanvasClick={handleCanvasClick}
          onUpdateNodePosition={handleUpdateNodePosition}
          onDoubleClickNode={handleDoubleClickNode}
        />

        {/* Right: Inspector */}
        <Inspector
          selection={selection}
          nodes={currentDiagram.nodes}
          connectors={currentDiagram.connectors}
          onClearSelection={() => setSelection({ type: null })}
        />
      </div>
    </div>
  )
}
