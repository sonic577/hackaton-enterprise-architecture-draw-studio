import type { ConnectorType, Diagram, DiagramConnector, DiagramNode } from '../types'
import type { DiagramTreeItem } from '../components/Layout/DiagramExplorer'
import { layoutBpmnView } from '../utils/bpmnLayout'

export interface DemoProject {
  name: string
  currentDiagramId: string
  diagrams: Diagram[]
  diagramTree: DiagramTreeItem[]
}

const evidence = ['Contoso Farmacy demo fixture']

const node = (
  id: string,
  type: string,
  title: string,
  description: string,
  layer: string,
  x: number,
  y: number,
  width = 220,
  height = 130,
  extra: Partial<DiagramNode> = {}
): DiagramNode => ({
  id,
  type,
  name: title,
  title,
  description,
  layer,
  position: { x, y },
  width,
  height,
  status: 'confirmed',
  evidence,
  ...extra
})

const connector = (
  id: string,
  sourceId: string,
  targetId: string,
  type: ConnectorType,
  label: string,
  description = label
): DiagramConnector => ({
  id,
  sourceId,
  targetId,
  type,
  label,
  description,
  lineStyle: type === 'flow' || type === 'sequence_flow' ? 'solid' : 'dashed',
  startMarker: 'none',
  endMarker: type === 'association' || type === 'related_to' ? 'none' : 'arrow',
  status: 'confirmed',
  evidence
})

const objectives = [
  ['SO-01', 'Become the number one pharmacy in the city by 2030'],
  ['SO-02', 'Reduce customer waiting time to under 10 minutes'],
  ['SO-03', 'Decrease customer abandonment'],
  ['SO-04', 'Improve operational efficiency'],
  ['SO-05', 'Enable inventory visibility before checkout'],
  ['SO-06', 'Improve technology performance']
]

const gaps = [
  ['GAP-01', 'Single queue for all requests'],
  ['GAP-02', 'No pre-validation of prescription needs'],
  ['GAP-03', 'No prior availability check'],
  ['GAP-04', 'Manual validation stops service flow'],
  ['GAP-05', 'No operational dashboard'],
  ['GAP-06', 'Waits of 20 to 40 minutes'],
  ['GAP-07', 'Customers abandon the line'],
  ['GAP-08', 'Billing and infrastructure performance may be slowing down service']
]

const recommendations = [
  ['REC-01', 'Separate quick purchases from prescription requests'],
  ['REC-02', 'Create a fast pickup flow'],
  ['REC-03', 'Add inventory lookup before queue entry'],
  ['REC-04', 'Introduce prescription pre-validation'],
  ['REC-05', 'Use queue triage at intake'],
  ['REC-06', 'Create a pharmacy operations dashboard'],
  ['REC-07', 'Integrate sales and inventory systems'],
  ['REC-08', 'Standardize billing handoff'],
  ['REC-09', 'Measure billing response time'],
  ['REC-10', 'Assign clear roles for validation and fulfillment'],
  ['REC-11', 'Improve exception handling for unavailable products'],
  ['REC-12', 'Separate process problems from technology problems'],
  ['REC-13', 'Plan technology refresh for store operations']
]

const createMotivationView = (): Diagram => ({
  id: 'demo-motivation-view',
  name: 'Motivation View',
  nodes: [
    node(
      'demo-mission',
      'Mission',
      'Mission',
      'Serve pharmacy customers quickly, safely, and with reliable access to essential products.',
      'motivation',
      160,
      160,
      220,
      130,
      {
        linkedDiagramId: 'demo-strategic-objectives-board',
        linkedDiagramName: 'Strategic Objectives Board',
        navigationLabel: 'Open strategic objectives'
      }
    ),
    node(
      'demo-vision',
      'Vision',
      'Vision',
      'Become the preferred neighborhood pharmacy through faster service, better guidance, and dependable fulfillment.',
      'motivation',
      460,
      160,
      250,
      130,
      {
        linkedDiagramId: 'demo-strategic-objectives-board',
        linkedDiagramName: 'Strategic Objectives Board',
        navigationLabel: 'Open strategic objectives'
      }
    )
  ],
  connectors: []
})

const createObjectivesBoard = (): Diagram => ({
  id: 'demo-strategic-objectives-board',
  name: 'Strategic Objectives Board',
  nodes: objectives.map(([code, title], index) => {
    const navigationByObjective: Record<string, Partial<DiagramNode>> = {
      'SO-02': {
        linkedDiagramId: 'demo-gap-analysis-view',
        linkedDiagramName: 'Gap Analysis View',
        focusNodeIds: ['demo-gap-06', 'demo-rec-09'],
        navigationLabel: 'Open related gaps'
      },
      'SO-03': {
        linkedDiagramId: 'demo-traceability-view',
        linkedDiagramName: 'Traceability View',
        focusNodeIds: ['demo-trace-so', 'demo-trace-gap'],
        navigationLabel: 'Open traceability'
      },
      'SO-04': {
        linkedDiagramId: 'demo-business-architecture-view',
        linkedDiagramName: 'Business Architecture View',
        focusNodeIds: ['demo-current-process', 'demo-future-process'],
        navigationLabel: 'Open business architecture'
      },
      'SO-06': {
        linkedDiagramId: 'demo-technology-view',
        linkedDiagramName: 'Technology View',
        focusNodeIds: ['demo-database-server', 'demo-local-network', 'demo-invoice-printer'],
        navigationLabel: 'Open technology view'
      }
    }

    return node(
      `demo-${code.toLowerCase()}`,
      'Objective',
      `${code} - ${title}`,
      title,
      'motivation',
      120 + (index % 3) * 280,
      130 + Math.floor(index / 3) * 180,
      240,
      130,
      navigationByObjective[code] ?? {}
    )
  }),
  connectors: []
})

const createBusinessArchitectureView = (): Diagram => ({
  id: 'demo-business-architecture-view',
  name: 'Business Architecture View',
  nodes: [
    node('demo-customer', 'Actor', 'Customer', 'Person visiting the pharmacy to request products, guidance, or prescription fulfillment.', 'business', 120, 120),
    node('demo-pharmacy-assistant', 'Role', 'Pharmacy Assistant', 'Receives requests, checks availability, and guides customers through the service flow.', 'business', 390, 120),
    node('demo-cashier', 'Role', 'Cashier', 'Registers payment and completes the billing handoff.', 'business', 660, 120),
    node(
      'demo-current-process',
      'Business Process',
      'Current Process',
      'As-is store service flow. Open the linked BPMN diagram for the operational details.',
      'process',
      390,
      330,
      240,
      140,
      {
        linkedDiagramId: 'demo-as-is-process-bpmn',
        linkedDiagramName: 'As-Is Process BPMN',
        focusNodeIds: ['demo-bpmn-wait', 'demo-bpmn-prescription-gw', 'demo-bpmn-invoice-gw'],
        navigationLabel: 'Open as-is process'
      }
    ),
    node(
      'demo-future-process',
      'Business Process',
      'Future-State Process',
      'Target service flow with triage, pre-validation, inventory lookup, and clearer technology separation.',
      'process',
      700,
      330,
      250,
      140,
      {
        linkedDiagramId: 'demo-future-state-process-bpmn',
        linkedDiagramName: 'Future-State Process BPMN',
        navigationLabel: 'Open future-state process'
      }
    )
  ],
  connectors: [
    connector('demo-business-conn-1', 'demo-customer', 'demo-current-process', 'related_to', 'requests service'),
    connector('demo-business-conn-2', 'demo-pharmacy-assistant', 'demo-current-process', 'supports', 'performs intake'),
    connector('demo-business-conn-3', 'demo-cashier', 'demo-current-process', 'supports', 'handles payment'),
    connector('demo-business-conn-4', 'demo-current-process', 'demo-future-process', 'supports', 'redesigned by')
  ]
})

const createAsIsProcessBpmn = (): Diagram => {
  const lanes = [
    ['demo-lane-customer', 'Customer', 55],
    ['demo-lane-assistant', 'Pharmacy Assistant', 210],
    ['demo-lane-pos', 'Sales / POS', 365],
    ['demo-lane-inventory', 'Inventory / Fulfillment', 520],
    ['demo-lane-technology', 'Technology / Infrastructure', 675]
  ]
  const laneNodes = lanes.map(([id, title, y]) =>
    node(id as string, 'bpmn_lane', title as string, `${title} lane`, 'BPMN / Process Engineering', 60, Number(y), 3600, 140, {
      category: 'Swimlanes',
      bpmnType: 'Lane'
    })
  )
  const processNodes = [
    node('demo-bpmn-start', 'bpmn_start_event', 'Start', 'Customer starts the pharmacy visit.', 'BPMN / Process Engineering', 150, 95, 90, 90, { category: 'Events', bpmnType: 'Start Event' }),
    node('demo-bpmn-arrive', 'bpmn_user_task', 'Customer arrives', 'Customer arrives.', 'BPMN / Process Engineering', 330, 95, 180, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-queue', 'bpmn_user_task', 'Join general queue', 'Customer joins general queue.', 'BPMN / Process Engineering', 560, 95, 190, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-wait', 'bpmn_user_task', 'Customer waits', 'Customer waits in the general queue.', 'BPMN / Process Engineering', 790, 95, 180, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-request', 'bpmn_user_task', 'Receive request', 'Assistant receives request.', 'BPMN / Process Engineering', 1020, 250, 190, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-identify', 'bpmn_user_task', 'Identify need', 'Assistant identifies need.', 'BPMN / Process Engineering', 1250, 250, 180, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-availability', 'bpmn_service_task', 'Check availability', 'Assistant checks availability.', 'BPMN / Process Engineering', 1480, 560, 190, 110, {
      category: 'Activities',
      bpmnType: 'Service Task',
      architectureAnnotations: [{
        id: 'ann-inventory-check',
        title: 'Inventory check',
        text: 'Uses Inventory System and reads Product / Inventory Item data.',
        targetDiagramId: 'demo-application-view',
        targetNodeIds: ['demo-inventory-system'],
        icon: 'inventory_2'
      }]
    }),
    node('demo-bpmn-prescription-gw', 'bpmn_exclusive_gateway_x', 'Prescription validation needed?', 'Determine whether prescription validation is needed.', 'BPMN / Process Engineering', 1710, 250, 140, 140, { category: 'Gateways', bpmnType: 'Exclusive Gateway' }),
    node('demo-bpmn-validate', 'bpmn_user_task', 'Validate prescription', 'Assistant validates prescription if needed.', 'BPMN / Process Engineering', 1950, 250, 200, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-confirm', 'bpmn_user_task', 'Confirm product and price', 'Assistant confirms product and price.', 'BPMN / Process Engineering', 2180, 250, 210, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-register', 'bpmn_service_task', 'Register sale', 'Sale is registered.', 'BPMN / Process Engineering', 2410, 405, 180, 110, {
      category: 'Activities',
      bpmnType: 'Service Task',
      architectureAnnotations: [{
        id: 'ann-sales-system',
        title: 'Sales system',
        text: 'Uses Sales System and writes Sale data.',
        targetDiagramId: 'demo-application-view',
        targetNodeIds: ['demo-sales-system'],
        icon: 'point_of_sale'
      }]
    }),
    node('demo-bpmn-invoice-generate', 'bpmn_service_task', 'Generate invoice', 'Billing application generates invoice.', 'BPMN / Process Engineering', 2640, 715, 190, 110, {
      category: 'Activities',
      bpmnType: 'Service Task',
      architectureAnnotations: [{
        id: 'ann-billing-tech',
        title: 'Billing technology dependency',
        text: 'Invoice generation may be delayed by Billing Application, Sales Database, Database Server, Local Network or Invoice Printer.',
        targetDiagramId: 'demo-technology-view',
        targetNodeIds: ['demo-billing-application', 'demo-sales-database', 'demo-database-server', 'demo-local-network', 'demo-invoice-printer'],
        icon: 'memory'
      }]
    }),
    node('demo-bpmn-pay', 'bpmn_user_task', 'Customer pays', 'Customer pays.', 'BPMN / Process Engineering', 2870, 95, 170, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-invoice-gw', 'bpmn_exclusive_gateway_x', 'Invoice required?', 'Determine whether an invoice must be printed.', 'BPMN / Process Engineering', 3100, 405, 130, 130, { category: 'Gateways', bpmnType: 'Exclusive Gateway' }),
    node('demo-bpmn-print-invoice', 'bpmn_service_task', 'Print invoice', 'Invoice is printed if required.', 'BPMN / Process Engineering', 3330, 715, 180, 110, {
      category: 'Activities',
      bpmnType: 'Service Task',
      architectureAnnotations: [{
        id: 'ann-printer-dependency',
        title: 'Printer dependency',
        text: 'Printing delay may block the customer-facing flow.',
        targetDiagramId: 'demo-technology-view',
        targetNodeIds: ['demo-invoice-printer', 'demo-local-network', 'demo-pos-workstation'],
        icon: 'print'
      }]
    }),
    node('demo-bpmn-prepare', 'bpmn_user_task', 'Prepare or retrieve product', 'Product is prepared or retrieved.', 'BPMN / Process Engineering', 3560, 560, 220, 110, {
      category: 'Activities',
      bpmnType: 'User Task',
      architectureAnnotations: [{
        id: 'ann-inventory-data',
        title: 'Inventory dependency',
        text: 'Reads Inventory Item and product location.',
        targetDiagramId: 'demo-data-view',
        targetNodeIds: ['demo-product-data', 'demo-sales-database'],
        icon: 'database'
      }]
    }),
    node('demo-bpmn-deliver', 'bpmn_user_task', 'Deliver product', 'Product is delivered.', 'BPMN / Process Engineering', 3790, 560, 180, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-complete', 'bpmn_user_task', 'Attention completed', 'Attention is completed.', 'BPMN / Process Engineering', 4020, 95, 190, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-bpmn-end', 'bpmn_end_event', 'End', 'Attention completed.', 'BPMN / Process Engineering', 4250, 95, 90, 90, { category: 'Events', bpmnType: 'End Event' })
  ]

  return layoutBpmnView({
    id: 'demo-as-is-process-bpmn',
    name: 'As-Is Process BPMN',
    parentId: 'demo-business-architecture-view',
    parentNodeId: 'demo-current-process',
    nodes: [...laneNodes, ...processNodes],
    connectors: [
      connector('demo-bpmn-conn-1', 'demo-bpmn-start', 'demo-bpmn-arrive', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-2', 'demo-bpmn-arrive', 'demo-bpmn-queue', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-3', 'demo-bpmn-queue', 'demo-bpmn-wait', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-4', 'demo-bpmn-wait', 'demo-bpmn-request', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-5', 'demo-bpmn-request', 'demo-bpmn-identify', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-6', 'demo-bpmn-identify', 'demo-bpmn-availability', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-7', 'demo-bpmn-availability', 'demo-bpmn-prescription-gw', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-8', 'demo-bpmn-prescription-gw', 'demo-bpmn-validate', 'sequence_flow', 'Yes'),
      connector('demo-bpmn-conn-9', 'demo-bpmn-prescription-gw', 'demo-bpmn-confirm', 'sequence_flow', 'No'),
      connector('demo-bpmn-conn-10', 'demo-bpmn-validate', 'demo-bpmn-confirm', 'sequence_flow', 'Validated'),
      connector('demo-bpmn-conn-11', 'demo-bpmn-confirm', 'demo-bpmn-register', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-12', 'demo-bpmn-register', 'demo-bpmn-invoice-generate', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-13', 'demo-bpmn-invoice-generate', 'demo-bpmn-pay', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-14', 'demo-bpmn-pay', 'demo-bpmn-invoice-gw', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-15', 'demo-bpmn-invoice-gw', 'demo-bpmn-print-invoice', 'sequence_flow', 'Yes'),
      connector('demo-bpmn-conn-16', 'demo-bpmn-invoice-gw', 'demo-bpmn-prepare', 'sequence_flow', 'No'),
      connector('demo-bpmn-conn-17', 'demo-bpmn-print-invoice', 'demo-bpmn-prepare', 'sequence_flow', 'Printed'),
      connector('demo-bpmn-conn-18', 'demo-bpmn-prepare', 'demo-bpmn-deliver', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-19', 'demo-bpmn-deliver', 'demo-bpmn-complete', 'sequence_flow', 'Sequence Flow'),
      connector('demo-bpmn-conn-20', 'demo-bpmn-complete', 'demo-bpmn-end', 'sequence_flow', 'Sequence Flow')
    ]
  })
}

const createFutureStateProcessBpmn = (): Diagram => {
  const lanes = [
    ['demo-future-lane-customer', 'Customer', 55],
    ['demo-future-lane-assistant', 'Pharmacy Assistant', 210],
    ['demo-future-lane-technology', 'Technology / Infrastructure', 365],
    ['demo-future-lane-fulfillment', 'Inventory / Fulfillment', 520]
  ]
  const laneNodes = lanes.map(([id, title, y]) =>
    node(id as string, 'bpmn_lane', title as string, `${title} lane`, 'BPMN / Process Engineering', 60, Number(y), 2400, 140, {
      category: 'Swimlanes',
      bpmnType: 'Lane'
    })
  )
  const processNodes = [
    node('demo-future-start', 'bpmn_start_event', 'Start', 'Customer starts service.', 'BPMN / Process Engineering', 150, 95, 90, 90, { category: 'Events', bpmnType: 'Start Event' }),
    node('demo-future-triage', 'bpmn_user_task', 'Triage request', 'Classify request before joining a queue.', 'BPMN / Process Engineering', 340, 250, 180, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-future-inventory', 'bpmn_service_task', 'Check inventory', 'Check availability before payment.', 'BPMN / Process Engineering', 570, 405, 180, 110, { category: 'Activities', bpmnType: 'Service Task' }),
    node('demo-future-prevalidate', 'bpmn_user_task', 'Pre-validate prescription', 'Validate prescription before cashier handoff.', 'BPMN / Process Engineering', 800, 250, 210, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-future-pay', 'bpmn_user_task', 'Pay or pickup', 'Customer pays or proceeds to pickup flow.', 'BPMN / Process Engineering', 1040, 95, 180, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-future-prepare', 'bpmn_user_task', 'Prepare product', 'Prepare or retrieve product in fulfillment lane.', 'BPMN / Process Engineering', 1270, 560, 180, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-future-deliver', 'bpmn_user_task', 'Deliver product', 'Deliver product and close service.', 'BPMN / Process Engineering', 1500, 560, 180, 110, { category: 'Activities', bpmnType: 'User Task' }),
    node('demo-future-end', 'bpmn_end_event', 'End', 'Service completed.', 'BPMN / Process Engineering', 1730, 95, 90, 90, { category: 'Events', bpmnType: 'End Event' })
  ]

  return layoutBpmnView({
    id: 'demo-future-state-process-bpmn',
    name: 'Future-State Process BPMN',
    parentId: 'demo-business-architecture-view',
    parentNodeId: 'demo-future-process',
    nodes: [...laneNodes, ...processNodes],
    connectors: [
      connector('demo-future-conn-1', 'demo-future-start', 'demo-future-triage', 'sequence_flow', 'Sequence Flow'),
      connector('demo-future-conn-2', 'demo-future-triage', 'demo-future-inventory', 'sequence_flow', 'Sequence Flow'),
      connector('demo-future-conn-3', 'demo-future-inventory', 'demo-future-prevalidate', 'sequence_flow', 'Sequence Flow'),
      connector('demo-future-conn-4', 'demo-future-prevalidate', 'demo-future-pay', 'sequence_flow', 'Sequence Flow'),
      connector('demo-future-conn-5', 'demo-future-pay', 'demo-future-prepare', 'sequence_flow', 'Sequence Flow'),
      connector('demo-future-conn-6', 'demo-future-prepare', 'demo-future-deliver', 'sequence_flow', 'Sequence Flow'),
      connector('demo-future-conn-7', 'demo-future-deliver', 'demo-future-end', 'sequence_flow', 'Sequence Flow')
    ]
  })
}

const createDataView = (): Diagram => ({
  id: 'demo-data-view',
  name: 'Data View',
  nodes: [
    node('demo-sales-database', 'Data Store', 'Sales Database', 'Stores sales transactions, customer service events, and billing records.', 'data', 160, 160, 240, 130, {
      linkedDiagramId: 'demo-technology-view',
      linkedDiagramName: 'Technology View',
      focusNodeIds: ['demo-database-server'],
      navigationLabel: 'Open hosting technology'
    }),
    node('demo-customer-data', 'Data Entity', 'Customer', 'Customer request and service context.', 'data', 470, 120),
    node('demo-product-data', 'Data Entity', 'Product', 'Product catalog and availability information.', 'data', 470, 310)
  ],
  connectors: [
    connector('demo-data-conn-1', 'demo-sales-database', 'demo-customer-data', 'contains', 'stores customer requests'),
    connector('demo-data-conn-2', 'demo-sales-database', 'demo-product-data', 'contains', 'stores product sales')
  ]
})

const createApplicationView = (): Diagram => ({
  id: 'demo-application-view',
  name: 'Application View',
  nodes: [
    node('demo-sales-system', 'System', 'Sales System', 'Supports store sales registration and customer service flow.', 'application', 120, 160),
    node('demo-inventory-system', 'System', 'Inventory System', 'Provides product availability and stock status.', 'application', 410, 160),
    node('demo-billing-application', 'Application Component', 'Billing Application', 'Produces invoices and supports payment confirmation.', 'application', 700, 160, 240, 130, {
      linkedDiagramId: 'demo-application-view',
      linkedDiagramName: 'Application View',
      focusNodeIds: ['demo-billing-application'],
      navigationLabel: 'Open application view'
    })
  ],
  connectors: [
    connector('demo-app-conn-1', 'demo-sales-system', 'demo-inventory-system', 'uses', 'checks availability'),
    connector('demo-app-conn-2', 'demo-sales-system', 'demo-billing-application', 'uses', 'registers billing')
  ]
})

const createTechnologyView = (): Diagram => ({
  id: 'demo-technology-view',
  name: 'Technology View',
  nodes: [
    node('demo-billing-application', 'Application Component', 'Billing Application', 'Application dependency involved in invoice generation latency.', 'technology', 120, 120, 240, 130, {
      linkedDiagramId: 'demo-application-view',
      linkedDiagramName: 'Application View',
      focusNodeIds: ['demo-billing-application'],
      navigationLabel: 'Open application view'
    }),
    node('demo-sales-database', 'Data Store', 'Sales Database', 'Operational database used by billing and sales transactions.', 'technology', 420, 120, 230, 130, {
      linkedDiagramId: 'demo-data-view',
      linkedDiagramName: 'Data View',
      focusNodeIds: ['demo-sales-database'],
      navigationLabel: 'Open data view'
    }),
    node('demo-database-server', 'Server', 'Database Server', 'Hosts operational data stores for the pharmacy.', 'technology', 120, 330, 220, 130, {
      linkedDiagramId: 'demo-technology-view',
      linkedDiagramName: 'Technology View',
      focusNodeIds: ['demo-database-server'],
      navigationLabel: 'Open technology view'
    }),
    node('demo-local-network', 'Network', 'Local Network', 'Connects POS, inventory, billing, and printer devices.', 'technology', 720, 120, 220, 130, {
      linkedDiagramId: 'demo-technology-view',
      linkedDiagramName: 'Technology View',
      focusNodeIds: ['demo-local-network'],
      navigationLabel: 'Open technology view'
    }),
    node('demo-pos-workstation', 'Device', 'Point-of-Sale Workstation', 'Store workstation used to register sales and interact with billing.', 'technology', 420, 330, 240, 130),
    node('demo-invoice-printer', 'Device', 'Invoice Printer', 'Prints invoices and transaction receipts.', 'technology', 720, 330, 220, 130, {
      linkedDiagramId: 'demo-technology-view',
      linkedDiagramName: 'Technology View',
      focusNodeIds: ['demo-invoice-printer'],
      navigationLabel: 'Open technology view'
    })
  ],
  connectors: [
    connector('demo-tech-conn-1', 'demo-billing-application', 'demo-sales-database', 'uses', 'reads and writes'),
    connector('demo-tech-conn-2', 'demo-sales-database', 'demo-database-server', 'depends_on', 'hosted on'),
    connector('demo-tech-conn-3', 'demo-local-network', 'demo-database-server', 'uses', 'connects'),
    connector('demo-tech-conn-4', 'demo-pos-workstation', 'demo-local-network', 'depends_on', 'network access'),
    connector('demo-tech-conn-5', 'demo-local-network', 'demo-invoice-printer', 'uses', 'prints invoices')
  ]
})

const createGapAnalysisView = (): Diagram => ({
  id: 'demo-gap-analysis-view',
  name: 'Gap Analysis View',
  nodes: [
    ...gaps.map(([code, title], index) =>
      node(`demo-${code.toLowerCase()}`, 'Gap', `${code} - ${title}`, title, 'risk', 120 + (index % 4) * 250, 120 + Math.floor(index / 4) * 170, 220, 120, code === 'GAP-08'
        ? {
            linkedDiagramId: 'demo-technology-view',
            linkedDiagramName: 'Technology View',
            focusNodeIds: ['demo-database-server', 'demo-local-network', 'demo-invoice-printer'],
            navigationLabel: 'Open technology impact'
          }
        : {})
    ),
    ...recommendations.map(([code, title], index) =>
      node(`demo-${code.toLowerCase()}`, 'Recommendation', `${code} - ${title}`, title, 'recommendation', 120 + (index % 4) * 250, 500 + Math.floor(index / 4) * 165, 220, 120, code === 'REC-09'
        ? {
            linkedDiagramId: 'demo-technology-view',
            linkedDiagramName: 'Technology View',
            focusNodeIds: ['demo-database-server'],
            navigationLabel: 'Open technology metrics'
          }
        : code === 'REC-12'
          ? {
              linkedDiagramId: 'demo-gap-analysis-view',
              linkedDiagramName: 'Gap Analysis View',
              focusNodeIds: ['demo-gap-04', 'demo-gap-08'],
              navigationLabel: 'Open gap separation'
            }
          : {})
    ),
    node(
      'demo-option-g',
      'Solution Option',
      'Option G - Infrastructure Performance Improvement',
      'Improve billing, database, network, and printing performance to reduce service delays.',
      'recommendation',
      870,
      1160,
      260,
      125,
      {
        linkedDiagramId: 'demo-technology-view',
        linkedDiagramName: 'Technology View',
        focusNodeIds: ['demo-database-server', 'demo-local-network', 'demo-invoice-printer'],
        navigationLabel: 'Open technology view'
      }
    )
  ],
  connectors: []
})

const createTraceabilityView = (): Diagram => ({
  id: 'demo-traceability-view',
  name: 'Traceability View',
  nodes: [
    node('demo-trace-so', 'Objective', 'SO-02 - Reduce waiting time', 'Strategic objective selected for traceability.', 'motivation', 120, 150, 240, 130, {
      linkedDiagramId: 'demo-gap-analysis-view',
      linkedDiagramName: 'Gap Analysis View',
      focusNodeIds: ['demo-gap-06'],
      navigationLabel: 'Open related gap'
    }),
    node('demo-trace-gap', 'Gap', 'GAP-06 - Long waits', 'Customers wait 20 to 40 minutes in the current flow.', 'risk', 420, 150, 230),
    node('demo-trace-rec', 'Recommendation', 'REC-06 - Operations dashboard', 'Create dashboard visibility for queue and wait performance.', 'recommendation', 720, 150, 250),
    node('demo-trace-app', 'Application Component', 'Sales System', 'System that can provide service event data.', 'application', 1020, 150, 230, 130, {
      linkedDiagramId: 'demo-application-view',
      linkedDiagramName: 'Application View',
      focusNodeIds: ['demo-sales-system'],
      navigationLabel: 'Open application view'
    }),
    node('demo-trace-billing', 'Application Component', 'Billing Application', 'Billing application affects invoice generation and response time.', 'application', 1320, 150, 240, 130, {
      linkedDiagramId: 'demo-application-view',
      linkedDiagramName: 'Application View',
      focusNodeIds: ['demo-billing-application'],
      navigationLabel: 'Open application view'
    }),
    node('demo-trace-data', 'Data Store', 'Sales Database', 'Stores events needed for reporting and analysis.', 'data', 1620, 150, 230, 130, {
      linkedDiagramId: 'demo-data-view',
      linkedDiagramName: 'Data View',
      focusNodeIds: ['demo-sales-database'],
      navigationLabel: 'Open data view'
    }),
    node('demo-trace-db-server', 'Server', 'Database Server', 'Infrastructure hosting the sales database.', 'technology', 1020, 370, 230, 130, {
      linkedDiagramId: 'demo-technology-view',
      linkedDiagramName: 'Technology View',
      focusNodeIds: ['demo-database-server'],
      navigationLabel: 'Open technology view'
    }),
    node('demo-trace-network', 'Network', 'Local Network', 'Store network path for POS and billing operations.', 'technology', 1320, 370, 230, 130, {
      linkedDiagramId: 'demo-technology-view',
      linkedDiagramName: 'Technology View',
      focusNodeIds: ['demo-local-network'],
      navigationLabel: 'Open technology view'
    }),
    node('demo-trace-printer', 'Device', 'Invoice Printer', 'Printer used when invoices are required.', 'technology', 1620, 370, 230, 130, {
      linkedDiagramId: 'demo-technology-view',
      linkedDiagramName: 'Technology View',
      focusNodeIds: ['demo-invoice-printer'],
      navigationLabel: 'Open technology view'
    }),
    node('demo-trace-option-g', 'Solution Option', 'Option G - Infrastructure Performance Improvement', 'Technology option that addresses infrastructure-related delays.', 'recommendation', 720, 370, 250, 130, {
      linkedDiagramId: 'demo-technology-view',
      linkedDiagramName: 'Technology View',
      focusNodeIds: ['demo-database-server', 'demo-local-network', 'demo-invoice-printer'],
      navigationLabel: 'Open technology view'
    })
  ],
  connectors: [
    connector('demo-trace-conn-1', 'demo-trace-so', 'demo-trace-gap', 'impacts', 'measured by'),
    connector('demo-trace-conn-2', 'demo-trace-gap', 'demo-trace-rec', 'supports', 'addressed by'),
    connector('demo-trace-conn-3', 'demo-trace-rec', 'demo-trace-app', 'supports', 'implemented through'),
    connector('demo-trace-conn-4', 'demo-trace-app', 'demo-trace-billing', 'uses', 'uses billing'),
    connector('demo-trace-conn-5', 'demo-trace-billing', 'demo-trace-data', 'uses', 'uses data'),
    connector('demo-trace-conn-6', 'demo-trace-data', 'demo-trace-db-server', 'depends_on', 'hosted on'),
    connector('demo-trace-conn-7', 'demo-trace-app', 'demo-trace-network', 'depends_on', 'network path'),
    connector('demo-trace-conn-8', 'demo-trace-billing', 'demo-trace-printer', 'uses', 'prints invoice'),
    connector('demo-trace-conn-9', 'demo-trace-rec', 'demo-trace-option-g', 'supports', 'solution option')
  ]
})

export const createContosoFarmacyDemoProject = (): DemoProject => {
  const diagrams = [
    createMotivationView(),
    createObjectivesBoard(),
    createBusinessArchitectureView(),
    createAsIsProcessBpmn(),
    createFutureStateProcessBpmn(),
    createDataView(),
    createApplicationView(),
    createTechnologyView(),
    createGapAnalysisView(),
    createTraceabilityView()
  ]

  return {
    name: 'Contoso Farmacy - Enterprise Architecture Demo',
    currentDiagramId: 'demo-motivation-view',
    diagrams,
    diagramTree: [
      { id: 'demo-folder-enterprise', kind: 'folder', name: 'Enterprise Architecture', expanded: true },
      ...diagrams.map(diagram => ({
        id: `demo-tree-${diagram.id}`,
        kind: 'diagram' as const,
        name: diagram.name,
        diagramId: diagram.id,
        diagramType: diagram.name.toLowerCase().includes('bpmn') ? 'bpmn' : undefined,
        parentId: 'demo-folder-enterprise',
        parentNodeId: diagram.parentNodeId,
        linkedFromNodeId: diagram.parentNodeId
      }))
    ]
  }
}
