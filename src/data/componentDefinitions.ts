import { DiagramNode } from '../types'

export interface ComponentDefinition {
  type: string
  label: string
  layer: string
  description: string
  bpmnType?: string
  category?: string
}

export interface ComponentGroup {
  layer: string
  components: ComponentDefinition[]
}

const defineComponents = (layer: string, prefix: string, labels: string[]): ComponentGroup => ({
  layer,
  components: labels.map(label => ({
    type: `togaf_${prefix}_${label.toLowerCase().replace(/\s*\/\s*/g, '_').replace(/\s+/g, '_')}`,
    label,
    layer,
    description: `${label} element in the ${layer} layer.`
  }))
})

const toTypeSlug = (label: string) =>
  label.toLowerCase().replace(/\s*\/\s*/g, '_').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

const defineBpmnComponents = (category: string, labels: string[]): ComponentGroup => ({
  layer: category,
  components: labels.map(label => ({
    type: `bpmn_${toTypeSlug(label)}`,
    label,
    layer: 'BPMN / Process Engineering',
    category,
    bpmnType: label,
    description: `${label} BPMN component in the ${category} category.`
  }))
})

export const TOGAF_COMPONENT_GROUPS: ComponentGroup[] = [
  defineComponents('Business Architecture', 'business', [
    'Mission',
    'Vision',
    'Goal',
    'Objective',
    'Capability',
    'Value Stream',
    'Value Chain',
    'Business Process',
    'Actor',
    'Role',
    'Organization Unit'
  ]),
  defineComponents('Data Architecture', 'data', [
    'Data Entity',
    'Data Object',
    'Data Store',
    'Data Flow',
    'Information Concept'
  ]),
  defineComponents('Application Architecture', 'application', [
    'Application Component',
    'Application Service',
    'Interface',
    'API',
    'Integration',
    'Event',
    'Workflow'
  ]),
  defineComponents('Technology Architecture', 'technology', [
    'Technology Component',
    'Node',
    'Server',
    'Network',
    'Cloud Service',
    'Device',
    'Deployment Unit'
  ]),
  defineComponents('Motivation / Strategy', 'motivation', [
    'Driver',
    'Requirement',
    'Constraint',
    'Principle',
    'Gap',
    'Risk',
    'Recommendation',
    'Solution Option'
  ]),
  defineComponents('Governance', 'governance', [
    'Policy',
    'Standard',
    'Control',
    'Decision',
    'Evidence',
    'Compliance Check'
  ])
]

export const TOGAF_COMPONENT_DEFINITIONS: Record<string, ComponentDefinition> =
  TOGAF_COMPONENT_GROUPS.flatMap(group => group.components).reduce<Record<string, ComponentDefinition>>(
    (definitions, component) => {
      definitions[component.type] = component
      return definitions
    },
    {}
  )

export const TOGAF_COMPONENT_TYPES = Object.keys(TOGAF_COMPONENT_DEFINITIONS)

export const BPMN_COMPONENT_GROUPS: ComponentGroup[] = [
  defineBpmnComponents('Events', [
    'Start Event',
    'Intermediate Event',
    'End Event',
    'Timer Event',
    'Message Event',
    'Error Event',
    'Signal Event',
    'Conditional Event'
  ]),
  defineBpmnComponents('Activities', [
    'Task',
    'User Task',
    'Service Task',
    'Manual Task',
    'Script Task',
    'Business Rule Task',
    'Subprocess',
    'Collapsed Subprocess',
    'Call Activity'
  ]),
  defineBpmnComponents('Gateways', [
    'Exclusive Gateway (X)',
    'Parallel Gateway (+)',
    'Inclusive Gateway (O)',
    'Event-Based Gateway'
  ]),
  defineBpmnComponents('Flow Objects', [
    'Sequence Flow',
    'Message Flow',
    'Association',
    'Data Association'
  ]),
  defineBpmnComponents('Data', [
    'Data Object',
    'Data Store',
    'Data Input',
    'Data Output'
  ]),
  defineBpmnComponents('Swimlanes', [
    'Pool',
    'Lane'
  ]),
  defineBpmnComponents('Artifacts', [
    'Group',
    'Text Annotation'
  ])
]

export const BPMN_COMPONENT_DEFINITIONS: Record<string, ComponentDefinition> =
  BPMN_COMPONENT_GROUPS.flatMap(group => group.components).reduce<Record<string, ComponentDefinition>>(
    (definitions, component) => {
      definitions[component.type] = component
      return definitions
    },
    {}
  )

export const BPMN_COMPONENT_TYPES = Object.keys(BPMN_COMPONENT_DEFINITIONS)

export const getComponentDefinition = (type: string) =>
  TOGAF_COMPONENT_DEFINITIONS[type] ?? BPMN_COMPONENT_DEFINITIONS[type]

export const createComponentMetadata = (type: string): Partial<DiagramNode> => {
  const definition = getComponentDefinition(type)
  if (!definition) return {}

  if (definition.bpmnType && definition.category) {
    const isSwimlane = definition.category === 'Swimlanes'

    return {
      name: definition.label,
      layer: definition.layer,
      bpmnType: definition.bpmnType,
      category: definition.category,
      title: definition.label,
      description: definition.description,
      width: isSwimlane ? 360 : 180,
      height: isSwimlane ? 180 : 120,
      properties: {
        framework: 'BPMN / Process Engineering',
        category: definition.category,
        bpmn_type: definition.bpmnType
      },
      evidence: ['Component library'],
      source: 'Component library'
    }
  }

  return {
    name: definition.label,
    layer: definition.layer,
    title: definition.label,
    description: definition.description,
    properties: {
      layer: definition.layer,
      component_type: definition.label,
      framework: 'TOGAF / Enterprise Architecture'
    },
    evidence: ['Component library'],
    source: 'Component library'
  }
}
