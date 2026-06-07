import { DiagramConnector, DiagramNode } from '../types'

export type AnalysisGroup = 'Bottlenecks' | 'Gaps' | 'Risks' | 'Recommendations' | 'Solution Options'
export type AnalysisSeverity = 'low' | 'medium' | 'high'

export interface ProcessAnalysisResult {
  id: string
  group: AnalysisGroup
  title: string
  description: string
  severity: AnalysisSeverity
  relatedNodeIds: string[]
  reasoning: string
  suggestedAction: string
}

const GROUP_ORDER: AnalysisGroup[] = ['Bottlenecks', 'Gaps', 'Risks', 'Recommendations', 'Solution Options']
const issueKeywords = ['bottleneck', 'delay', 'queue', 'wait', 'manual', 'rework', 'duplicate', 'approval', 'validation']
const repeatedTaskWords = ['validate', 'approve', 'check', 'review', 'prepare']
const solutionTypes = ['process redesign', 'checklist', 'automation', 'integration', 'dashboard', 'application']

const nodeText = (node: DiagramNode) =>
  `${node.type} ${node.name ?? ''} ${node.title} ${node.description ?? ''} ${node.context ?? ''}`.toLowerCase()

const isProcessNode = (node: DiagramNode) => {
  const text = nodeText(node)
  return (
    node.type === 'process' ||
    node.type.startsWith('bpmn_') ||
    text.includes('process') ||
    text.includes('task') ||
    text.includes('workflow') ||
    text.includes('activity')
  )
}

const isActorNode = (node: DiagramNode) => {
  const text = nodeText(node)
  return text.includes('actor') || text.includes('role') || text.includes('owner') || text.includes('organization unit')
}

const hasResponsibleMetadata = (node: DiagramNode) => {
  const properties = node.properties ?? {}
  return ['actor', 'responsible', 'role', 'owner', 'assignee'].some(key => Boolean(properties[key]))
}

const isGatewayNode = (node: DiagramNode) => node.category === 'Gateways' || node.type.includes('gateway')

const createResult = (
  group: AnalysisGroup,
  title: string,
  description: string,
  severity: AnalysisSeverity,
  relatedNodeIds: string[],
  reasoning: string,
  suggestedAction: string
): ProcessAnalysisResult => ({
  id: `${group}-${title}-${relatedNodeIds.join('-')}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  group,
  title,
  description,
  severity,
  relatedNodeIds,
  reasoning,
  suggestedAction
})

const getLongestDirectedPath = (nodes: DiagramNode[], connectors: DiagramConnector[]) => {
  const processNodeIds = new Set(nodes.filter(isProcessNode).map(node => node.id))
  const outgoing = new Map<string, string[]>()

  connectors.forEach(connector => {
    if (!processNodeIds.has(connector.sourceId) || !processNodeIds.has(connector.targetId)) return
    outgoing.set(connector.sourceId, [...(outgoing.get(connector.sourceId) ?? []), connector.targetId])
  })

  let longest: string[] = []

  const walk = (nodeId: string, path: string[]) => {
    if (path.includes(nodeId)) return
    const nextPath = [...path, nodeId]
    if (nextPath.length > longest.length) longest = nextPath
    ;(outgoing.get(nodeId) ?? []).forEach(nextId => walk(nextId, nextPath))
  }

  processNodeIds.forEach(nodeId => walk(nodeId, []))
  return longest
}

export const groupAnalysisResults = (results: ProcessAnalysisResult[]) =>
  GROUP_ORDER.map(group => ({
    group,
    results: results.filter(result => result.group === group)
  }))

export const analyzeProcess = (nodes: DiagramNode[], connectors: DiagramConnector[]): ProcessAnalysisResult[] => {
  const results: ProcessAnalysisResult[] = []
  const incoming = new Map<string, DiagramConnector[]>()
  const outgoing = new Map<string, DiagramConnector[]>()

  nodes.forEach(node => {
    incoming.set(node.id, [])
    outgoing.set(node.id, [])
  })

  connectors.forEach(connector => {
    incoming.set(connector.targetId, [...(incoming.get(connector.targetId) ?? []), connector])
    outgoing.set(connector.sourceId, [...(outgoing.get(connector.sourceId) ?? []), connector])
  })

  const actorNodesExist = nodes.some(isActorNode)
  const nodesWithDetectedIssues = new Set<string>()

  nodes.forEach(node => {
    const nodeIncoming = incoming.get(node.id) ?? []
    const nodeOutgoing = outgoing.get(node.id) ?? []
    const text = nodeText(node)

    if (nodeIncoming.length === 0 && nodeOutgoing.length === 0) {
      results.push(createResult(
        'Gaps',
        'Isolated node',
        `${node.title} is not connected to the process flow.`,
        isProcessNode(node) ? 'high' : 'medium',
        [node.id],
        'A disconnected element can represent missing context, an orphaned activity, or an incomplete model.',
        'Connect it to the relevant upstream or downstream process step, or remove it if it is out of scope.'
      ))
      nodesWithDetectedIssues.add(node.id)
    }

    if (isProcessNode(node) && (nodeIncoming.length === 0 || nodeOutgoing.length === 0)) {
      results.push(createResult(
        'Gaps',
        'Process step has an open end',
        `${node.title} has ${nodeIncoming.length === 0 ? 'no incoming flow' : 'no outgoing flow'}.`,
        'medium',
        [node.id],
        'Process steps usually need a clear predecessor and successor to explain how work enters and exits the step.',
        'Add the missing incoming or outgoing connector, or mark the step as a start/end event where appropriate.'
      ))
      nodesWithDetectedIssues.add(node.id)
    }

    if (nodeIncoming.length + nodeOutgoing.length >= 5 || nodeOutgoing.length >= 4) {
      results.push(createResult(
        'Bottlenecks',
        'High fan-in or fan-out',
        `${node.title} has many connected steps and may be doing too much coordination work.`,
        'high',
        [node.id],
        'Nodes with many incoming or outgoing relationships often become handoff, routing, or decision bottlenecks.',
        'Split responsibilities, introduce a gateway/decision rule, or redesign this area into clearer subprocesses.'
      ))
      nodesWithDetectedIssues.add(node.id)
    }

    const keyword = issueKeywords.find(word => text.includes(word))
    if (keyword) {
      results.push(createResult(
        'Bottlenecks',
        `Potential ${keyword}`,
        `${node.title} contains language associated with ${keyword}.`,
        ['bottleneck', 'delay', 'queue', 'rework', 'duplicate'].includes(keyword) ? 'high' : 'medium',
        [node.id],
        'The node text or metadata contains terms commonly associated with process friction.',
        'Review cycle time, queue size, ownership, and handoff rules for this step.'
      ))
      nodesWithDetectedIssues.add(node.id)
    }

    if (isGatewayNode(node) && nodeOutgoing.length < 2) {
      results.push(createResult(
        'Gaps',
        'Gateway has fewer than two paths',
        `${node.title} is modeled as a decision/gateway but does not branch.`,
        'medium',
        [node.id],
        'Gateways typically need multiple outgoing paths to represent alternatives or parallel work.',
        'Add the missing branch paths or convert the gateway to a normal task.'
      ))
      nodesWithDetectedIssues.add(node.id)
    }

    if (actorNodesExist && isProcessNode(node) && !hasResponsibleMetadata(node)) {
      results.push(createResult(
        'Gaps',
        'Missing responsible role',
        `${node.title} has no actor, owner, responsible role, or assignee metadata.`,
        'medium',
        [node.id],
        'Actor/role information exists in this diagram, so process steps without ownership are likely incomplete.',
        'Assign a responsible actor or role in the node properties.'
      ))
      nodesWithDetectedIssues.add(node.id)
    }
  })

  repeatedTaskWords.forEach(word => {
    const matchingNodes = nodes.filter(node => isProcessNode(node) && nodeText(node).includes(word))
    if (matchingNodes.length >= 2) {
      results.push(createResult(
        'Risks',
        `Repeated ${word} activity`,
        `${matchingNodes.length} process steps mention "${word}".`,
        'medium',
        matchingNodes.map(node => node.id),
        'Repeated review/check/approval language can indicate duplicated controls or repeated manual verification.',
        'Consolidate the repeated activity into one control point or automate the validation.'
      ))
      matchingNodes.forEach(node => nodesWithDetectedIssues.add(node.id))
    }
  })

  const longestPath = getLongestDirectedPath(nodes, connectors)
  if (longestPath.length >= 6) {
    results.push(createResult(
      'Risks',
      'Long sequential flow',
      `The longest detected process path has ${longestPath.length} sequential steps.`,
      'medium',
      longestPath,
      'Long linear flows increase cycle time and create more handoff points before value is delivered.',
      'Look for steps that can run in parallel, be removed, or become a smaller subprocess.'
    ))
    longestPath.forEach(nodeId => nodesWithDetectedIssues.add(nodeId))
  }

  const processNodes = nodes.filter(isProcessNode)
  const issueCount = nodesWithDetectedIssues.size

  if (issueCount > 0) {
    results.push(createResult(
      'Recommendations',
      'Prioritize ownership and flow cleanup',
      `${issueCount} node${issueCount === 1 ? '' : 's'} have local process issues.`,
      issueCount >= 5 ? 'high' : 'medium',
      Array.from(nodesWithDetectedIssues),
      'The diagram shows enough structural issues to justify a focused process cleanup pass.',
      'Start with disconnected or high-degree nodes, then assign owners and clarify missing sequence paths.'
    ))
  }

  if (processNodes.length > 0 && connectors.length < Math.max(1, processNodes.length - 1)) {
    results.push(createResult(
      'Recommendations',
      'Clarify process sequence',
      'The diagram has fewer connectors than expected for the number of process-like nodes.',
      'medium',
      processNodes.map(node => node.id),
      'A process model with many activities but few relationships is difficult to reason about.',
      'Add sequence flow connectors between the major steps before deeper analysis.'
    ))
  }

  const solutionRelatedNodeIds = Array.from(nodesWithDetectedIssues).slice(0, 8)
  if (solutionRelatedNodeIds.length > 0) {
    solutionTypes.forEach((solutionType, index) => {
      results.push(createResult(
        'Solution Options',
        solutionType.charAt(0).toUpperCase() + solutionType.slice(1),
        `Consider ${solutionType} for the highlighted process issues.`,
        index < 2 ? 'medium' : 'low',
        solutionRelatedNodeIds,
        'This is a deterministic option generated from detected gaps, risks, and bottlenecks.',
        `Evaluate a ${solutionType} intervention and add it as a solution node if it fits the process context.`
      ))
    })
  }

  return results
}
