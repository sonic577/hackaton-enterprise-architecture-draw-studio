import { Diagram } from '../types'

// Root diagram: Customer Onboarding
export const rootDiagram: Diagram = {
  id: 'diagram-root',
  nodes: [
    {
      id: 'node-mission',
      type: 'mission',
      title: 'Customer Success',
      description: 'Empower customers to get value quickly',
      position: { x: 100, y: 100 },
      status: 'confirmed',
      impact: 'Core business driver',
      evidence: ['Customer surveys', 'Market research']
    },
    {
      id: 'node-process-1',
      type: 'process',
      title: 'Account Provisioning',
      description: 'Automated setup of customer accounts and permissions',
      position: { x: 100, y: 300 },
      status: 'confirmed',
      properties: {
        frequency: 'daily',
        automationLevel: '30%'
      },
      impact: 'Delays customer onboarding by 3-5 days',
      childDiagramId: 'diagram-node-process-1' // This will be created on demand
    },
    {
      id: 'node-bottleneck',
      type: 'bottleneck',
      title: 'Manual IT Setup',
      description: 'IT team manually creates accounts and permissions',
      position: { x: 350, y: 300 },
      status: 'confirmed',
      properties: {
        avgDelayHours: 72,
        severity: 'high'
      },
      impact: 'Critical blocker in onboarding workflow'
    },
    {
      id: 'node-solution',
      type: 'solution',
      title: 'Self-Service Portal',
      description: 'Web app for automated provisioning',
      position: { x: 350, y: 500 },
      status: 'pending',
      properties: {
        type: 'application',
        effort: 'medium',
        estimatedROI: '350%'
      }
    },
    {
      id: 'node-system',
      type: 'system',
      title: 'Identity System',
      description: 'Central identity and access management',
      position: { x: 600, y: 400 },
      status: 'confirmed',
      properties: {
        status: 'operational'
      }
    }
  ],
  connectors: [
    {
      id: 'conn-1',
      sourceId: 'node-mission',
      targetId: 'node-process-1',
      type: 'supports',
      label: 'supports',
      status: 'confirmed'
    },
    {
      id: 'conn-2',
      sourceId: 'node-process-1',
      targetId: 'node-bottleneck',
      type: 'contains',
      label: 'contains',
      impact: 'Bottleneck impacts process efficiency',
      status: 'confirmed'
    },
    {
      id: 'conn-3',
      sourceId: 'node-bottleneck',
      targetId: 'node-solution',
      type: 'related_to',
      label: 'addresses',
      status: 'inferred'
    },
    {
      id: 'conn-4',
      sourceId: 'node-solution',
      targetId: 'node-system',
      type: 'depends_on',
      label: 'depends on',
      status: 'confirmed'
    }
  ]
}

// Legacy export for backward compatibility
export const architectureData = rootDiagram
