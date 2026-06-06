import { Package, Eye, Link2, Zap, AlertTriangle, Wrench, Target, Lightbulb, Database } from 'lucide-react'

export function getNodeIcon(type: string) {
  const iconClass = 'w-5 h-5'

  switch (type) {
    case 'mission':
      return <Target className={iconClass} />
    case 'vision':
      return <Eye className={iconClass} />
    case 'process':
      return <Zap className={iconClass} />
    case 'system':
      return <Package className={iconClass} />
    case 'data_store':
      return <Database className={iconClass} />
    case 'bottleneck':
      return <AlertTriangle className={iconClass} />
    case 'gap':
      return <Wrench className={iconClass} />
    case 'solution':
      return <Lightbulb className={iconClass} />
    default:
      return <Link2 className={iconClass} />
  }
}

export function getNodeColor(type: string): { bg: string; border: string; text: string } {
  switch (type) {
    case 'mission':
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
    case 'vision':
      return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
    case 'process':
      return { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' }
    case 'system':
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' }
    case 'data_store':
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' }
    case 'bottleneck':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }
    case 'gap':
      return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' }
    case 'solution':
      return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' }
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
  }
}

export function getConnectorStyle(type: string): string {
  switch (type) {
    case 'related_to':
      return 'stroke-gray-400 stroke-dasharray-4'
    case 'uses':
      return 'stroke-blue-500'
    case 'depends_on':
      return 'stroke-red-500'
    case 'supports':
      return 'stroke-green-500'
    case 'contains':
      return 'stroke-purple-500'
    case 'impacts':
      return 'stroke-orange-500'
    default:
      return 'stroke-gray-400'
  }
}

export function getStatusBadgeColor(status?: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'extracted':
      return 'bg-blue-100 text-blue-800'
    case 'inferred':
      return 'bg-purple-100 text-purple-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
