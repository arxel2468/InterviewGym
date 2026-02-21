import { Question } from './index'

export const SYSTEM_DESIGN_QUESTIONS: Question[] = [
  {
    id: 'sd_url_1',
    category: 'system_design',
    question:
      'Design a URL shortener like bit.ly. Walk me through your approach.',
    followUps: [
      'How would you generate unique short codes?',
      'How would you handle high read traffic?',
      'What happens when a link expires?',
      'How would you prevent abuse?',
    ],
    lookingFor: ['hashing', 'database choice', 'caching', 'scalability'],
  },
  {
    id: 'sd_chat_1',
    category: 'system_design',
    question: 'Design a real-time chat application like Slack.',
    followUps: [
      'How would you handle message delivery guarantees?',
      'How do you scale WebSocket connections?',
      'How would you store message history?',
      'What about presence indicators?',
    ],
    lookingFor: [
      'websockets',
      'message queues',
      'database sharding',
      'pub/sub',
    ],
  },
  {
    id: 'sd_feed_1',
    category: 'system_design',
    question: 'Design a social media news feed like Twitter or Instagram.',
    followUps: [
      'Push vs pull model - what are the tradeoffs?',
      'How do you handle viral posts?',
      'How would you rank posts?',
      'What about real-time updates?',
    ],
    lookingFor: [
      'fan-out',
      'caching',
      'ranking algorithms',
      'read-heavy optimization',
    ],
  },
  {
    id: 'sd_ratelimit_1',
    category: 'system_design',
    question: 'Design a rate limiter for an API.',
    followUps: [
      'What algorithms would you consider?',
      'How do you handle distributed rate limiting?',
      'What happens when a user is rate limited?',
      'How do you handle burst traffic?',
    ],
    lookingFor: ['token bucket', 'sliding window', 'Redis', 'consistency'],
  },
  {
    id: 'sd_search_1',
    category: 'system_design',
    question: 'Design a search autocomplete system.',
    followUps: [
      'How would you collect and rank suggestions?',
      'How do you handle typos?',
      'What data structures would you use?',
      'How do you update suggestions in real-time?',
    ],
    lookingFor: ['trie', 'popularity ranking', 'caching', 'fuzzy matching'],
  },
  {
    id: 'sd_parking_1',
    category: 'system_design',
    question: 'Design a parking lot system.',
    followUps: [
      'How do you handle different vehicle sizes?',
      'How would you find available spots efficiently?',
      'What about payment processing?',
      'How do you handle concurrency?',
    ],
    lookingFor: ['object-oriented design', 'database schema', 'concurrency'],
  },
]

export function getSystemDesignQuestions(count: number = 2): Question[] {
  const shuffled = [...SYSTEM_DESIGN_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
