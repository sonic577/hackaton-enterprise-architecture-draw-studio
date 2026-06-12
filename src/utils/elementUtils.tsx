export const MATERIAL_ICON_BY_TYPE: Record<string, string> = {
  mission: 'flag',
  vision: 'visibility',
  process: 'schema',
  system: 'apps',
  data_store: 'storage',
  bottleneck: 'speed',
  gap: 'warning',
  risk: 'report',
  solution: 'extension',
  recommendation: 'tips_and_updates',

  togaf_business_mission: 'flag',
  togaf_business_vision: 'visibility',
  togaf_business_goal: 'track_changes',
  togaf_business_objective: 'radio_button_checked',
  togaf_business_capability: 'psychology',
  togaf_business_value_stream: 'timeline',
  togaf_business_value_chain: 'account_tree',
  togaf_business_business_process: 'schema',
  togaf_business_actor: 'person',
  togaf_business_role: 'badge',
  togaf_business_organization_unit: 'corporate_fare',

  togaf_data_data_entity: 'database',
  togaf_data_data_object: 'dataset',
  togaf_data_data_store: 'storage',
  togaf_data_data_flow: 'sync_alt',
  togaf_data_information_concept: 'hub',

  togaf_application_application_component: 'apps',
  togaf_application_application_service: 'api',
  togaf_application_interface: 'integration_instructions',
  togaf_application_api: 'api',
  togaf_application_integration: 'cable',
  togaf_application_event: 'bolt',
  togaf_application_workflow: 'alt_route',

  togaf_technology_technology_component: 'memory',
  togaf_technology_node: 'dns',
  togaf_technology_server: 'developer_board',
  togaf_technology_network: 'lan',
  togaf_technology_cloud_service: 'cloud',
  togaf_technology_device: 'devices',
  togaf_technology_deployment_unit: 'deployed_code',

  togaf_motivation_driver: 'explore',
  togaf_motivation_requirement: 'rule',
  togaf_motivation_constraint: 'block',
  togaf_motivation_principle: 'gavel',
  togaf_motivation_gap: 'warning',
  togaf_motivation_risk: 'report',
  togaf_motivation_recommendation: 'tips_and_updates',
  togaf_motivation_solution_option: 'extension',

  togaf_governance_policy: 'policy',
  togaf_governance_standard: 'verified',
  togaf_governance_control: 'security',
  togaf_governance_decision: 'fork_right',
  togaf_governance_evidence: 'fact_check',
  togaf_governance_compliance_check: 'check_circle',

  bpmn_start_event: 'play_circle',
  bpmn_intermediate_event: 'radio_button_checked',
  bpmn_end_event: 'stop_circle',
  bpmn_timer_event: 'timer',
  bpmn_message_event: 'mail',
  bpmn_error_event: 'error',
  bpmn_signal_event: 'cell_tower',
  bpmn_conditional_event: 'rule',
  bpmn_task: 'check_box',
  bpmn_user_task: 'person_check',
  bpmn_service_task: 'settings',
  bpmn_manual_task: 'pan_tool',
  bpmn_script_task: 'code',
  bpmn_business_rule_task: 'rule',
  bpmn_subprocess: 'account_tree',
  bpmn_collapsed_subprocess: 'account_tree',
  bpmn_call_activity: 'call_split',
  bpmn_exclusive_gateway_x: 'close',
  bpmn_parallel_gateway: 'add',
  bpmn_inclusive_gateway_o: 'radio_button_unchecked',
  bpmn_event_based_gateway: 'hub',
  bpmn_sequence_flow: 'arrow_forward',
  bpmn_message_flow: 'send',
  bpmn_association: 'link',
  bpmn_data_association: 'sync_alt',
  bpmn_data_object: 'description',
  bpmn_data_store: 'database',
  bpmn_data_input: 'input',
  bpmn_data_output: 'output',
  bpmn_pool: 'view_column',
  bpmn_lane: 'table_rows',
  bpmn_group: 'select_all',
  bpmn_text_annotation: 'notes',

  shape_rectangle: 'crop_16_9',
  shape_rounded_rectangle: 'rounded_corner',
  shape_ellipse: 'circle',
  shape_diamond: 'change_history',
  shape_hexagon: 'hexagon',
  shape_cylinder: 'database',
  shape_cloud: 'cloud',
  shape_document: 'description',
  shape_sticky_note: 'sticky_note_2',
  shape_text_label: 'title',
  shape_container: 'select_all'
}

export function getMaterialIconName(type: string) {
  if (MATERIAL_ICON_BY_TYPE[type]) return MATERIAL_ICON_BY_TYPE[type]
  if (type.startsWith('togaf_business_')) return 'business_center'
  if (type.startsWith('togaf_data_')) return 'database'
  if (type.startsWith('togaf_application_')) return 'apps'
  if (type.startsWith('togaf_technology_')) return 'memory'
  if (type.startsWith('togaf_motivation_')) return 'tips_and_updates'
  if (type.startsWith('togaf_governance_')) return 'policy'
  if (type.includes('gateway')) return 'account_tree'
  if (type.endsWith('_event')) return 'radio_button_checked'
  if (type.startsWith('bpmn_')) return 'schema'
  return 'hub'
}

export function getNodeIcon(type: string, className = 'text-[20px] leading-none') {
  return (
    <span className={`material-symbols-rounded select-none ${className}`} aria-hidden="true">
      {getMaterialIconName(type)}
    </span>
  )
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
