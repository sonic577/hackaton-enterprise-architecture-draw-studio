import { ConnectorType, DiagramConnector, DiagramNode } from '../types'

interface GenerationInsight {
  assumptions: string[]
  gaps: string[]
  risks: string[]
  recommendations: string[]
}

export interface GenerationResult {
  nodes: DiagramNode[]
  connectors: DiagramConnector[]
  insights: GenerationInsight
}

const SECTION_LABELS = ['mission', 'vision', 'process', 'bottleneck', 'gap', 'risk', 'recommendation', 'solution']

const toTitle = (value: string) =>
  value.trim().replace(/\s+/g, ' ').replace(/^./, char => char.toUpperCase())

const splitList = (value: string) =>
  value
    .split(/(?:,|;|->|→|\bthen\b|\band then\b)/i)
    .map(item => item.trim().replace(/\.$/, ''))
    .filter(Boolean)

const getSections = (text: string) => {
  const sections: Record<string, string> = {}
  const pattern = new RegExp(`\\b(${SECTION_LABELS.join('|')}):`, 'gi')
  const matches = Array.from(text.matchAll(pattern))

  matches.forEach((match, index) => {
    const label = match[1].toLowerCase()
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? text.length
    sections[label] = text.slice(start, end).trim()
  })

  return sections
}

const getBestStepMatch = (description: string, processNodes: DiagramNode[]) => {
  const words = description
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word.length > 3)

  let bestMatch: DiagramNode | undefined
  let bestScore = 0

  processNodes.forEach(node => {
    const title = node.title.toLowerCase()
    const score = words.filter(word => title.includes(word) || word.includes(title.split(' ')[0])).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = node
    }
  })

  return bestMatch ?? processNodes[Math.max(0, processNodes.length - 1)]
}

export function generateDiagramFromText(text: string, idPrefix = `generated-${Date.now()}`): GenerationResult {
  const sections = getSections(text)
  const nodes: DiagramNode[] = []
  const connectors: DiagramConnector[] = []
  const insights: GenerationInsight = {
    assumptions: ['Generated locally with deterministic rules; no external AI service was called.'],
    gaps: [],
    risks: [],
    recommendations: []
  }

  const addNode = (type: string, title: string, description: string, x: number, y: number) => {
    const node: DiagramNode = {
      id: `${idPrefix}-${nodes.length + 1}`,
      type,
      title: toTitle(title),
      description: description.trim(),
      position: { x, y },
      status: 'inferred'
    }
    nodes.push(node)
    return node
  }

  const addConnector = (source: DiagramNode, target: DiagramNode, type: ConnectorType, label: string) => {
    connectors.push({
      id: `${idPrefix}-conn-${connectors.length + 1}`,
      sourceId: source.id,
      targetId: target.id,
      type,
      label,
      status: 'inferred'
    })
  }

  let missionNode: DiagramNode | undefined
  if (sections.mission) {
    missionNode = addNode('mission', 'Mission', sections.mission, 120, 100)
  }

  if (sections.vision) {
    addNode('vision', 'Vision', sections.vision, missionNode ? 360 : 120, 100)
  }

  const processSteps = sections.process ? splitList(sections.process) : []
  const processNodes = processSteps.map((step, index) =>
    addNode('process', step, `Process step ${index + 1}: ${step}`, 120 + index * 220, 280)
  )

  processNodes.forEach((node, index) => {
    if (index > 0) addConnector(processNodes[index - 1], node, 'flow', 'flow')
    if (index === 0 && missionNode) addConnector(missionNode, node, 'related_to', 'Related to')
  })

  const specialSections: Array<{ key: string; type: string; title: string }> = [
    { key: 'bottleneck', type: 'bottleneck', title: 'Bottleneck' },
    { key: 'gap', type: 'gap', title: 'Gap' },
    { key: 'risk', type: 'risk', title: 'Risk' },
    { key: 'recommendation', type: 'recommendation', title: 'Recommendation' },
    { key: 'solution', type: 'solution', title: 'Solution' }
  ]

  specialSections.forEach((section, index) => {
    const value = sections[section.key]
    if (!value) return

    const node = addNode(section.type, section.title, value, 160 + index * 220, 500)
    const relatedStep = processNodes.length > 0 ? getBestStepMatch(value, processNodes) : missionNode
    if (relatedStep) addConnector(node, relatedStep, 'related_to', 'Related to')

    if (section.key === 'gap') insights.gaps.push(value)
    if (section.key === 'risk') insights.risks.push(value)
    if (section.key === 'recommendation' || section.key === 'solution') insights.recommendations.push(value)
  })

  if (processNodes.length > 1) {
    insights.assumptions.push('Comma-separated process entries were interpreted as sequential process steps.')
  }

  if (nodes.length === 0 && text.trim()) {
    const fallbackNode = addNode('process', 'Generated summary', text.trim(), 120, 220)
    insights.assumptions.push(`No labeled sections were found, so a single ${fallbackNode.type} node was created.`)
  }

  if (insights.gaps.length === 0) insights.gaps.push('No explicit gap was detected in the input.')
  if (insights.risks.length === 0) insights.risks.push('No explicit risk was detected in the input.')
  if (insights.recommendations.length === 0) {
    insights.recommendations.push('Add a recommendation or solution sentence for richer generated options.')
  }

  return { nodes, connectors, insights }
}
