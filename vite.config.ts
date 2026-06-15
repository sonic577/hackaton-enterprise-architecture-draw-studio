import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { generateDiagramFromText } from './src/utils/mockDiagramGenerator'
import { isLongBusinessCaseInput, isObjectivesInput, quickCaptureIntentToAnalysisResponse } from './src/utils/quickCaptureIntent'

const apiVersion = '2024-08-01-preview'

const sendJson = (res: any, status: number, payload: unknown) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

const readJsonBody = async (req: any) => {
  const body = await new Promise<string>((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk: unknown) => {
      raw += String(chunk)
    })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })

  return body ? JSON.parse(body) : {}
}

const normalizeArray = (value: unknown) =>
  Array.isArray(value) ? value.filter(item => typeof item === 'string') : []

const normalizeAnalysisResponse = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Foundry did not return a JSON object.')
  }

  const response = value as Record<string, unknown>
  if (!Array.isArray(response.nodes) || !Array.isArray(response.connectors)) {
    throw new Error('Foundry response must include nodes and connectors arrays.')
  }

  return {
    nodes: response.nodes,
    connectors: response.connectors,
    diagrams: Array.isArray(response.diagrams) ? response.diagrams : [],
    layoutPlan: response.layoutPlan && typeof response.layoutPlan === 'object' && !Array.isArray(response.layoutPlan)
      ? response.layoutPlan
      : undefined,
    assumptions: normalizeArray(response.assumptions),
    gaps: normalizeArray(response.gaps),
    risks: normalizeArray(response.risks),
    recommendations: normalizeArray(response.recommendations)
  }
}

const mockAnalysisResponse = (text: string, currentDiagram: unknown) => {
  const intentResponse = quickCaptureIntentToAnalysisResponse(text, currentDiagram as any)
  const hasConfidentIntent = intentResponse.nodes.some(node => node.type !== 'Generated Summary')

  if (hasConfidentIntent) return intentResponse

  const result = generateDiagramFromText(text)

  return {
    nodes: result.nodes.map(node => ({
      id: node.id,
      name: node.title,
      type: node.type,
      description: node.description ?? '',
      layer: node.layer ?? '',
      status: node.status ?? 'inferred',
      evidence: node.evidence ?? []
    })),
    connectors: result.connectors.map(connector => ({
      id: connector.id,
      sourceId: connector.sourceId,
      targetId: connector.targetId,
      relationshipType: connector.type,
      label: connector.label ?? connector.type,
      description: connector.description ?? '',
      evidence: connector.evidence ?? []
    })),
    assumptions: result.insights.assumptions,
    gaps: result.insights.gaps,
    risks: result.insights.risks,
    recommendations: result.insights.recommendations
  }
}

const findBalancedJson = (text: string) => {
  const start = text.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') inString = true
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (depth === 0) return text.slice(start, index + 1)
  }

  return null
}

const parseJsonFromText = (text: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim()
  const candidates = [fenced, text.trim(), findBalancedJson(text)].filter(Boolean) as string[]

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      // Try the next representation.
    }
  }

  throw new Error('Foundry returned text, but no valid JSON object could be extracted.')
}

const architecturePrompt = (text: string, currentDiagram: unknown) => `
Return only valid JSON with this exact shape:
{
  "nodes": [],
  "connectors": [],
  "diagrams": [],
  "layoutPlan": {
    "viewType": "",
    "layoutStyle": "",
    "groups": [],
    "ordering": [],
    "notes": ""
  },
  "assumptions": [],
  "gaps": [],
  "risks": [],
  "recommendations": []
}

Create architecture/process diagram elements from the user text.
Each node should include id, name, type, description, layer, status, and evidence when possible.
Each node may include logical layout hints: order, laneId, groupId, row, column, parentId. Do not rely on final x/y.
Each connector should include sourceId, targetId, relationshipType, label, and description when possible.
Use stable node ids inside the JSON so connectors can reference them.
Set layoutPlan.viewType to one of: objectives_board, bpmn_process, layered_architecture, value_chain, capability_map, analysis_board.
${isLongBusinessCaseInput(text)
    ? 'This is a long business/process case. Do not create one summary node. Create multiple short-named nodes for Business Context, Goals/Objectives, Business Process, Process Steps, Actors, Gaps, Risks, Recommendations, Solution Options, Application Components, and Data Components when applicable. Add connectors between process, steps, gaps, risks, and recommendations. Also include diagrams[0] as a BPMN / Process View with Start Event, User Task, Service Task, Exclusive Gateway, End Event, Pool/Lane nodes if applicable, and Flow connectors arranged left to right.'
    : ''}
${isObjectivesInput(text)
    ? 'This is an objectives_view request. Return only independent Objective or Goal nodes in a grid. Do not create Business Process, Current Process, BPMN diagrams, Gaps, Risks, Recommendations, Solution Options, or connectors unless explicitly requested.'
    : ''}

User text:
${text}

Current diagram context:
${JSON.stringify(currentDiagram ?? null)}
`

const callChatCompletion = async (env: Record<string, string>, text: string, currentDiagram: unknown) => {
  const endpoint = env.AZURE_FOUNDRY_PROJECT_ENDPOINT?.replace(/\/$/, '')
  const deployment = env.AZURE_FOUNDRY_DEPLOYMENT
  const apiKey = env.AZURE_FOUNDRY_API_KEY

  if (!endpoint || !deployment || !apiKey) {
    throw new Error('Foundry environment variables are incomplete.')
  }

  const response = await fetch(`${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${apiVersion}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an enterprise architecture diagram generator. Return only JSON.'
        },
        {
          role: 'user',
          content: architecturePrompt(text, currentDiagram)
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Foundry chat completion failed with ${response.status}.`)
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new Error('Foundry response did not include message content.')
  }

  return normalizeAnalysisResponse(parseJsonFromText(content))
}

const architectureAnalysisApiPlugin = (env: Record<string, string>) => ({
  name: 'architecture-analysis-api',
  configureServer(server: any) {
    server.middlewares.use('/api/analyze-architecture', async (req: any, res: any) => {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed.' })
        return
      }

      try {
        const body = await readJsonBody(req)
        const text = typeof body.text === 'string' ? body.text.trim() : ''
        if (!text) {
          sendJson(res, 400, { error: 'Text is required for architecture analysis.' })
          return
        }

        const localIntent = quickCaptureIntentToAnalysisResponse(text, body.currentDiagram)
        const hasConfidentLocalIntent = !isLongBusinessCaseInput(text) && localIntent.nodes.some(node => node.type !== 'Generated Summary')
        if (hasConfidentLocalIntent) {
          sendJson(res, 200, localIntent)
          return
        }

        if ((env.ANALYSIS_MODE ?? 'mock').toLowerCase() === 'foundry') {
          try {
            const foundryResult = await callChatCompletion(env, text, body.currentDiagram)
            if (isObjectivesInput(text)) {
              const hasInvalidObjectiveOutput =
                (foundryResult as any).connectors?.length > 0 ||
                (foundryResult as any).diagrams?.length > 0 ||
                (foundryResult as any).nodes?.some((node: any) => {
                  const raw = `${node.type ?? ''} ${node.name ?? ''}`.toLowerCase()
                  return raw.includes('process') || raw.includes('current process') || raw.includes('gap') || raw.includes('risk') || raw.includes('recommendation') || raw.includes('solution')
                })

              if (hasInvalidObjectiveOutput) {
                sendJson(res, 200, mockAnalysisResponse(text, body.currentDiagram))
                return
              }
            }

            if (isLongBusinessCaseInput(text) && (!Array.isArray((foundryResult as any).diagrams) || (foundryResult as any).diagrams.length === 0)) {
              sendJson(res, 200, mockAnalysisResponse(text, body.currentDiagram))
              return
            }

            sendJson(res, 200, foundryResult)
            return
          } catch (error) {
            console.warn('[Foundry] Falling back to local mock analysis:', error)
          }
        }

        sendJson(res, 200, mockAnalysisResponse(text, body.currentDiagram))
      } catch {
        sendJson(res, 400, { error: 'Could not analyze the submitted text.' })
      }
    })
  }
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), architectureAnalysisApiPlugin(env)],
    server: {
      port: 5173,
      open: true
    }
  }
})
