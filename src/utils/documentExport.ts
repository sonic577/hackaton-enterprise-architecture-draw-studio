import { Diagram, DiagramConnector, DiagramNode } from '../types'
import { ProcessAnalysisResult } from './processAnalyzer'

interface ArchitectureDocumentInput {
  projectName: string
  currentDiagram: Diagram
  diagrams: Diagram[]
  analysisResults: ProcessAnalysisResult[]
  diagramImageDataUrl?: string | null
}

interface DocumentSection {
  title: string
  nodes?: DiagramNode[]
  rows?: string[][]
  paragraphs?: string[]
}

const DOCUMENT_SECTIONS = [
  {
    title: 'Business Layer',
    matches: ['mission', 'vision', 'goal', 'objective', 'driver', 'requirement']
  },
  {
    title: 'Value Chain and Capabilities',
    matches: ['value_chain', 'value_stream', 'capability']
  },
  {
    title: 'Processes',
    matches: ['process', 'business_process', 'task', 'event', 'gateway', 'actor', 'role']
  },
  {
    title: 'Gaps and Problems',
    matches: ['gap', 'bottleneck', 'risk', 'issue', 'pain_point']
  },
  {
    title: 'Recommendations and Solutions',
    matches: ['recommendation', 'solution_option', 'solution', 'decision']
  },
  {
    title: 'Applications and Integrations',
    matches: ['application', 'service', 'api', 'integration', 'system', 'interface']
  },
  {
    title: 'Data',
    matches: ['data_entity', 'data_object', 'data_store', 'database', 'data_flow', 'information']
  },
  {
    title: 'Technology',
    matches: ['technology', 'node', 'server', 'network', 'cloud_service', 'device', 'deployment']
  }
]

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const typeText = (node: DiagramNode) =>
  `${node.type} ${node.name ?? ''} ${node.title} ${node.layer ?? ''} ${node.category ?? ''} ${node.bpmnType ?? ''}`.toLowerCase()

export const groupElementsByArchitectureLayer = (nodes: DiagramNode[]) => {
  const assigned = new Set<string>()
  const grouped = DOCUMENT_SECTIONS.map(section => {
    const sectionNodes = nodes.filter(node => {
      const text = typeText(node)
      const matches = section.matches.some(match => text.includes(match))
      if (matches) assigned.add(node.id)
      return matches
    })

    return { title: section.title, nodes: sectionNodes }
  })

  return [
    ...grouped,
    {
      title: 'Other Elements',
      nodes: nodes.filter(node => !assigned.has(node.id))
    }
  ]
}

const getNodeTitle = (nodes: DiagramNode[], nodeId: string) =>
  nodes.find(node => node.id === nodeId)?.title ?? nodeId

const nodeRelationshipSummary = (node: DiagramNode, nodes: DiagramNode[], connectors: DiagramConnector[]) =>
  connectors
    .filter(connector => connector.sourceId === node.id || connector.targetId === node.id)
    .map(connector => {
      const outgoing = connector.sourceId === node.id
      const otherNodeId = outgoing ? connector.targetId : connector.sourceId
      const arrow = outgoing ? '->' : '<-'
      const label = connector.label ? ` (${connector.label})` : ''
      return `${arrow} ${connector.type.replace(/_/g, ' ')} ${getNodeTitle(nodes, otherNodeId)}${label}`
    })
    .join('; ')

const formatNode = (node: DiagramNode, nodes: DiagramNode[], connectors: DiagramConnector[]) => [
  node.title,
  node.type.replace(/_/g, ' '),
  node.layer ?? node.category ?? node.bpmnType ?? '',
  node.description ?? '',
  node.status ?? '',
  node.evidence?.join('; ') ?? '',
  node.impact ?? '',
  nodeRelationshipSummary(node, nodes, connectors)
]

const relationshipRows = (nodes: DiagramNode[], connectors: DiagramConnector[]) =>
  connectors.map(connector => [
    getNodeTitle(nodes, connector.sourceId),
    connector.type.replace(/_/g, ' '),
    getNodeTitle(nodes, connector.targetId),
    connector.label ?? '',
    connector.description ?? ''
  ])

export const buildArchitectureDocumentSections = (input: ArchitectureDocumentInput): DocumentSection[] => {
  const nodes = input.currentDiagram.nodes
  const connectors = input.currentDiagram.connectors
  const grouped = groupElementsByArchitectureLayer(nodes)

  return [
    {
      title: 'Executive Summary',
      paragraphs: [
        `${input.currentDiagram.name} contains ${nodes.length} elements and ${connectors.length} relationships.`,
        'This document was generated locally from the current architecture model.'
      ]
    },
    ...grouped.map(group => ({
      title: group.title,
      nodes: group.nodes
    })),
    {
      title: 'Relationships',
      rows: relationshipRows(nodes, connectors)
    },
    {
      title: 'Risks, Assumptions, and Traceability',
      paragraphs: input.analysisResults.length > 0
        ? input.analysisResults.map(result => `${result.group}: ${result.title} - ${result.description} Suggested action: ${result.suggestedAction}`)
        : ['No process analysis results are currently stored for this diagram.']
    },
    {
      title: 'Appendix: Complete Element List',
      rows: nodes.map(node => formatNode(node, nodes, connectors))
    },
    {
      title: 'Appendix: Complete Relationship List',
      rows: relationshipRows(nodes, connectors)
    }
  ]
}

const paragraphXml = (text: string, style?: string) => `
  <w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`

const diagramImageXml = () => `
  <w:p>
    <w:r>
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="5486400" cy="3657600"/>
          <wp:docPr id="1" name="Architecture Diagram"/>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic>
                <pic:nvPicPr><pic:cNvPr id="1" name="architecture-diagram.png"/><pic:cNvPicPr/></pic:nvPicPr>
                <pic:blipFill><a:blip r:embed="rIdDiagramImage"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
                <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5486400" cy="3657600"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>
  </w:p>`

const tableXml = (headers: string[], rows: string[][]) => `
  <w:tbl>
    <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:left w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/></w:tblBorders></w:tblPr>
    <w:tr>${headers.map(header => `<w:tc><w:p><w:r><w:b/><w:t>${escapeXml(header)}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>
    ${rows.map(row => `<w:tr>${row.map(cell => `<w:tc><w:p><w:r><w:t xml:space="preserve">${escapeXml(cell ?? '')}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`).join('')}
  </w:tbl>`

const documentXml = (input: ArchitectureDocumentInput) => {
  const sections = buildArchitectureDocumentSections(input)
  const today = new Date().toLocaleDateString()
  const body = [
    paragraphXml(input.projectName, 'Title'),
    paragraphXml(`Architecture Documentation - ${input.currentDiagram.name}`, 'Subtitle'),
    paragraphXml(`Generated: ${today}`),
    paragraphXml(`Diagrams in project: ${input.diagrams.length}`),
    paragraphXml('Architecture Diagram', 'Heading1'),
    input.diagramImageDataUrl ? diagramImageXml() : paragraphXml('Diagram image could not be generated. The textual documentation is still available below.'),
    ...sections.flatMap(section => {
      const content = [paragraphXml(section.title, 'Heading1')]

      if (section.paragraphs) {
        content.push(...section.paragraphs.map(text => paragraphXml(text)))
      }

      if (section.nodes) {
        content.push(section.nodes.length > 0
          ? tableXml(
            ['Name', 'Type', 'Layer / Category', 'Description', 'Status', 'Evidence', 'Impact', 'Relationships'],
            section.nodes.map(node => formatNode(node, input.currentDiagram.nodes, input.currentDiagram.connectors))
          )
          : paragraphXml('No elements in this section.'))
      }

      if (section.rows) {
        const headers = section.title.includes('Relationship')
          ? ['Source', 'Relationship Type', 'Target', 'Label', 'Description']
          : ['Name', 'Type', 'Layer / Category', 'Description', 'Status', 'Evidence', 'Impact', 'Relationships']
        content.push(section.rows.length > 0 ? tableXml(headers, section.rows) : paragraphXml('No records.'))
      }

      return content
    })
  ].join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${body}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1080"/></w:sectPr>
  </w:body>
</w:document>`
}

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:sz w:val="26"/><w:color w:val="4B5563"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
</w:styles>`

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const documentRelsXml = (hasImage: boolean) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${hasImage ? '<Relationship Id="rIdDiagramImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/architecture-diagram.png"/>' : ''}
</Relationships>`

const crcTable = (() => {
  const table: number[] = []
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff
  data.forEach(byte => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  })
  return (crc ^ 0xffffffff) >>> 0
}

const writeUint16 = (bytes: number[], value: number) => {
  bytes.push(value & 0xff, (value >>> 8) & 0xff)
}

const writeUint32 = (bytes: number[], value: number) => {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff)
}

const dataUrlToBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1]
  if (!base64) return null

  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const createZip = (files: Array<{ name: string; content: string | Uint8Array }>) => {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  files.forEach(file => {
    const nameBytes = encoder.encode(file.name)
    const contentBytes = typeof file.content === 'string' ? encoder.encode(file.content) : file.content
    const crc = crc32(contentBytes)
    const localHeader: number[] = []

    writeUint32(localHeader, 0x04034b50)
    writeUint16(localHeader, 20)
    writeUint16(localHeader, 0)
    writeUint16(localHeader, 0)
    writeUint16(localHeader, 0)
    writeUint16(localHeader, 0)
    writeUint32(localHeader, crc)
    writeUint32(localHeader, contentBytes.length)
    writeUint32(localHeader, contentBytes.length)
    writeUint16(localHeader, nameBytes.length)
    writeUint16(localHeader, 0)

    localParts.push(Uint8Array.from(localHeader), nameBytes, contentBytes)

    const centralHeader: number[] = []
    writeUint32(centralHeader, 0x02014b50)
    writeUint16(centralHeader, 20)
    writeUint16(centralHeader, 20)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint32(centralHeader, crc)
    writeUint32(centralHeader, contentBytes.length)
    writeUint32(centralHeader, contentBytes.length)
    writeUint16(centralHeader, nameBytes.length)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint32(centralHeader, 0)
    writeUint32(centralHeader, offset)

    centralParts.push(Uint8Array.from(centralHeader), nameBytes)
    offset += localHeader.length + nameBytes.length + contentBytes.length
  })

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const end: number[] = []
  writeUint32(end, 0x06054b50)
  writeUint16(end, 0)
  writeUint16(end, 0)
  writeUint16(end, files.length)
  writeUint16(end, files.length)
  writeUint32(end, centralSize)
  writeUint32(end, offset)
  writeUint16(end, 0)

  const parts = [...localParts, ...centralParts, Uint8Array.from(end)]
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const zipBytes = new Uint8Array(totalLength)
  let cursor = 0
  parts.forEach(part => {
    zipBytes.set(part, cursor)
    cursor += part.length
  })

  return new Blob([zipBytes.buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  })
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportArchitectureDocx = (input: ArchitectureDocumentInput) => {
  const imageBytes = input.diagramImageDataUrl ? dataUrlToBytes(input.diagramImageDataUrl) : null
  const documentInput = imageBytes ? input : { ...input, diagramImageDataUrl: null }
  const files: Array<{ name: string; content: string | Uint8Array }> = [
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'word/document.xml', content: documentXml(documentInput) },
    { name: 'word/styles.xml', content: stylesXml },
    { name: 'word/_rels/document.xml.rels', content: documentRelsXml(Boolean(imageBytes)) }
  ]

  if (imageBytes) {
    files.push({ name: 'word/media/architecture-diagram.png', content: imageBytes })
  }

  const blob = createZip(files)
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  downloadBlob(blob, `architecture-documentation-${timestamp}.docx`)
}

const elementHeaders = ['Name', 'Type', 'Layer / Category', 'Description', 'Status', 'Evidence', 'Impact', 'Relationships']

const nodesTableHtml = (nodes: DiagramNode[], allNodes: DiagramNode[], connectors: DiagramConnector[]) => `
  <table><thead><tr>${elementHeaders.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
  <tbody>${nodes.map(node => `<tr>${formatNode(node, allNodes, connectors).map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`

const rowsTableHtml = (headers: string[], rows: string[][]) => `
  <table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`

export const openPrintableArchitectureDocument = (input: ArchitectureDocumentInput) => {
  const sections = buildArchitectureDocumentSections(input)
  const printable = window.open('', '_blank')
  if (!printable) return

  const sectionHtml = sections.map(section => {
    const content = [
      ...(section.paragraphs?.map(text => `<p>${escapeHtml(text)}</p>`) ?? []),
      section.nodes ? (section.nodes.length > 0 ? nodesTableHtml(section.nodes, input.currentDiagram.nodes, input.currentDiagram.connectors) : '<p>No elements in this section.</p>') : '',
      section.rows ? rowsTableHtml(section.title.includes('Relationship') ? ['Source', 'Relationship Type', 'Target', 'Label', 'Description'] : elementHeaders, section.rows) : ''
    ].join('')

    return `<section><h2>${escapeHtml(section.title)}</h2>${content || '<p>No records.</p>'}</section>`
  }).join('')

  printable.document.write(`<!doctype html>
<html>
  <head>
    <title>${escapeHtml(input.projectName)} - Architecture Documentation</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111827; margin: 40px; line-height: 1.45; }
      .actions { position: sticky; top: 0; padding: 12px 0; background: white; border-bottom: 1px solid #e5e7eb; }
      button { border: 1px solid #d1d5db; background: #111827; color: white; border-radius: 6px; padding: 8px 12px; font-weight: 600; cursor: pointer; }
      h1 { font-size: 30px; margin-bottom: 4px; }
      h2 { margin-top: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
      .meta { color: #4b5563; margin-bottom: 28px; }
      .diagram-image { max-width: 100%; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; }
      .diagram-message { border: 1px solid #fbbf24; background: #fffbeb; color: #92400e; padding: 10px 12px; border-radius: 8px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 7px; vertical-align: top; text-align: left; }
      th { background: #f3f4f6; }
      @media print { .actions { display: none; } body { margin: 24px; } section { break-inside: avoid; } }
    </style>
  </head>
  <body>
    <div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
    <h1>${escapeHtml(input.projectName)}</h1>
    <div class="meta">Diagram: ${escapeHtml(input.currentDiagram.name)}<br/>Generated: ${escapeHtml(new Date().toLocaleString())}<br/>Diagrams in project: ${input.diagrams.length}</div>
    <section>
      <h2>Architecture Diagram</h2>
      ${input.diagramImageDataUrl
        ? `<img class="diagram-image" src="${input.diagramImageDataUrl}" alt="Architecture diagram"/>`
        : '<p class="diagram-message">Diagram image could not be generated. The textual documentation is still available below.</p>'}
    </section>
    ${sectionHtml}
  </body>
</html>`)
  printable.document.close()
}
