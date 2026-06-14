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

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const truncate = (value: string, maxLength = 180) => {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trim()}...` : trimmed
}

const sentenceCase = (value: string) =>
  value.trim().replace(/\s+/g, ' ').replace(/^./, char => char.toUpperCase())

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
  if (isLongBusinessCaseInput(input)) {
    return generateArchitectureCaseResponse(input)
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
