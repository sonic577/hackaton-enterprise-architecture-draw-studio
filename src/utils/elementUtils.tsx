import {
  Package,
  Eye,
  Link2,
  Zap,
  AlertTriangle,
  Wrench,
  Target,
  Lightbulb,
  Database,
  Square,
  Circle,
  Diamond,
  Hexagon,
  Cloud,
  FileText,
  StickyNote,
  Type,
  Group
} from 'lucide-react'

export function getNodeIcon(type: string) {
  const iconClass = 'w-5 h-5'

  if (type.startsWith('togaf_business_')) return <Target className={iconClass} />
  if (type.startsWith('togaf_data_')) return <Database className={iconClass} />
  if (type.startsWith('togaf_application_')) return <Package className={iconClass} />
  if (type.startsWith('togaf_technology_')) return <Zap className={iconClass} />
  if (type.startsWith('togaf_motivation_')) return <Lightbulb className={iconClass} />
  if (type.startsWith('togaf_governance_')) return <Wrench className={iconClass} />
  if (type.startsWith('bpmn_start') || type.startsWith('bpmn_intermediate') || type.startsWith('bpmn_end') || type.endsWith('_event')) return <Circle className={iconClass} />
  if (type.includes('gateway')) return <Diamond className={iconClass} />
  if (type.includes('data_store')) return <Database className={iconClass} />
  if (type.includes('data_object') || type.includes('data_input') || type.includes('data_output')) return <FileText className={iconClass} />
  if (type === 'bpmn_pool' || type === 'bpmn_lane' || type === 'bpmn_group') return <Group className={iconClass} />
  if (type === 'bpmn_text_annotation') return <Type className={iconClass} />
  if (type.startsWith('bpmn_')) return <Square className={iconClass} />

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
    case 'risk':
      return <AlertTriangle className={iconClass} />
    case 'solution':
    case 'recommendation':
      return <Lightbulb className={iconClass} />
    case 'shape_rectangle':
    case 'shape_rounded_rectangle':
      return <Square className={iconClass} />
    case 'shape_ellipse':
      return <Circle className={iconClass} />
    case 'shape_diamond':
      return <Diamond className={iconClass} />
    case 'shape_hexagon':
      return <Hexagon className={iconClass} />
    case 'shape_cylinder':
      return <Database className={iconClass} />
    case 'shape_cloud':
      return <Cloud className={iconClass} />
    case 'shape_document':
      return <FileText className={iconClass} />
    case 'shape_sticky_note':
      return <StickyNote className={iconClass} />
    case 'shape_text_label':
      return <Type className={iconClass} />
    case 'shape_container':
      return <Group className={iconClass} />
    default:
      return <Link2 className={iconClass} />
  }
}

export function getNodeColor(type: string): { bg: string; border: string; text: string } {
  if (type.startsWith('togaf_business_')) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
  if (type.startsWith('togaf_data_')) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' }
  if (type.startsWith('togaf_application_')) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' }
  if (type.startsWith('togaf_technology_')) return { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700' }
  if (type.startsWith('togaf_motivation_')) return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' }
  if (type.startsWith('togaf_governance_')) return { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' }
  if (type.startsWith('bpmn_')) return { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' }

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
    case 'risk':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }
    case 'solution':
    case 'recommendation':
      return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' }
    case 'shape_sticky_note':
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' }
    case 'shape_text_label':
      return { bg: 'bg-white', border: 'border-transparent', text: 'text-gray-700' }
    case 'shape_container':
      return { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700' }
    case 'shape_rectangle':
    case 'shape_rounded_rectangle':
    case 'shape_ellipse':
    case 'shape_diamond':
    case 'shape_hexagon':
    case 'shape_cylinder':
    case 'shape_cloud':
    case 'shape_document':
      return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' }
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
  }
}

export function getElementIcon(type: string) {
  return getNodeIcon(type)
}

export function getElementColor(type: string): string {
  if (type.startsWith('togaf_business_')) return 'bg-blue-600'
  if (type.startsWith('togaf_data_')) return 'bg-orange-600'
  if (type.startsWith('togaf_application_')) return 'bg-emerald-600'
  if (type.startsWith('togaf_technology_')) return 'bg-slate-600'
  if (type.startsWith('togaf_motivation_')) return 'bg-indigo-600'
  if (type.startsWith('togaf_governance_')) return 'bg-violet-600'
  if (type.startsWith('bpmn_')) return 'bg-sky-600'

  switch (type) {
    case 'mission':
      return 'bg-blue-600'
    case 'vision':
      return 'bg-purple-600'
    case 'process':
      return 'bg-cyan-600'
    case 'system':
      return 'bg-green-600'
    case 'data_store':
      return 'bg-orange-600'
    case 'bottleneck':
      return 'bg-red-600'
    case 'gap':
      return 'bg-yellow-600'
    case 'risk':
      return 'bg-red-600'
    case 'solution':
    case 'recommendation':
      return 'bg-indigo-600'
    case 'shape_sticky_note':
      return 'bg-amber-600'
    case 'shape_container':
      return 'bg-slate-600'
    case 'shape_rectangle':
    case 'shape_rounded_rectangle':
    case 'shape_ellipse':
    case 'shape_diamond':
    case 'shape_hexagon':
    case 'shape_cylinder':
    case 'shape_cloud':
    case 'shape_document':
    case 'shape_text_label':
      return 'bg-gray-600'
    default:
      return 'bg-gray-600'
  }
}

export function getElementLabel(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
