import React, { useEffect, useMemo, useState } from 'react'
import { Diagram } from '../../types'

export type DiagramTreeItem =
  | {
      id: string
      kind: 'folder'
      name: string
      parentId?: string
      expanded: boolean
    }
  | {
      id: string
      kind: 'diagram'
      name: string
      diagramId: string
      diagramType?: string
      parentId?: string
      parentNodeId?: string
      linkedFromNodeId?: string
    }

interface DiagramExplorerProps {
  diagrams: Diagram[]
  treeItems: DiagramTreeItem[]
  currentDiagramId: string
  onSelectDiagram: (diagramId: string) => void
  onToggleFolder: (folderId: string) => void
  onAddFolder: (parentId?: string) => void
  onAddDiagram: (parentId?: string) => void
  onRenameItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onDuplicateDiagram: (itemId: string) => void
  className?: string
}

type ContextMenuState =
  | { type: 'folder'; itemId: string; x: number; y: number }
  | { type: 'diagram'; itemId: string; x: number; y: number }
  | { type: 'empty'; x: number; y: number }

const renderIcon = (icon: string, className = 'text-[16px]') => (
  <span className={`material-symbols-rounded leading-none ${className}`} aria-hidden="true">
    {icon}
  </span>
)

const getDiagramIcon = (diagram?: Diagram, treeItem?: DiagramTreeItem) => {
  const text = `${treeItem?.name ?? ''} ${treeItem?.kind === 'diagram' ? treeItem.diagramType ?? '' : ''} ${diagram?.name ?? ''} ${
    diagram?.nodes.map(node => `${node.type} ${node.title} ${node.bpmnType ?? ''} ${node.category ?? ''}`).join(' ') ?? ''
  }`.toLowerCase()

  if (text.includes('bpmn') || text.includes('gateway') || text.includes('start event')) return 'route'
  if (text.includes('mission')) return 'flag'
  if (text.includes('vision')) return 'visibility'
  if (text.includes('objective') || text.includes('goal')) return 'track_changes'
  if (text.includes('application') || text.includes('system')) return 'apps'
  if (text.includes('data') || text.includes('database')) return 'database'
  if (text.includes('technology') || text.includes('server')) return 'memory'
  if (text.includes('gap') || text.includes('risk')) return 'warning'
  if (text.includes('recommendation') || text.includes('solution')) return 'tips_and_updates'
  if (text.includes('process')) return 'schema'
  return 'description'
}

export const DiagramExplorer: React.FC<DiagramExplorerProps> = ({
  diagrams,
  treeItems,
  currentDiagramId,
  onSelectDiagram,
  onToggleFolder,
  onAddFolder,
  onAddDiagram,
  onRenameItem,
  onDeleteItem,
  onDuplicateDiagram,
  className = 'w-64 border-r border-gray-200'
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const diagramById = useMemo(() => new Map(diagrams.map(diagram => [diagram.id, diagram])), [diagrams])
  const childrenByParent = useMemo(() => {
    const map = new Map<string, DiagramTreeItem[]>()
    treeItems.forEach(item => {
      const parentKey = item.parentId ?? 'root'
      map.set(parentKey, [...(map.get(parentKey) ?? []), item])
    })
    return map
  }, [treeItems])

  useEffect(() => {
    if (!contextMenu) return

    const close = () => setContextMenu(null)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('click', close)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  const openContextMenu = (event: React.MouseEvent, nextMenu: ContextMenuState) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu(nextMenu)
  }

  const renderItem = (item: DiagramTreeItem, level: number) => {
    if (item.kind === 'folder') {
      const children = childrenByParent.get(item.id) ?? []

      return (
        <div key={item.id}>
          <button
            type="button"
            onClick={() => onToggleFolder(item.id)}
            onContextMenu={(event) => openContextMenu(event, { type: 'folder', itemId: item.id, x: event.clientX, y: event.clientY })}
            className="flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
            style={{ paddingLeft: `${8 + level * 14}px` }}
            title={item.name}
          >
            {renderIcon(item.expanded ? 'expand_more' : 'chevron_right', 'text-[18px] text-gray-400')}
            {renderIcon(item.expanded ? 'folder_open' : 'folder', 'text-[17px] text-gray-500')}
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
          </button>

          {item.expanded && children.map(child => renderItem(child, level + 1))}
        </div>
      )
    }

    const diagram = diagramById.get(item.diagramId)
    const isSelected = item.diagramId === currentDiagramId

    return (
      <button
        key={item.id}
        onClick={() => onSelectDiagram(item.diagramId)}
        onContextMenu={(event) => openContextMenu(event, { type: 'diagram', itemId: item.id, x: event.clientX, y: event.clientY })}
        className={`group flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors ${
          isSelected ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-200' : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${32 + level * 14}px` }}
        title={item.name}
      >
        <span className={isSelected ? 'text-blue-600' : 'text-gray-500'}>
          {renderIcon(getDiagramIcon(diagram, item))}
        </span>
        <span className="min-w-0 flex-1 truncate">{item.name}</span>
        {(item.parentNodeId || item.linkedFromNodeId) && (
          <span className="material-symbols-rounded text-[14px] text-gray-400" title="Nested diagram">
            subdirectory_arrow_right
          </span>
        )}
      </button>
    )
  }

  const menuButton = (label: string, onClick: () => void, danger = false) => (
    <button
      key={label}
      type="button"
      onClick={() => {
        onClick()
        setContextMenu(null)
      }}
      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  const renderContextMenu = () => {
    if (!contextMenu) return null

    const items =
      contextMenu.type === 'folder'
        ? [
            menuButton('Add folder', () => onAddFolder(contextMenu.itemId)),
            menuButton('Add diagram', () => onAddDiagram(contextMenu.itemId)),
            menuButton('Rename', () => onRenameItem(contextMenu.itemId)),
            menuButton('Delete', () => onDeleteItem(contextMenu.itemId), true)
          ]
        : contextMenu.type === 'diagram'
          ? [
              menuButton('Open', () => {
                const item = treeItems.find(candidate => candidate.id === contextMenu.itemId)
                if (item?.kind === 'diagram') onSelectDiagram(item.diagramId)
              }),
              menuButton('Rename', () => onRenameItem(contextMenu.itemId)),
              menuButton('Duplicate', () => onDuplicateDiagram(contextMenu.itemId)),
              menuButton('Delete', () => onDeleteItem(contextMenu.itemId), true)
            ]
          : [
              menuButton('Add root folder', () => onAddFolder()),
              menuButton('Add root diagram', () => onAddDiagram())
            ]

    return (
      <div
        className="fixed z-50 min-w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={(event) => event.stopPropagation()}
      >
        {items}
      </div>
    )
  }

  return (
    <div className={`${className} flex flex-col overflow-hidden bg-white`}>
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Diagrams</h2>
      </div>

      <div
        className="flex-1 overflow-y-auto p-2"
        onContextMenu={(event) => openContextMenu(event, { type: 'empty', x: event.clientX, y: event.clientY })}
      >
        {(childrenByParent.get('root') ?? []).length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Right-click to add a folder or diagram.</div>
        ) : (
          (childrenByParent.get('root') ?? []).map(item => renderItem(item, 0))
        )}
      </div>

      {renderContextMenu()}
    </div>
  )
}
