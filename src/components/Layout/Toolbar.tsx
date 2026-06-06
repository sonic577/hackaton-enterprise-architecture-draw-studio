import { Pointer, Link2, Grid3x3, Zap, Presentation, ChevronLeft } from 'lucide-react'

interface ToolbarProps {
  activeTool?: string
  onToolChange?: (tool: string) => void
  currentNodeTitle?: string
  canGoBack?: boolean
  onGoBack?: () => void
}

export default function Toolbar({ 
  activeTool = 'select', 
  onToolChange,
  currentNodeTitle,
  canGoBack = false,
  onGoBack
}: ToolbarProps) {
  const tools = [
    { id: 'select', label: 'Select', icon: Pointer },
    { id: 'connect', label: 'Connect', icon: Link2 },
    { id: 'organize', label: 'Organize', icon: Grid3x3 },
    { id: 'ai', label: 'AI Input', icon: Zap },
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
            {currentNodeTitle ? (
              <span className="flex items-center gap-1">
                {canGoBack && (
                  <button
                    onClick={onGoBack}
                    className="hover:text-blue-600 transition-colors flex items-center gap-1"
                    title="Go back"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                {currentNodeTitle}
              </span>
            ) : (
              'Customer Onboarding'
            )}
          </p>
        </div>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
        {tools.map(tool => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange?.(tool.id)}
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

      {/* Right: Empty for now */}
      <div className="w-32" />
    </div>
  )
}
