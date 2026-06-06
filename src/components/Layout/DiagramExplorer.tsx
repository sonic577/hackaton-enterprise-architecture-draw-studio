import React from 'react'
import { FileText, ChevronRight } from 'lucide-react'
import { Diagram } from '../../types'

interface DiagramExplorerProps {
  diagrams: Diagram[]
  currentDiagramId: string
  onSelectDiagram: (diagramId: string) => void
}

export const DiagramExplorer: React.FC<DiagramExplorerProps> = ({
  diagrams,
  currentDiagramId,
  onSelectDiagram
}) => {
  // Group diagrams by hierarchy (root diagrams and their children)
  const rootDiagrams = diagrams.filter(d => !d.parentId)
  const childrenByParent: Record<string, Diagram[]> = {}
  
  diagrams.forEach(d => {
    if (d.parentId) {
      if (!childrenByParent[d.parentId]) {
        childrenByParent[d.parentId] = []
      }
      childrenByParent[d.parentId].push(d)
    }
  })

  const DiagramNode: React.FC<{ diagram: Diagram; level: number }> = ({ diagram, level }) => {
    const hasChildren = (childrenByParent[diagram.id] || []).length > 0
    const isSelected = diagram.id === currentDiagramId
    
    return (
      <div key={diagram.id}>
        <button
          onClick={() => onSelectDiagram(diagram.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors ${
            isSelected
              ? 'bg-blue-100 border-l-4 border-blue-500 text-blue-900 font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          <FileText size={16} className="flex-shrink-0" />
          <span className="flex-1 truncate text-sm">{diagram.name}</span>
          {hasChildren && <ChevronRight size={16} className="flex-shrink-0 text-gray-400" />}
        </button>
        
        {hasChildren && (
          <div>
            {(childrenByParent[diagram.id] || []).map(child => (
              <DiagramNode key={child.id} diagram={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Diagrams</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {rootDiagrams.length === 0 ? (
          <div className="text-gray-500 text-sm p-4">No diagrams</div>
        ) : (
          rootDiagrams.map(diagram => (
            <DiagramNode key={diagram.id} diagram={diagram} level={0} />
          ))
        )}
      </div>
    </div>
  )
}
