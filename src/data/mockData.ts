import { Diagram } from '../types'

// Root diagram: Customer Onboarding
export const rootDiagram: Diagram = {
  id: 'diagram-root',
  name: 'Customer Onboarding',
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
      linkedDiagramId: 'diagram-account-provisioning'
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

export const accountProvisioningDiagram: Diagram = {
  id: 'diagram-account-provisioning',
  name: 'Account Provisioning',
  parentId: 'diagram-root',
  parentNodeId: 'node-process-1',
  nodes: [
    {
      id: 'node-request-intake',
      type: 'process',
      title: 'Access Request Intake',
      description: 'Customer access request is received and reviewed',
      position: { x: 100, y: 120 },
      status: 'confirmed'
    },
    {
      id: 'node-permission-review',
      type: 'process',
      title: 'Permission Review',
      description: 'Required roles and groups are validated before account setup',
      position: { x: 360, y: 120 },
      status: 'confirmed'
    },
    {
      id: 'node-account-creation',
      type: 'system',
      title: 'Account Creation',
      description: 'Identity system provisions the user account',
      position: { x: 620, y: 120 },
      status: 'pending'
    }
  ],
  connectors: [
    {
      id: 'conn-provisioning-1',
      sourceId: 'node-request-intake',
      targetId: 'node-permission-review',
      type: 'flow',
      label: 'then',
      status: 'confirmed'
    },
    {
      id: 'conn-provisioning-2',
      sourceId: 'node-permission-review',
      targetId: 'node-account-creation',
      type: 'flow',
      label: 'then',
      status: 'pending'
    }
  ]
}

export const mockDiagrams: Diagram[] = [
  rootDiagram,
  accountProvisioningDiagram
]

// Legacy export for backward compatibility
export const architectureData = rootDiagram
