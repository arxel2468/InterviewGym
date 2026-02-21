import { Question, TargetRole } from './index'

export const TECHNICAL_QUESTIONS: Question[] = [
  // ===== FRONTEND =====
  {
    id: 'fe_react_1',
    category: 'react',
    question:
      'Explain the difference between state and props in React. When would you use each?',
    followUps: [
      'How does lifting state up work?',
      'What are the performance implications of prop drilling?',
      'When would you reach for Context vs props?',
    ],
    lookingFor: [
      'immutability',
      'unidirectional data flow',
      'component hierarchy',
    ],
    roles: ['frontend', 'fullstack'],
  },
  {
    id: 'fe_react_2',
    category: 'react',
    question: 'What is the virtual DOM and why does React use it?',
    followUps: [
      'How does reconciliation work?',
      'What triggers a re-render?',
      'How would you optimize a slow React component?',
    ],
    lookingFor: ['diffing algorithm', 'batching', 'performance'],
    roles: ['frontend', 'fullstack'],
  },
  {
    id: 'fe_hooks_1',
    category: 'react',
    question: 'Explain useEffect. What are the dependency array rules?',
    followUps: [
      'What happens if you omit the dependency array?',
      'How do you clean up effects?',
      'When would you use useLayoutEffect instead?',
    ],
    lookingFor: ['lifecycle', 'cleanup', 'dependencies'],
    roles: ['frontend', 'fullstack'],
  },
  {
    id: 'fe_css_1',
    category: 'css',
    question: 'How does CSS specificity work? How do you resolve conflicts?',
    followUps: [
      "What's the order of specificity?",
      'How do CSS-in-JS solutions handle this?',
      'What are the pros and cons of !important?',
    ],
    lookingFor: ['specificity rules', 'cascade', 'practical solutions'],
    roles: ['frontend', 'fullstack'],
  },
  {
    id: 'fe_perf_1',
    category: 'performance',
    question: 'How would you improve the performance of a slow web page?',
    followUps: [
      'How would you diagnose the bottleneck?',
      'What tools would you use?',
      "What's the critical rendering path?",
    ],
    lookingFor: ['lighthouse', 'bundle size', 'lazy loading', 'caching'],
    roles: ['frontend', 'fullstack'],
  },

  // ===== BACKEND =====
  {
    id: 'be_api_1',
    category: 'apis',
    question:
      "What's the difference between REST and GraphQL? When would you choose each?",
    followUps: [
      'What are the downsides of GraphQL?',
      'How do you handle versioning in REST?',
      'What about gRPC?',
    ],
    lookingFor: ['trade-offs', 'over-fetching', 'schema'],
    roles: ['backend', 'fullstack'],
  },
  {
    id: 'be_db_1',
    category: 'databases',
    question: 'When would you use a SQL database vs NoSQL? Give examples.',
    followUps: [
      "What's ACID and why does it matter?",
      'How do you handle schema changes in production?',
      'What about time-series data?',
    ],
    lookingFor: ['consistency vs availability', 'use cases', 'trade-offs'],
    roles: ['backend', 'fullstack', 'data'],
  },
  {
    id: 'be_db_2',
    category: 'databases',
    question: 'How would you optimize a slow database query?',
    followUps: [
      'How do indexes work?',
      "What's an execution plan?",
      'When would you denormalize?',
    ],
    lookingFor: ['indexing', 'query analysis', 'normalization'],
    roles: ['backend', 'fullstack', 'data'],
  },
  {
    id: 'be_scale_1',
    category: 'scaling',
    question:
      "How would you scale an application that's getting too much traffic?",
    followUps: [
      "What's the difference between vertical and horizontal scaling?",
      'How do you handle session state?',
      'What role does caching play?',
    ],
    lookingFor: ['load balancing', 'statelessness', 'caching strategies'],
    roles: ['backend', 'fullstack', 'devops'],
  },
  {
    id: 'be_auth_1',
    category: 'security',
    question: 'How would you implement authentication in a web application?',
    followUps: [
      "What's the difference between authentication and authorization?",
      'How do JWTs work?',
      'What are common security vulnerabilities?',
    ],
    lookingFor: ['tokens', 'sessions', 'OAuth', 'security best practices'],
    roles: ['backend', 'fullstack'],
  },

  // ===== DATA =====
  {
    id: 'data_sql_1',
    category: 'sql',
    question:
      'Explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN.',
    followUps: [
      'When would you use a subquery vs a join?',
      "What's a window function?",
      'How would you find duplicates in a table?',
    ],
    lookingFor: ['join types', 'practical usage', 'query optimization'],
    roles: ['data', 'backend'],
  },
  {
    id: 'data_etl_1',
    category: 'data_engineering',
    question: "Describe an ETL pipeline you've built or would build.",
    followUps: [
      'How do you handle failures?',
      'What about data quality checks?',
      'How do you handle schema evolution?',
    ],
    lookingFor: ['extraction', 'transformation', 'loading', 'error handling'],
    roles: ['data'],
  },
  {
    id: 'data_ml_1',
    category: 'machine_learning',
    question:
      'Explain the difference between overfitting and underfitting. How do you prevent them?',
    followUps: [
      "What's cross-validation?",
      'How do you choose the right model?',
      "What's the bias-variance tradeoff?",
    ],
    lookingFor: ['regularization', 'validation', 'model selection'],
    roles: ['data'],
  },

  // ===== DEVOPS =====
  {
    id: 'devops_docker_1',
    category: 'containers',
    question: 'Explain containers and how Docker works.',
    followUps: [
      "What's the difference between a container and a VM?",
      'How do you optimize Docker image size?',
      "What's a multi-stage build?",
    ],
    lookingFor: ['isolation', 'layers', 'efficiency'],
    roles: ['devops', 'backend', 'fullstack'],
  },
  {
    id: 'devops_k8s_1',
    category: 'kubernetes',
    question: 'What problems does Kubernetes solve? When would you use it?',
    followUps: [
      "What's a pod vs a deployment?",
      'How does service discovery work?',
      "What about when you DON'T need Kubernetes?",
    ],
    lookingFor: ['orchestration', 'scaling', 'complexity trade-offs'],
    roles: ['devops'],
  },
  {
    id: 'devops_cicd_1',
    category: 'cicd',
    question: "Describe a CI/CD pipeline you've set up or worked with.",
    followUps: [
      'How do you handle rollbacks?',
      'What tests run in the pipeline?',
      'How do you manage secrets?',
    ],
    lookingFor: ['automation', 'testing', 'deployment strategies'],
    roles: ['devops', 'backend', 'fullstack'],
  },

  // ===== GENERAL =====
  {
    id: 'gen_debug_1',
    category: 'debugging',
    question: 'Walk me through how you debug a production issue.',
    followUps: [
      'How do you prioritize when multiple things are broken?',
      "What's your logging strategy?",
      'How do you prevent it from happening again?',
    ],
    lookingFor: ['systematic approach', 'observability', 'postmortem'],
    roles: ['frontend', 'backend', 'fullstack', 'devops'],
  },
  {
    id: 'gen_arch_1',
    category: 'architecture',
    question:
      "What's the difference between monolithic and microservices architecture?",
    followUps: [
      'When would you choose one over the other?',
      'What are the operational costs of microservices?',
      'How do services communicate?',
    ],
    lookingFor: ['trade-offs', 'complexity', 'team structure'],
    roles: ['backend', 'fullstack', 'devops'],
  },
]

export function getTechnicalQuestionsForRole(
  role: TargetRole,
  count: number = 6
): Question[] {
  const roleQuestions = TECHNICAL_QUESTIONS.filter(
    (q) => !q.roles || q.roles.includes(role)
  )

  // Shuffle and pick
  const shuffled = [...roleQuestions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
