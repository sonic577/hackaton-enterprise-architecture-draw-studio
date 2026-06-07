import { Pointer, Link2, Grid3x3, Zap, Presentation, ChevronLeft, Save, Upload, SearchCheck } from 'lucide-react'

interface ToolbarProps {
  activeTool?: string
  onToolChange?: (tool: string) => void
  currentDiagramName?: string
  parentDiagramName?: string
  currentNodeTitle?: string
  canGoBack?: boolean
  onGoBack?: () => void
  onOpenAiInput?: () => void
  onAnalyzeProcess?: () => void
  onSaveProject?: () => void
  onLoadProject?: () => void
}

export default function Toolbar({ 
  activeTool = 'select', 
  onToolChange,
  currentDiagramName = 'Customer Onboarding',
  parentDiagramName,
  currentNodeTitle,
  canGoBack = false,
  onGoBack,
  onOpenAiInput,
  onAnalyzeProcess,
  onSaveProject,
  onLoadProject
}: ToolbarProps) {
  const tools = [
    { id: 'select', label: 'Select', icon: Pointer },
    { id: 'connect', label: 'Connect', icon: Link2 },
    { id: 'organize', label: 'Organize', icon: Grid3x3 },
    { id: 'ai', label: 'Quick Capture', icon: Zap },
    { id: 'present', label: 'Present', icon: Presentation },
  ]

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
      {/* Left: Logo and project name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">◆</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900">Architecture Studio</h1>
          <p className="text-xs text-gray-500">
            {canGoBack ? (
              <span className="flex items-center gap-1">
                <button
                  onClick={onGoBack}
                  className="hover:text-blue-600 transition-colors flex items-center gap-1"
                  title="Go back"
                >
                  <ChevronLeft size={14} />
                </button>
                {parentDiagramName && <span>{parentDiagramName} /</span>}
                <span className="font-medium text-gray-700">{currentDiagramName}</span>
              </span>
            ) : (
              currentDiagramName || currentNodeTitle
            )}
          </p>
        </div>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {tools.map(tool => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                onClick={() => {
                  onToolChange?.(tool.id)
                  if (tool.id === 'ai') onOpenAiInput?.()
                }}
                title={tool.label}
                className={`p-2 rounded transition-colors ${
                  activeTool === tool.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          })}
        </div>
        <button
          onClick={onAnalyzeProcess}
          className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 transition-colors hover:border-amber-300 hover:bg-amber-100"
          title="Analyze the current diagram to detect bottlenecks, gaps, risks, and recommendations."
        >
          <SearchCheck className="h-4 w-4" />
          Analyze Process
        </button>
      </div>

      {/* Right: Project actions */}
      <div className="flex w-32 justify-end gap-1">
        <button
          onClick={onSaveProject}
          className="p-2 text-gray-600 transition-colors hover:text-gray-900"
          title="Save Project"
        >
          <Save className="h-5 w-5" />
        </button>
        <button
          onClick={onLoadProject}
          className="p-2 text-gray-600 transition-colors hover:text-gray-900"
          title="Load Project"
        >
          <Upload className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
