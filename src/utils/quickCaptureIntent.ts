import type { Diagram } from '../types'

interface QuickCaptureIntentNode {
  type: string
  name: string
  description: string
  layer: string
  status: 'extracted' | 'inferred'
  evidence: string
}

interface QuickCaptureIntentAction {
  action: 'create_node'
  node: QuickCaptureIntentNode
}

export interface QuickCaptureIntent {
  intent: 'create_node'
  confidence: number
  actions: QuickCaptureIntentAction[]
}

interface IntentMatch {
  type: string
  layer: string
  pattern: RegExp
}

interface ArchitectureNode {
  id: string
  name: string
  type: string
  description: string
  layer: string
  status: 'extracted' | 'inferred'
  evidence: string
  linkedDiagramId?: string
}

interface ObjectiveItem {
  name: string
  description: string
}

type QuickCaptureDomain =
  | 'motivation'
  | 'business'
  | 'process'
  | 'application'
  | 'data'
  | 'technology'
  | 'integration'
  | 'security'
  | 'risk'
  | 'recommendation'
  | 'note'

export interface DomainClassification {
  domain: QuickCaptureDomain
  nodeType: string
  subtype?: string
  name: string
  description: string
  layer: string
  status: 'extracted' | 'inferred'
  evidence: string
  confidence: number
}

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const truncate = (value: string, maxLength = 180) => {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trim()}...` : trimmed
}

const sentenceCase = (value: string) =>
  value.trim().replace(/\s+/g, ' ').replace(/^./, char => char.toUpperCase())

const explicitDomainAliases: Record<string, QuickCaptureDomain> = {
  motivacion: 'motivation',
  motivation: 'motivation',
  negocio: 'business',
  business: 'business',
  proceso: 'process',
  process: 'process',
  aplicacion: 'application',
  application: 'application',
  app: 'application',
  dato: 'data',
  datos: 'data',
  data: 'data',
  tecnologia: 'technology',
  technology: 'technology',
  infraestructura: 'technology',
  integracion: 'integration',
  integration: 'integration',
  seguridad: 'security',
  security: 'security',
  riesgo: 'risk',
  risk: 'risk',
  recomendacion: 'recommendation',
  recommendation: 'recommendation',
  nota: 'note',
  note: 'note'
}

const runtimeSignals = /\b(nodejs|node\.js|react|vite|python|fastapi|java|spring)\b/
const storageSignals = /\b(ssd|disco|almacenamiento|storage)\b/

const stripCommandAndDomain = (input: string) => {
  const withoutCommand = input.trim().replace(commandPattern, '')
  const explicit = withoutCommand.match(/^\s*([^:：]{2,40})\s*[:：]\s*(.+)$/)

  if (!explicit) {
    return {
      explicitDomain: undefined as QuickCaptureDomain | undefined,
      value: withoutCommand.trim()
    }
  }

  const domainKey = normalize(explicit[1]).trim()
  const explicitDomain = explicitDomainAliases[domainKey]
  return {
    explicitDomain,
    value: explicitDomain ? explicit[2].trim() : withoutCommand.trim()
  }
}

const classifyByDomain = (input: string, explicitDomain?: QuickCaptureDomain): Omit<DomainClassification, 'name' | 'description' | 'evidence'> | null => {
  const normalizedInput = normalize(input)
  const hasExplicitDomain = Boolean(explicitDomain)

  if (explicitDomain === 'technology' || runtimeSignals.test(normalizedInput) || storageSignals.test(normalizedInput) || /\b(tecnologia|infraestructura|servidor|red|cloud|network|device)\b/.test(normalizedInput)) {
    return {
      domain: 'technology',
      nodeType: 'Technology Component',
      subtype: runtimeSignals.test(normalizedInput)
        ? 'Runtime/Framework'
        : storageSignals.test(normalizedInput)
          ? 'Storage Device'
          : /\b(cloud)\b/.test(normalizedInput)
            ? 'Cloud Service'
            : undefined,
      layer: 'technology',
      status: 'extracted',
      confidence: hasExplicitDomain || runtimeSignals.test(normalizedInput) || storageSignals.test(normalizedInput) ? 0.96 : 0.88
    }
  }

  if (explicitDomain === 'data' || /\b(base de datos|database|db)\b/.test(normalizedInput)) {
    return {
      domain: 'data',
      nodeType: /\b(base de datos|database|db)\b/.test(normalizedInput) ? 'Data Store' : 'Data Entity',
      subtype: /\b(base de datos|database|db)\b/.test(normalizedInput) ? 'Database' : undefined,
      layer: 'data',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.9
    }
  }

  if (/\b(dato|datos|entidad|entity|cliente|pedido|producto|customer|order|product)\b/.test(normalizedInput)) {
    return {
      domain: 'data',
      nodeType: 'Data Entity',
      layer: 'data',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.88
    }
  }

  if (explicitDomain === 'application' || /\b(api)\b/.test(normalizedInput) || /\b(aplicacion|sistema|app|application|system)\b/.test(normalizedInput)) {
    return {
      domain: 'application',
      nodeType: /\b(api)\b/.test(normalizedInput)
        ? 'API'
        : /\b(servicio|service)\b/.test(normalizedInput)
          ? 'Application Service'
          : 'Application Component',
      layer: 'application',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.9
    }
  }

  if (explicitDomain === 'integration' || /\b(integracion|integration|evento|event|cola|queue|mensaje|message|workflow)\b/.test(normalizedInput)) {
    return {
      domain: 'integration',
      nodeType: /\b(api)\b/.test(normalizedInput)
        ? 'API'
        : /\b(evento|event)\b/.test(normalizedInput)
          ? 'Event'
          : /\b(cola|queue|mensaje|message)\b/.test(normalizedInput)
            ? 'Message Queue'
            : /\b(workflow)\b/.test(normalizedInput)
              ? 'Workflow'
              : 'Integration',
      layer: 'integration',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.9
    }
  }

  if (explicitDomain === 'security' || /\b(politica|policy|control|standard|estandar|cumplimiento|compliance)\b/.test(normalizedInput)) {
    return {
      domain: 'security',
      nodeType: /\b(control)\b/.test(normalizedInput)
        ? 'Control'
        : /\b(standard|estandar)\b/.test(normalizedInput)
          ? 'Standard'
          : /\b(compliance|cumplimiento)\b/.test(normalizedInput)
            ? 'Compliance Check'
            : 'Policy',
      layer: 'security',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.88
    }
  }

  if (explicitDomain === 'risk' || /\b(cuello de botella|bottleneck)\b/.test(normalizedInput) || /\b(gap|brecha|problema|problem|issue|pain point|riesgo|risk)\b/.test(normalizedInput)) {
    return {
      domain: 'risk',
      nodeType: /\b(cuello de botella|bottleneck)\b/.test(normalizedInput)
        ? 'Bottleneck'
        : /\b(riesgo|risk)\b/.test(normalizedInput)
          ? 'Risk'
          : /\b(issue)\b/.test(normalizedInput)
            ? 'Issue'
            : /\b(pain point)\b/.test(normalizedInput)
              ? 'Pain Point'
              : 'Gap',
      layer: 'risk',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.9
    }
  }

  if (explicitDomain === 'recommendation' || /\b(recomendacion|recommendation|solucion|solution|mejora|improvement|decision|accion|action)\b/.test(normalizedInput)) {
    return {
      domain: 'recommendation',
      nodeType: /\b(solucion|solution)\b/.test(normalizedInput)
        ? 'Solution Option'
        : /\b(decision)\b/.test(normalizedInput)
          ? 'Decision'
          : /\b(accion|action)\b/.test(normalizedInput)
            ? 'Action'
            : 'Recommendation',
      layer: 'recommendation',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.9
    }
  }

  if (explicitDomain === 'motivation' || /\b(mision|mission|vision|objetivo|objetivos|meta|metas|goal|goals|objective|objectives|okr|driver|requirement|requisito|constraint|restriccion)\b/.test(normalizedInput)) {
    return {
      domain: 'motivation',
      nodeType: /\b(mision|mission)\b/.test(normalizedInput)
        ? 'Mission'
        : /\b(vision)\b/.test(normalizedInput)
          ? 'Vision'
          : /\b(driver)\b/.test(normalizedInput)
            ? 'Driver'
            : /\b(requirement|requisito)\b/.test(normalizedInput)
              ? 'Requirement'
              : /\b(constraint|restriccion)\b/.test(normalizedInput)
                ? 'Constraint'
                : 'Objective',
      layer: 'motivation',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.92
    }
  }

  if (explicitDomain === 'business' || /\b(capacidad|capability|cadena de valor|value chain|value stream|actor|rol|role|area|unidad|unit|organization)\b/.test(normalizedInput)) {
    return {
      domain: 'business',
      nodeType: /\b(capacidad|capability)\b/.test(normalizedInput)
        ? 'Capability'
        : /\b(cadena de valor|value chain)\b/.test(normalizedInput)
          ? 'Value Chain'
          : /\b(value stream)\b/.test(normalizedInput)
            ? 'Value Stream'
            : /\b(rol|role)\b/.test(normalizedInput)
              ? 'Role'
              : /\b(area|unidad|unit|organization)\b/.test(normalizedInput)
                ? 'Organization Unit'
                : 'Actor',
      layer: 'business',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.88
    }
  }

  if (explicitDomain === 'process' || /\b(proceso|process|flujo|workflow)\b/.test(normalizedInput)) {
    return {
      domain: 'process',
      nodeType: 'Business Process',
      layer: 'process',
      status: 'extracted',
      confidence: hasExplicitDomain ? 0.96 : 0.88
    }
  }

  if (explicitDomain === 'note') {
    return {
      domain: 'note',
      nodeType: 'Note',
      layer: 'note',
      status: 'extracted',
      confidence: 0.96
    }
  }

  return null
}

export const classifyDomainAndNodeType = (input: string): DomainClassification => {
  const { explicitDomain, value } = stripCommandAndDomain(input)
  const source = value || input.trim()
  const classification = classifyByDomain(source, explicitDomain)

  if (!classification) {
    return {
      domain: 'note',
      nodeType: 'Note',
      name: truncate(source || 'Note', 70),
      description: source,
      layer: 'note',
      status: 'inferred',
      evidence: input,
      confidence: 0.25
    }
  }

  return {
    ...classification,
    name: sentenceCase(truncate(source || classification.nodeType, 70)),
    description: source || classification.nodeType,
    evidence: input
  }
}

const caseSignals = [
  'proceso actual',
  'cuando el cliente',
  'actualmente',
  'como resultado',
  'problema',
  'no existe',
  'riesgo',
  'fila',
  'espera',
  'current process',
  'when the customer',
  'currently',
  'as a result',
  'problem',
  'there is no',
  'risk',
  'queue',
  'wait'
]

export const isLongBusinessCaseInput = (input: string) => {
  const normalizedInput = normalize(input)
  return input.length > 500 || caseSignals.some(signal => normalizedInput.includes(signal))
}

export const isObjectivesInput = (input: string) => {
  const normalizedInput = normalize(input)
  return (
    /\b(objetivo|objetivos|meta|metas|goal|goals|objective|objectives|target|targets|okr|okrs)\b/.test(normalizedInput) ||
    /\bSO-\d{1,3}\b/i.test(input)
  )
}

const intentMatches: IntentMatch[] = [
  { type: 'Mission', layer: 'motivation', pattern: /\b(mision|misi.n|mission)\b/ },
  { type: 'Vision', layer: 'motivation', pattern: /\b(vision)\b/ },
  { type: 'Objective', layer: 'motivation', pattern: /\b(objetivo|objective)\b/ },
  { type: 'Goal', layer: 'motivation', pattern: /\b(meta|goal)\b/ },
  { type: 'Business Process', layer: 'business', pattern: /\b(proceso|process|flujo|workflow)\b/ },
  { type: 'Risk', layer: 'motivation', pattern: /\b(riesgo|risk)\b/ },
  { type: 'Gap', layer: 'motivation', pattern: /\b(gap|brecha|problema|problem|issue)\b/ },
  { type: 'Recommendation', layer: 'motivation', pattern: /\b(recomendacion|recommendation|mejora|improvement)\b/ },
  { type: 'Solution Option', layer: 'motivation', pattern: /\b(solucion|solution|solution option)\b/ }
]

const commandPattern = /^(agrega|agregar|crea|crear|anade|anadir|añade|añadir|add|create|make|generate)\s+(la|el|un|una|the|a|an)?\s*/i

const cleanName = (input: string, match: IntentMatch) => {
  const withoutCommand = input.trim().replace(commandPattern, '')
  const colonParts = withoutCommand.split(/[:：]/)

  if (colonParts.length > 1) {
    return colonParts.slice(1).join(':').trim()
  }

  const keywordMatch = normalize(withoutCommand).match(match.pattern)
  if (!keywordMatch || keywordMatch.index === undefined) {
    return withoutCommand.trim()
  }

  const afterKeyword = withoutCommand.slice(keywordMatch.index + keywordMatch[0].length)
  return afterKeyword
    .replace(/^\s*(de|del|para|about|as|como|que|to|for|is|es)\s+/i, '')
    .replace(/^\s*[:：-]\s*/, '')
    .trim()
}

const cleanObjectiveText = (value: string) =>
  value
    .trim()
    .replace(/^[\-*•]\s*/, '')
    .replace(/^\d+[\).]\s*/, '')
    .replace(/^(objetivo|objetivos|meta|metas|goal|goals|objective|objectives|target|targets|okr|okrs)\s*(\d{4})?\s*[:：-]\s*/i, '')
    .replace(/^\s*(de|del|para|about|to|for)\s+/i, '')
    .trim()

const parseCodedObjectiveItems = (input: string): ObjectiveItem[] => {
  const lines = input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
  const codedItems: ObjectiveItem[] = []
  let current: { name: string; descriptionLines: string[] } | null = null

  for (const line of lines) {
    const match = line.match(/^\s*(?:[-*•]\s*)?(SO-\d{1,3})\b\s*(?:[-—–:]\s*)?(.*)$/i)

    if (match) {
      if (current) {
        codedItems.push({
          name: current.name,
          description: current.descriptionLines.join('\n').trim()
        })
      }

      const code = match[1].toUpperCase()
      const title = match[2].trim().replace(/^[^\p{L}\p{N}]+/u, '')
      current = {
        name: title ? `${code} — ${title}` : code,
        descriptionLines: []
      }
      continue
    }

    if (current) {
      current.descriptionLines.push(line)
    }
  }

  if (current) {
    codedItems.push({
      name: current.name,
      description: current.descriptionLines.join('\n').trim()
    })
  }

  return codedItems
    .map(item => ({
      name: cleanObjectiveText(item.name),
      description: item.description.trim() || cleanObjectiveText(item.name)
    }))
    .filter(item => item.name.length > 0)
}

const splitObjectiveItems = (input: string): ObjectiveItem[] => {
  const codedItems = parseCodedObjectiveItems(input)
  if (codedItems.length > 0) return codedItems

  const afterHeader = input.includes(':') || input.includes('：')
    ? input.split(/[:：]/).slice(1).join(':')
    : input
  const hasLineList = /\n|^\s*[-*•]|\n\s*\d+[\).]/m.test(input)
  const source = isObjectivesInput(afterHeader) && !/\bSO-\d{1,3}\b/i.test(afterHeader)
    ? cleanObjectiveText(afterHeader)
    : afterHeader
  const chunks = hasLineList
    ? source.split(/\n+/)
    : source.split(/[,;]+/)
  const cleaned = chunks
    .map(cleanObjectiveText)
    .filter(item => item.length > 0)

  if (cleaned.length > 1) {
    return cleaned.map(item => ({
      name: item,
      description: item
    }))
  }

  return [cleanObjectiveText(input)]
    .filter(Boolean)
    .map(item => ({
      name: item,
      description: item
    }))
}

const generateObjectivesResponse = (input: string) => {
  const normalizedInput = normalize(input)
  const nodeType = /\b(meta|metas|goal|goals|target|targets)\b/.test(normalizedInput) ? 'Goal' : 'Objective'
  const items = splitObjectiveItems(input)

  return {
    nodes: items.map((item, index) => ({
      id: `objective-node-${index + 1}`,
      name: sentenceCase(truncate(item.name, 70)),
      type: nodeType,
      description: item.description,
      layer: 'motivation',
      status: 'extracted',
      evidence: input,
      x: 120 + (index % 3) * 260,
      y: 120 + Math.floor(index / 3) * 170
    })),
    connectors: [],
    diagrams: [],
    assumptions: [`Quick Capture interpreted this as objectives_view with ${items.length} objective${items.length === 1 ? '' : 's'}.`],
    gaps: [],
    risks: [],
    recommendations: []
  }
}

const generateDomainClassificationResponse = (input: string) => {
  const classification = classifyDomainAndNodeType(input)

  return {
    nodes: [{
      id: 'classified-node-1',
      name: classification.name,
      type: classification.nodeType,
      description: classification.description,
      layer: classification.layer,
      status: classification.status,
      evidence: classification.evidence,
      properties: {
        domain: classification.domain,
        ...(classification.subtype ? { subtype: classification.subtype } : {})
      },
      x: 120,
      y: 120
    }],
    connectors: [],
    diagrams: [],
    assumptions: [`Quick Capture classified this as ${classification.domain}/${classification.nodeType} with ${Math.round(classification.confidence * 100)}% confidence.`],
    gaps: [],
    risks: [],
    recommendations: []
  }
}

const explicitProcessListPattern = /\b(?:el proceso es|proceso|the process is|workflow|flujo)\s*[:：]\s*/i
const conditionalStepPattern = /\b(if needed|if available|if required|si aplica|si es necesario|si esta disponible|si está disponible|si se requiere)\b/i

const isExplicitProcessListInput = (input: string) => {
  if (!explicitProcessListPattern.test(input)) return false
  const afterHeader = input.split(explicitProcessListPattern).slice(1).join('').trim()
  const steps = extractExplicitProcessSteps(afterHeader)
  return steps.length >= 2
}

const extractExplicitProcessSteps = (input: string) =>
  input
    .split(/\r?\n|[;]+|(?:\s+->\s+)|(?:\s+→\s+)/)
    .map(step => step
      .trim()
      .replace(/^[\-*•]\s*/, '')
      .replace(/^\d+[\).]\s*/, '')
      .replace(/\s+/g, ' ')
    )
    .filter(step => step.length > 2)

const laneForStep = (step: string) => {
  const normalizedStep = normalize(step)
  if (/\b(customer|cliente)\b/.test(normalizedStep)) return 'Customer / Cliente'
  if (/\b(caja|pay|pays|payment|pos|sale|sales|venta|registered|registrar)\b/.test(normalizedStep)) return 'Sales / POS / Caja'
  if (/\b(inventory|inventario|fulfillment|bodega|entrega|delivered|delivery|product is delivered|availability|disponibilidad)\b/.test(normalizedStep)) return 'Inventory / Fulfillment / Bodega / Entrega'
  if (/\b(assistant|auxiliar|pharmacy assistant|farmacia|prescription|formula|fórmula|request|solicitud|validates|validar)\b/.test(normalizedStep)) return 'Pharmacy Assistant / Auxiliar de farmacia'
  return 'Pharmacy Assistant / Auxiliar de farmacia'
}

const cleanConditionalTaskName = (step: string) =>
  sentenceCase(step.replace(conditionalStepPattern, '').replace(/[.。]+$/, '').trim())

const gatewayNameForStep = (step: string) => {
  const normalizedStep = normalize(step)
  if (/\b(prescription|formula|fórmula)\b/.test(normalizedStep)) return 'Prescription validation needed?'
  if (/\b(available|disponible|availability|disponibilidad)\b/.test(normalizedStep)) return 'Item available?'
  return 'Condition applies?'
}

const generateExplicitProcessBpmnResponse = (input: string) => {
  const afterHeader = input.split(explicitProcessListPattern).slice(1).join('').trim()
  const steps = extractExplicitProcessSteps(afterHeader)
  const bpmnDiagramId = 'quick-process-bpmn'
  const lanes = Array.from(new Set(steps.map(laneForStep)))
  const laneNames = lanes.length > 0
    ? lanes
    : ['Customer / Cliente', 'Pharmacy Assistant / Auxiliar de farmacia']
  const laneY = (index: number) => 70 + index * 155
  const laneByName = new Map(laneNames.map((name, index) => [name, laneY(index)]))
  const yForStep = (step: string) => laneByName.get(laneForStep(step)) ?? laneY(0)
  const nodes: ArchitectureNode[] = []
  const connectors: Array<{
    id: string
    sourceId: string
    targetId: string
    relationshipType: string
    label: string
    description: string
  }> = []
  const connect = (sourceId: string, targetId: string, label = 'Sequence Flow') => {
    connectors.push({
      id: `explicit-bpmn-conn-${connectors.length + 1}`,
      sourceId,
      targetId,
      relationshipType: 'Flow',
      label,
      description: label
    })
  }

  laneNames.forEach((name, index) => {
    addBpmnNode(nodes, `lane-${index + 1}`, 'Lane', name, 60, laneY(index) - 38, 'Swimlanes', Math.max(980, 320 + steps.length * 230), 140, `${name} lane`)
  })

  addBpmnNode(nodes, 'start', 'Start Event', 'Start', 150, laneY(0), 'Events', 90, 90, input)
  let previousId = 'start'
  let pendingNoGatewayId: string | null = null
  let x = 340

  steps.forEach((step, index) => {
    const isConditional = conditionalStepPattern.test(step)
    const taskName = truncate(cleanConditionalTaskName(step), 48)
    const taskId = `task-${index + 1}`

    if (isConditional) {
      const gatewayId = `gateway-${index + 1}`
      addBpmnNode(nodes, gatewayId, 'Exclusive Gateway (X)', gatewayNameForStep(step), x, yForStep(step), 'Gateways', 120, 120, step)
      connect(previousId, gatewayId)
      if (pendingNoGatewayId) connect(pendingNoGatewayId, gatewayId, 'No')
      x += 210
      addBpmnNode(nodes, taskId, 'User Task', taskName, x, yForStep(step), 'Activities', 190, 110, step)
      connect(gatewayId, taskId, 'Yes')
      previousId = taskId
      pendingNoGatewayId = gatewayId
      x += 230
      return
    }

    addBpmnNode(nodes, taskId, 'User Task', taskName, x, yForStep(step), 'Activities', 190, 110, step)
    if (pendingNoGatewayId) {
      connect(pendingNoGatewayId, taskId, 'No')
      pendingNoGatewayId = null
    }
    connect(previousId, taskId)
    previousId = taskId
    x += 230
  })

  addBpmnNode(nodes, 'end', 'End Event', 'End', x, laneY(0), 'Events', 90, 90, input)
  if (pendingNoGatewayId) connect(pendingNoGatewayId, 'end', 'No')
  connect(previousId, 'end')

  return {
    nodes: [{
      id: 'current-process',
      name: 'Current Process',
      type: 'Business Process',
      description: 'Step-by-step process captured from Quick Capture. Open the nested BPMN diagram to view the operational flow.',
      layer: 'process',
      status: 'extracted',
      evidence: input,
      linkedDiagramId: bpmnDiagramId,
      x: 160,
      y: 150
    }],
    connectors: [],
    diagrams: [{
      id: bpmnDiagramId,
      name: 'Current Process BPMN',
      parentNodeId: 'current-process',
      nodes,
      connectors
    }],
    assumptions: [`Quick Capture detected an explicit process list and generated a BPMN view with ${steps.length} step${steps.length === 1 ? '' : 's'}.`],
    gaps: [],
    risks: [],
    recommendations: []
  }
}

const splitSentences = (input: string) =>
  input
    .split(/(?<=[.!?])\s+|\n+/)
    .map(sentence => sentence.trim())
    .filter(Boolean)

const findSentences = (sentences: string[], patterns: RegExp[], limit = 3) =>
  sentences.filter(sentence => {
    const normalizedSentence = normalize(sentence)
    return patterns.some(pattern => pattern.test(normalizedSentence))
  }).slice(0, limit)

const extractProcessSteps = (input: string, sentences: string[]) => {
  const processMatch = input.match(/\b(?:proceso actual|proceso|process|current process)\s*[:：-]\s*([^.!?\n]+)/i)
  const source = processMatch?.[1] ?? ''
  const explicitSteps = source
    .split(/,|;|->|→|\bthen\b|\bluego\b|\bdespues\b|\bdespués\b|\by\b/gi)
    .map(step => truncate(step, 42).replace(/^\s*(el|la|los|las|un|una|the|a|an)\s+/i, ''))
    .filter(step => step.length > 2)

  if (explicitSteps.length >= 2) return explicitSteps.slice(0, 6)

  const stepSentences = findSentences(sentences, [
    /\b(cliente|customer|usuario|user)\b/,
    /\b(recibe|receive|solicita|request|pide|order|valid|check|prepar|deliver|entrega|paga|pay|bill|factur)\b/
  ], 6)

  const detailedSteps = stepSentences
    .flatMap(sentence => sentence.split(/,|;|->|→|\bluego\b|\bthen\b|\bdespues\b|\bdespués\b|\band then\b|\by\s+(?=(?:el|la|los|las)?\s*(?:cliente|usuario|operador|farmaceutico|farmacéutico|sistema|prepara|factura|entrega|paga|verifica|revisa))/gi))
    .map(step => step
      .replace(/^(cuando|when|actualmente|currently|luego|then)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim()
    )
    .filter(step => step.length > 8)

  if (detailedSteps.length >= 3) {
    return detailedSteps.map(step => truncate(step, 42)).slice(0, 6)
  }

  return stepSentences
    .map((sentence, index) => {
      const cleaned = sentence
        .replace(/^(cuando|when|actualmente|currently|luego|then)\s+/i, '')
        .replace(/\s+/g, ' ')
      return truncate(cleaned, 42) || `Step ${index + 1}`
    })
    .slice(0, 6)
}

const addNode = (
  nodes: ArchitectureNode[],
  type: string,
  name: string,
  description: string,
  layer: string,
  evidence: string,
  status: 'extracted' | 'inferred' = 'extracted',
  linkedDiagramId?: string
) => {
  const node: ArchitectureNode = {
    id: `case-node-${nodes.length + 1}`,
    name: truncate(sentenceCase(name), 54),
    type,
    description: truncate(description),
    layer,
    status,
    evidence: truncate(evidence, 240),
    linkedDiagramId
  }
  nodes.push(node)
  return node
}

const addBpmnNode = (
  nodes: ArchitectureNode[],
  id: string,
  type: string,
  name: string,
  x: number,
  y: number,
  category: string,
  width = 180,
  height = 110,
  description = name
) => {
  nodes.push({
    id,
    name,
    type,
    description: truncate(description),
    layer: 'BPMN / Process Engineering',
    status: 'extracted',
    evidence: description,
    ...({ x, y, category, bpmnType: type, width, height } as any)
  })
}

const buildBpmnProcessView = (input: string) => {
  const isContosoPharmacy = /\b(contoso|farmacy|farmacia|medicamento|formula|fórmula)\b/i.test(input)
  const laneNames = isContosoPharmacy
    ? ['Cliente', 'Auxiliar de farmacia', 'Regente de farmacia', 'Caja', 'Inventario / sistema de ventas', 'Entrega / bodega']
    : ['Customer', 'Business team', 'System', 'Operations']
  const laneY = (index: number) => 70 + index * 160
  const laneByName = new Map(laneNames.map((name, index) => [name, laneY(index)]))
  const yFor = (lane: string) => laneByName.get(lane) ?? laneY(1)
  const nodes: ArchitectureNode[] = []
  const connectors: Array<{
    id: string
    sourceId: string
    targetId: string
    relationshipType: string
    label: string
    description: string
  }> = []
  const connect = (sourceId: string, targetId: string, label = 'Sequence Flow') => {
    connectors.push({
      id: `bpmn-conn-${connectors.length + 1}`,
      sourceId,
      targetId,
      relationshipType: 'Flow',
      label,
      description: label
    })
  }

  laneNames.forEach((name, index) => {
    addBpmnNode(nodes, `lane-${index + 1}`, 'Lane', name, 60, laneY(index) - 35, 'Swimlanes', 2380, 145, `${name} lane`)
  })

  if (isContosoPharmacy) {
    const bpmnNodes = [
      ['start', 'Start Event', 'Cliente llega', 140, yFor('Cliente'), 'Events', 90, 90],
      ['fila', 'User Task', 'Entrar a fila general', 300, yFor('Cliente'), 'Activities', 180, 110],
      ['tipo', 'Exclusive Gateway (X)', 'Tipo de solicitud?', 540, yFor('Auxiliar de farmacia'), 'Gateways', 120, 120],
      ['identificar', 'User Task', 'Identificar necesidad', 760, yFor('Auxiliar de farmacia'), 'Activities', 180, 110],
      ['consultar', 'Service Task', 'Consultar disponibilidad', 1000, yFor('Inventario / sistema de ventas'), 'Activities', 190, 110],
      ['disponible', 'Exclusive Gateway (X)', 'Producto disponible?', 1240, yFor('Inventario / sistema de ventas'), 'Gateways', 120, 120],
      ['validar', 'User Task', 'Validar formula medica', 1460, yFor('Regente de farmacia'), 'Activities', 190, 110],
      ['requiere', 'Exclusive Gateway (X)', 'Formula requiere validacion?', 1680, yFor('Regente de farmacia'), 'Gateways', 130, 130],
      ['precio', 'User Task', 'Confirmar precio', 1900, yFor('Auxiliar de farmacia'), 'Activities', 180, 110],
      ['registrar', 'Service Task', 'Registrar venta', 2120, yFor('Inventario / sistema de ventas'), 'Activities', 180, 110],
      ['pagar', 'User Task', 'Pagar en caja', 2340, yFor('Caja'), 'Activities', 180, 110],
      ['preparar', 'User Task', 'Preparar producto', 2560, yFor('Entrega / bodega'), 'Activities', 180, 110],
      ['entregar', 'User Task', 'Entregar producto', 2780, yFor('Entrega / bodega'), 'Activities', 180, 110],
      ['fin', 'End Event', 'Producto entregado', 3000, yFor('Cliente'), 'Events', 90, 90],
      ['no-disponible', 'End Event', 'Informar no disponible', 1460, yFor('Cliente'), 'Events', 100, 100],
      ['orientacion', 'User Task', 'Orientacion farmaceutica', 760, yFor('Regente de farmacia'), 'Activities', 190, 110]
    ] as const

    bpmnNodes.forEach(([id, type, name, x, y, category, width, height]) => {
      addBpmnNode(nodes, id, type, name, x, y, category, width, height, input)
    })

    connect('start', 'fila')
    connect('fila', 'tipo')
    connect('tipo', 'identificar', 'compra rapida')
    connect('tipo', 'requiere', 'formula medica')
    connect('tipo', 'consultar', 'consulta disponibilidad')
    connect('tipo', 'orientacion', 'orientacion')
    connect('orientacion', 'fin')
    connect('identificar', 'consultar')
    connect('consultar', 'disponible')
    connect('disponible', 'no-disponible', 'No')
    connect('disponible', 'requiere', 'Si')
    connect('requiere', 'validar', 'Si')
    connect('requiere', 'precio', 'No')
    connect('validar', 'precio', 'validado')
    connect('precio', 'registrar')
    connect('registrar', 'pagar')
    connect('pagar', 'preparar')
    connect('preparar', 'entregar')
    connect('entregar', 'fin')
  } else {
    const steps = extractProcessSteps(input, splitSentences(input))
    addBpmnNode(nodes, 'start', 'Start Event', 'Start', 140, yFor(laneNames[0]), 'Events', 90, 90, input)
    let previousId = 'start'
    steps.slice(0, 8).forEach((step, index) => {
      const id = `task-${index + 1}`
      const lane = laneNames[Math.min(index % laneNames.length, laneNames.length - 1)]
      addBpmnNode(nodes, id, index % 3 === 2 ? 'Service Task' : 'User Task', step, 340 + index * 220, yFor(lane), 'Activities', 180, 110, step)
      connect(previousId, id)
      previousId = id
    })
    addBpmnNode(nodes, 'end', 'End Event', 'End', 340 + Math.max(steps.length, 1) * 220, yFor(laneNames[0]), 'Events', 90, 90, input)
    connect(previousId, 'end')
  }

  return {
    id: 'bpmn-process-view',
    name: 'Current Process BPMN',
    parentNodeId: 'case-node-2',
    nodes,
    connectors
  }
}

const generateArchitectureCaseResponse = (input: string) => {
  const sentences = splitSentences(input)
  const nodes: ArchitectureNode[] = []
  const connectors: Array<{
    id: string
    sourceId: string
    targetId: string
    relationshipType: string
    label: string
    description: string
  }> = []
  const addConnector = (sourceId: string, targetId: string, relationshipType: string, label: string, description = '') => {
    connectors.push({
      id: `case-conn-${connectors.length + 1}`,
      sourceId,
      targetId,
      relationshipType,
      label,
      description
    })
  }

  const contextSentence = sentences[0] ?? input
  const bpmnDiagram = buildBpmnProcessView(input)
  const contextNode = addNode(nodes, 'Business Context', 'Business Context', contextSentence, 'business', contextSentence)
  const processNode = addNode(nodes, 'Business Process', 'Current Process', 'Current business/process flow extracted from the case. Open the nested BPMN view for the operational process.', 'business', input, 'inferred', bpmnDiagram.id)

  const goalSentences = findSentences(sentences, [/\b(objetivo|meta|goal|objective|necesita|needs|quiere|wants|mejorar|improve)\b/], 2)
  const objectiveNode = addNode(
    nodes,
    'Objective',
    'Improve Process',
    goalSentences[0] ?? 'Improve the current process performance, safety, and service experience.',
    'motivation',
    goalSentences[0] ?? input,
    goalSentences[0] ? 'extracted' : 'inferred'
  )
  addConnector(contextNode.id, objectiveNode.id, 'Supports', 'context')
  addConnector(objectiveNode.id, processNode.id, 'Supports', 'drives')

  const gapSentences = findSentences(sentences, [/\b(gap|brecha|problema|problem|no existe|there is no|falta|missing|fila|queue|espera|wait|demora|delay)\b/], 4)
  const riskSentences = findSentences(sentences, [/\b(riesgo|risk|error|fallo|failure|seguridad|safety|compliance|cumplimiento)\b/], 3)
  const recommendationSentences = findSentences(sentences, [/\b(recomendacion|recommendation|mejora|improve|deberia|should|proponer|separar|automatizar|dashboard|integracion|integration)\b/], 4)
  const applicationSentences = findSentences(sentences, [/\b(app|aplicacion|application|sistema|system|api|integracion|integration|portal|dashboard)\b/], 3)
  const dataSentences = findSentences(sentences, [/\b(dato|data|registro|record|base de datos|database|inventario|inventory|orden|order)\b/], 3)

  const gapNodes = gapSentences.slice(0, 3).map((sentence, index) => {
    const node = addNode(nodes, 'Gap', index === 0 ? 'Process Gap' : 'Operational Gap', sentence, 'motivation', sentence)
    return node
  })
  if (gapNodes[0]) addConnector(processNode.id, gapNodes[0].id, 'Impacts', 'has gap')

  riskSentences.slice(0, 2).forEach((sentence, index) => {
    addNode(nodes, 'Risk', index === 0 ? 'Process Risk' : 'Operational Risk', sentence, 'motivation', sentence)
  })

  const recommendationNode = recommendationSentences[0]
    ? addNode(nodes, 'Recommendation', 'Recommendation', recommendationSentences[0], 'motivation', recommendationSentences[0])
    : undefined
  if (recommendationNode && gapNodes[0]) addConnector(gapNodes[0].id, recommendationNode.id, 'Supports', 'addressed by')

  const solutionNode = recommendationSentences[1]
    ? addNode(nodes, 'Solution Option', 'Solution Option', recommendationSentences[1], 'motivation', recommendationSentences[1])
    : recommendationNode
      ? addNode(nodes, 'Solution Option', 'Solution Option', recommendationNode.description, 'motivation', recommendationNode.evidence, 'inferred')
      : undefined
  if (recommendationNode && solutionNode && recommendationNode.id !== solutionNode.id) {
    addConnector(recommendationNode.id, solutionNode.id, 'Supports', 'proposes')
  }

  applicationSentences.slice(0, 2).forEach((sentence, index) => {
    const node = addNode(nodes, 'Application Component', index === 0 ? 'Application Component' : 'Integration Component', sentence, 'application', sentence)
    if (solutionNode && index === 0) addConnector(solutionNode.id, node.id, 'Supports', 'enabled by')
  })

  dataSentences.slice(0, 2).forEach((sentence, index) => {
    const node = addNode(nodes, index === 0 ? 'Data Entity' : 'Data Store', index === 0 ? 'Business Data' : 'Data Store', sentence, 'data', sentence)
    if (solutionNode && index === 0) addConnector(solutionNode.id, node.id, 'Uses', 'uses data')
  })

  return {
    nodes,
    connectors,
    diagrams: [bpmnDiagram],
    assumptions: ['Long Quick Capture input was interpreted as an architecture/process case and split into multiple elements.'],
    gaps: gapSentences.map(sentence => truncate(sentence)),
    risks: riskSentences.map(sentence => truncate(sentence)),
    recommendations: recommendationSentences.map(sentence => truncate(sentence))
  }
}

export const interpretQuickCaptureIntent = (input: string, _currentDiagram?: Diagram): QuickCaptureIntent => {
  const normalizedInput = normalize(input)
  const match = intentMatches.find(candidate => candidate.pattern.test(normalizedInput))

  if (!match) {
    const fallback = input.trim()
    return {
      intent: 'create_node',
      confidence: 0.2,
      actions: fallback
        ? [{
            action: 'create_node',
            node: {
              type: 'Generated Summary',
              name: 'Generated summary',
              description: fallback,
              layer: 'general',
              status: 'inferred',
              evidence: input
            }
          }]
        : []
    }
  }

  const name = cleanName(input, match) || match.type

  return {
    intent: 'create_node',
    confidence: 0.95,
    actions: [{
      action: 'create_node',
      node: {
        type: match.type,
        name,
        description: name,
        layer: match.layer,
        status: 'extracted',
        evidence: input
      }
    }]
  }
}

export const quickCaptureIntentToAnalysisResponse = (input: string, currentDiagram?: Diagram) => {
  if (isObjectivesInput(input)) {
    return generateObjectivesResponse(input)
  }

  if (isExplicitProcessListInput(input)) {
    return generateExplicitProcessBpmnResponse(input)
  }

  if (isLongBusinessCaseInput(input)) {
    return generateArchitectureCaseResponse(input)
  }

  const classification = classifyDomainAndNodeType(input)
  if (classification.confidence >= 0.85) {
    return generateDomainClassificationResponse(input)
  }

  const intent = interpretQuickCaptureIntent(input, currentDiagram)

  return {
    nodes: intent.actions.map((action, index) => ({
      id: `intent-node-${index + 1}`,
      name: action.node.name,
      type: action.node.type,
      description: action.node.description,
      layer: action.node.layer,
      status: action.node.status,
      evidence: action.node.evidence
    })),
    connectors: [],
    assumptions: [`Quick Capture interpreted this as ${intent.actions[0]?.node.type ?? 'a diagram element'} with ${Math.round(intent.confidence * 100)}% confidence.`],
    gaps: [],
    risks: [],
    recommendations: []
  }
}
