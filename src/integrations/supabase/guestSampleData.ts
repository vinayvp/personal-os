const daysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const daysAgoIso = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const VALUATION_CHECKPOINTS = [180, 150, 120, 90, 60, 45, 30, 15, 0];
const ASSET_VALUATION_TRAJECTORIES: Record<string, number[]> = {
  // inv_1: UTI Nifty 50 Index Fund (Solid compounding, +43.3% gain)
  inv_1: [168000, 174000, 183500, 181000, 194000, 202000, 208500, 212000, 215000],
  // inv_2: Parag Parikh Flexi Cap Fund (Consistent global growth, +45.4% gain)
  inv_2: [134000, 141000, 148500, 146000, 157000, 163500, 169000, 172000, 174500],
  // inv_3: Midcap High-Beta Momentum Basket (Rallied early, corrected, recovered to +3.0%)
  inv_3: [48000, 55000, 64000, 59000, 56500, 58000, 60200, 61100, 61800],
  // inv_4: Clean Energy & Solar Thematic ETF (Cyclical clean-tech dip, -12.0%)
  inv_4: [78000, 75000, 72000, 68500, 66000, 67500, 69000, 69800, 70400],
  // inv_5: HDFC Bank Fixed Deposit (Linear compounding accrual at 7.25% p.a., +7.25%)
  inv_5: [101200, 102400, 103600, 104800, 105700, 106200, 106700, 107000, 107250],
  // inv_6: Employee Provident Fund (Steady monthly statutory accrual at 8.25%, +13.0%)
  inv_6: [246000, 250500, 255000, 259500, 264000, 266500, 268800, 270000, 271200],
  // inv_7: Sovereign Gold Bond 2023 Series III (Precious metals secular bull run, +45.0%)
  inv_7: [74000, 77500, 81000, 84500, 88000, 90200, 92400, 93500, 94250],
  // inv_8: Ethereum Staking Vault (Classic crypto volatility cycle recovery, +13.0%)
  inv_8: [95000, 112000, 128000, 105000, 111000, 117000, 121500, 123000, 124300],
  // inv_9: Brookfield India REIT (Stable commercial office cash flows & yield, +11.7%)
  inv_9: [76500, 77800, 79000, 80200, 81500, 82200, 82900, 83400, 83800],
  // inv_10: Emergency Cash Reserve (Compounding liquid interest at 3.5%, +3.3%)
  inv_10: [150800, 151500, 152200, 153000, 153800, 154200, 154500, 154800, 155000],
};

const buildHistoricalValuations = () => {
  const result: any[] = [];
  for (const [invId, values] of Object.entries(ASSET_VALUATION_TRAJECTORIES)) {
    VALUATION_CHECKPOINTS.forEach((days, idx) => {
      result.push({
        id: `val_${invId}_${days}`,
        investment_id: invId,
        transaction_id: null,
        valuation_date: daysAgo(days),
        current_value: values[idx],
        metadata: null,
        created_at: daysAgoIso(days),
      });
    });
  }
  return result;
};

export const GUEST_SAMPLE_DATA: Record<string, any[]> = {
  habits: [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      title: 'Morning Workout & Stretch',
      name: 'Morning Workout & Stretch',
      color: '#10B981',
      icon: 'fitness_center',
      frequency_type: 'daily',
      target_count: 7,
      target_period: 'weekly',
      goal: '45 mins daily',
      created_at: daysAgoIso(30),
    },
    {
      id: 'a2222222-2222-2222-2222-222222222222',
      title: 'Read Technical Book / Whitepaper',
      name: 'Read Technical Book / Whitepaper',
      color: '#3B82F6',
      icon: 'menu_book',
      frequency_type: 'daily',
      target_count: 7,
      target_period: 'weekly',
      goal: '20 pages daily',
      created_at: daysAgoIso(25),
    },
    {
      id: 'a3333333-3333-3333-3333-333333333333',
      title: 'Complete 10 System Design Cases',
      name: 'Complete 10 System Design Cases',
      color: '#8B5CF6',
      icon: 'laptop',
      frequency_type: 'none',
      target_count: 10,
      target_period: 'total',
      goal: '10 cases total',
      created_at: daysAgoIso(20),
    },
    {
      id: 'a4444444-4444-4444-4444-444444444444',
      title: 'Cold Outreach & Mentorship Calls',
      name: 'Cold Outreach & Mentorship Calls',
      color: '#06B6D4',
      icon: 'work',
      frequency_type: 'custom',
      custom_days: [1, 3, 5],
      target_count: 3,
      target_period: 'weekly',
      goal: 'Mon, Wed, Fri',
      created_at: daysAgoIso(15),
    },
  ],

  habit_completions: [
    // Habit 1 (Daily, target 7/week - Checked in today, 4/7 this week, 4-day streak)
    {
      id: 'hc_1_today',
      habit_id: 'a1111111-1111-1111-1111-111111111111',
      completion_date: daysAgo(0),
      completed_at: daysAgoIso(0),
    },
    {
      id: 'hc_1_yest',
      habit_id: 'a1111111-1111-1111-1111-111111111111',
      completion_date: daysAgo(1),
      completed_at: daysAgoIso(1),
    },
    {
      id: 'hc_1_2days',
      habit_id: 'a1111111-1111-1111-1111-111111111111',
      completion_date: daysAgo(2),
      completed_at: daysAgoIso(2),
    },
    {
      id: 'hc_1_3days',
      habit_id: 'a1111111-1111-1111-1111-111111111111',
      completion_date: daysAgo(3),
      completed_at: daysAgoIso(3),
    },

    // Habit 2 (Daily, target 7/week - Unchecked today, 3/7 this week, 3-day active streak from yesterday)
    {
      id: 'hc_2_yest',
      habit_id: 'a2222222-2222-2222-2222-222222222222',
      completion_date: daysAgo(1),
      completed_at: daysAgoIso(1),
    },
    {
      id: 'hc_2_2days',
      habit_id: 'a2222222-2222-2222-2222-222222222222',
      completion_date: daysAgo(2),
      completed_at: daysAgoIso(2),
    },
    {
      id: 'hc_2_3days',
      habit_id: 'a2222222-2222-2222-2222-222222222222',
      completion_date: daysAgo(3),
      completed_at: daysAgoIso(3),
    },

    // Habit 3 (No frequency / total goal - 4 completions recorded towards 10)
    {
      id: 'hc_3_1',
      habit_id: 'a3333333-3333-3333-3333-333333333333',
      completion_date: daysAgo(1),
      completed_at: daysAgoIso(1),
    },
    {
      id: 'hc_3_2',
      habit_id: 'a3333333-3333-3333-3333-333333333333',
      completion_date: daysAgo(3),
      completed_at: daysAgoIso(3),
    },
    {
      id: 'hc_3_3',
      habit_id: 'a3333333-3333-3333-3333-333333333333',
      completion_date: daysAgo(5),
      completed_at: daysAgoIso(5),
    },
    {
      id: 'hc_3_4',
      habit_id: 'a3333333-3333-3333-3333-333333333333',
      completion_date: daysAgo(8),
      completed_at: daysAgoIso(8),
    },

    // Habit 4 (Custom days - Mon/Wed/Fri - 2/3 completions this week)
    {
      id: 'hc_4_1',
      habit_id: 'a4444444-4444-4444-4444-444444444444',
      completion_date: daysAgo(2),
      completed_at: daysAgoIso(2),
    },
    {
      id: 'hc_4_2',
      habit_id: 'a4444444-4444-4444-4444-444444444444',
      completion_date: daysAgo(4),
      completed_at: daysAgoIso(4),
    },
  ],

  todos: [
    {
      id: 't1',
      title: 'Conduct Architectural Review for Distributed Cache',
      description: 'Evaluate Redis vs Dragonfly for high-throughput user state session cache.',
      priority: 'high',
      category: 'Engineering',
      status: 'pending',
      completed: false,
      due_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 't2',
      title: 'Prepare Tech Talk: Modern React & Concurrency',
      description: 'Highlight React 19 Actions, Server Components, and optimistic UI patterns.',
      priority: 'medium',
      category: 'Work',
      status: 'pending',
      completed: false,
      due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 't3',
      title: 'Review Portfolio Guest Mode Architecture',
      description: 'Verify isolated data access and responsive views across devices.',
      priority: 'high',
      category: 'Projects',
      status: 'completed',
      completed: true,
      due_date: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 't4',
      title: 'Renew Cloud Infrastructure Subscriptions',
      description: 'Verify auto-billing on Vercel, Supabase, and AWS staging accounts.',
      priority: 'low',
      category: 'Admin',
      status: 'pending',
      completed: false,
      due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    },
  ],

  notes: [
    {
      id: 'n1',
      title: 'Distributed Systems: CAP Theorem & Consistency Models',
      content: `### Core Principles of Distributed Storage

- **Consistency**: Every read receives the most recent write or an error.
- **Availability**: Every request receives a non-error response, without guarantee that it contains the most recent write.
- **Partition Tolerance**: The system continues to operate despite arbitrary network partitions.

\`\`\`python
# Eventual consistency replica sync check
def verify_replica_sync(primary, replica):
    return replica.latest_wal_seq >= primary.committed_wal_seq
\`\`\`

> Modern cloud databases typically tune PACELC trade-offs (e.g. latency vs consistency under normal execution).`,
      tags: ['distributed-systems', 'architecture', 'backend'],
      category: 'Architecture',
      is_pinned: true,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'n2',
      title: 'Productivity: The 4-Hour Deep Work Block Protocol',
      content: `### Deep Work Schedule

1. **Morning Focus (08:30 - 11:30)**: Zero notifications, zero email, uninterrupted complex engineering tasks.
2. **Recharge (11:30 - 13:00)**: Physical movement, nutrition, disconnection.
3. **Collaborative Block (13:30 - 15:30)**: PR reviews, design meetings, team mentorship.

*Key Takeaway: Protect morning mental energy at all costs.*`,
      tags: ['productivity', 'habits', 'deep-work'],
      category: 'Self-Improvement',
      is_pinned: false,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],

  lesson_categories: [
    { id: 'b1', name: 'System Architecture', color: '#6366F1' },
    { id: 'b2', name: 'Leadership & Teamwork', color: '#10B981' },
    { id: 'b3', name: 'Product & Prioritization', color: '#F59E0B' },
    { id: 'b4', name: 'Incident Resiliency', color: '#EF4444' },
    { id: 'b5', name: 'Career & Mindset', color: '#8B5CF6' },
  ],

  lessons: [
    {
      id: 'l1',
      title: 'Premature Optimization vs Architecture Scalability',
      description: 'Attempted to build a complex multi-region sharding layer before the product had validated real bottleneck requirements. Added 4 months of engineering overhead for negligible throughput gain.',
      takeaways: 'Design for clean modular boundaries first. Keep data storage simple (PostgreSQL) until measured load proves horizontal sharding is required.',
      category_id: 'b1',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: 'l2',
      title: 'Async Communication Beats Synchronous Status Meetings',
      description: 'Weekly round-robin status calls were draining team momentum without surfacing blockers fast enough. Engineers prepared defensive updates instead of collaborating.',
      takeaways: 'Adopted daily async bullet-point updates with explicit blocker tags. Reserved live meetings strictly for brainstorms and collaborative architecture.',
      category_id: 'b2',
      created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    },
    {
      id: 'l3',
      title: 'The Trap of the "One More Feature" Release Cycle',
      description: 'Delayed a major client dashboard launch by 6 weeks trying to squeeze in export-to-PDF and dark mode toggles. Early customer feedback on core workflows was needlessly delayed.',
      takeaways: 'Ship the thinnest slice that creates end-to-end customer utility. Real customer validation always disproves half of your anticipated follow-up feature hypotheses.',
      category_id: 'b3',
      created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    },
    {
      id: 'l4',
      title: 'Blameless Post-Mortems Build Resilient Systems',
      description: 'A critical Redis cache eviction cascading outage caused 45 minutes of API 502 errors. The initial instinct was to question why the deploying engineer missed the connection pool limit.',
      takeaways: 'Focus on systemic safeguards rather than human error. Human mistakes reveal missing guardrails, circuit breakers, and load shedding tests. Added automated canary deployments and synthetic stress tests.',
      category_id: 'b4',
      created_at: new Date(Date.now() - 42 * 86400000).toISOString(),
    },
    {
      id: 'l5',
      title: 'Technical Debt is a Financial Debt: Plan for Interest Payments',
      description: 'Rushed a prototype notification system with hardcoded SQL and tight database couplings. Six months later, adding push notifications took 3x longer than building from scratch.',
      takeaways: 'Every shortcut borrows velocity from future sprints. Log tech-debt tickets immediately, assign estimated interest cost, and reserve 20% of every sprint cycle for refactoring.',
      category_id: 'b1',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 'l6',
      title: 'Saying "No" Gracefully is a Senior Engineer\'s Primary Superpower',
      description: 'Said yes to 5 concurrent cross-team initiatives, leading to context-switching fatigue and slipping deadlines across 3 major deliverables.',
      takeaways: 'High-leverage execution requires ruthless focus. Saying no to good ideas is necessary to preserve energy and excellence for the great ones. Offer alternative paths or clear trade-off assessments when declining.',
      category_id: 'b5',
      created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
    },
  ],

  movie_categories: [
    { id: 'mc1', name: 'Sci-Fi / Thriller', color: '#EC4899' },
    { id: 'mc2', name: 'Drama / Historical', color: '#8B5CF6' },
  ],

  movie_platforms: [
    { id: 'mp1', name: 'Netflix', icon: 'film' },
    { id: 'mp2', name: 'Prime Video', icon: 'film' },
    { id: 'mp3', name: 'Apple TV+', icon: 'film' },
  ],

  movies: [
    {
      id: 'm1',
      title: 'Oppenheimer',
      type: 'movie',
      status: 'watched',
      rating: 9.2,
      review: 'Masterpiece in pacing, sound design, and psychological tension. Cillian Murphy delivered an iconic performance.',
      release_year: 2023,
      platform_id: 'mp2',
      category_id: 'mc2',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'm2',
      title: 'Severance',
      type: 'tv',
      status: 'watched',
      rating: 9.5,
      review: 'Brilliant premise exploring workplace alienation and memory bifurcation. Impeccable cinematography.',
      release_year: 2022,
      platform_id: 'mp3',
      category_id: 'mc1',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'm3',
      title: 'Interstellar',
      type: 'movie',
      status: 'watchlist',
      rating: null,
      review: 'Scheduled for weekend rewatch in 4K.',
      release_year: 2014,
      platform_id: 'mp2',
      category_id: 'mc1',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],

  sip_investments: [
    {
      id: 'sip1',
      name: 'Nifty 50 Index Fund Direct Growth',
      amount: 15000,
      category: 'Index Fund',
      debit_date: 5,
      expected_return_rate: 12.5,
      start_date: '2023-01-05',
    },
    {
      id: 'sip2',
      name: 'Parag Parikh Flexi Cap Fund',
      amount: 10000,
      category: 'Equity Flexi Cap',
      debit_date: 10,
      expected_return_rate: 14.0,
      start_date: '2023-03-10',
    },
    {
      id: 'sip3',
      name: 'Mirae Asset Large & Midcap Fund',
      amount: 8000,
      category: 'Large & Midcap',
      debit_date: 15,
      expected_return_rate: 13.5,
      start_date: '2023-06-15',
    },
  ],

  revision_categories: [
    { id: 'rc1', name: 'System Design', color: '#8B5CF6' },
    { id: 'rc2', name: 'Databases & Storage', color: '#3B82F6' },
    { id: 'rc3', name: 'Frontend Architecture', color: '#10B981' },
    { id: 'rc4', name: 'Networking & Security', color: '#F59E0B' },
    { id: 'rc5', name: 'Algorithms & Concurrency', color: '#EC4899' },
  ],

  revision_elements: [
    {
      id: 're1',
      title: 'Consistent Hashing & Virtual Nodes',
      name: 'Consistent Hashing & Virtual Nodes',
      content: 'Consistent hashing maps both keys and nodes to a circular hash ring (0 to 2^32-1). Virtual nodes (vnodes) assign multiple points per physical server to ensure uniform key distribution and minimize hotspotting when nodes join or fail.',
      description: 'Consistent hashing maps both keys and nodes to a circular hash ring (0 to 2^32-1). Virtual nodes (vnodes) assign multiple points per physical server to ensure uniform key distribution and minimize hotspotting when nodes join or fail.',
      category_id: 'rc1',
      difficulty: 'easy',
      next_review_date: new Date(Date.now() + 3 * 86400000).toISOString(),
      review_count: 4,
      interval_days: 7,
    },
    {
      id: 're2',
      title: 'Database Isolation Levels: Phantom vs Non-Repeatable Reads',
      name: 'Database Isolation Levels: Phantom vs Non-Repeatable Reads',
      content: 'Non-repeatable read occurs when row data changes between reads within a transaction. Phantom read occurs when the set of rows matching a WHERE clause changes (due to INSERT/DELETE by another transaction). Serializable isolation prevents both using predicate locks or snapshot isolation.',
      description: 'Non-repeatable read occurs when row data changes between reads within a transaction. Phantom read occurs when the set of rows matching a WHERE clause changes (due to INSERT/DELETE by another transaction). Serializable isolation prevents both using predicate locks or snapshot isolation.',
      category_id: 'rc2',
      difficulty: 'medium',
      next_review_date: new Date(Date.now() + 86400000).toISOString(),
      review_count: 2,
      interval_days: 3,
    },
    {
      id: 're3',
      title: 'React Fiber Reconciler & Concurrent Rendering',
      name: 'React Fiber Reconciler & Concurrent Rendering',
      content: 'React Fiber decomposes reconciliation into fine-grained units of work (fibers). It decouples the work phase (interruptible, priority-based lanes) from the commit phase (synchronous DOM mutations), enabling features like useTransition and selective hydration.',
      description: 'React Fiber decomposes reconciliation into fine-grained units of work (fibers). It decouples the work phase (interruptible, priority-based lanes) from the commit phase (synchronous DOM mutations), enabling features like useTransition and selective hydration.',
      category_id: 'rc3',
      difficulty: 'hard',
      next_review_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      review_count: 3,
      interval_days: 4,
    },
    {
      id: 're4',
      title: 'Raft Consensus: Leader Election & Log Replication',
      name: 'Raft Consensus: Leader Election & Log Replication',
      content: 'Raft decomposes consensus into 3 subproblems: Leader Election (randomized election timers between 150-300ms to avoid split votes), Log Replication (leader appends entries and commits upon quorum ACK), and Safety (leader completeness guarantees committed entries are never overridden).',
      description: 'Raft decomposes consensus into 3 subproblems: Leader Election (randomized election timers between 150-300ms to avoid split votes), Log Replication (leader appends entries and commits upon quorum ACK), and Safety (leader completeness guarantees committed entries are never overridden).',
      category_id: 'rc1',
      difficulty: 'hard',
      next_review_date: new Date(Date.now() + 86400000).toISOString(),
      review_count: 1,
      interval_days: 2,
    },
    {
      id: 're5',
      title: 'LSM Trees vs B+ Trees: Write vs Read Amplification',
      name: 'LSM Trees vs B+ Trees: Write vs Read Amplification',
      content: 'LSM Trees (RocksDB, Cassandra) optimize for sequential write throughput via append-only MemTable and SSTables, trading read performance (compaction, bloom filters). B+ Trees (PostgreSQL, InnoDB) optimize for fast reads with fixed-size pages and in-place updates, paying higher write amplification.',
      description: 'LSM Trees (RocksDB, Cassandra) optimize for sequential write throughput via append-only MemTable and SSTables, trading read performance (compaction, bloom filters). B+ Trees (PostgreSQL, InnoDB) optimize for fast reads with fixed-size pages and in-place updates, paying higher write amplification.',
      category_id: 'rc2',
      difficulty: 'medium',
      next_review_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      review_count: 3,
      interval_days: 6,
    },
    {
      id: 're6',
      title: 'TLS 1.3 0-RTT & TCP Connection Termination',
      name: 'TLS 1.3 0-RTT & TCP Connection Termination',
      content: 'TLS 1.3 reduces the handshake to 1 round-trip (1-RTT) by combining crypto parameter negotiation with key exchange. Pre-shared keys enable 0-RTT resumption (with replay attack trade-offs). TCP closes gracefully with a 4-way FIN/ACK handshake and TIME_WAIT (2*MSL) to drain lingering segments.',
      description: 'TLS 1.3 reduces the handshake to 1 round-trip (1-RTT) by combining crypto parameter negotiation with key exchange. Pre-shared keys enable 0-RTT resumption (with replay attack trade-offs). TCP closes gracefully with a 4-way FIN/ACK handshake and TIME_WAIT (2*MSL) to drain lingering segments.',
      category_id: 'rc4',
      difficulty: 'medium',
      next_review_date: new Date(Date.now() + 4 * 86400000).toISOString(),
      review_count: 2,
      interval_days: 5,
    },
    {
      id: 're7',
      title: 'Actor Model vs CSP (Communicating Sequential Processes)',
      name: 'Actor Model vs CSP (Communicating Sequential Processes)',
      content: 'Actor Model (Erlang, Akka) communicates via mailbox-addressed asynchronous messages with dynamic topology. CSP (Go channels) communicates via first-class rendezvous channels where sender and receiver synchronize over the channel itself without direct actor knowledge.',
      description: 'Actor Model (Erlang, Akka) communicates via mailbox-addressed asynchronous messages with dynamic topology. CSP (Go channels) communicates via first-class rendezvous channels where sender and receiver synchronize over the channel itself without direct actor knowledge.',
      category_id: 'rc5',
      difficulty: 'hard',
      next_review_date: new Date(Date.now() + 86400000).toISOString(),
      review_count: 2,
      interval_days: 3,
    },
  ],

  asset_types: [
    { id: 'at_mf', name: 'Mutual Funds & Index Funds', color: '#3B82F6', category: 'Equity', description: 'Diversified equity funds & index trackers', created_at: new Date().toISOString() },
    { id: 'at_stocks', name: 'Direct Equity & ETFs', color: '#10B981', category: 'Equity', description: 'Individual stocks & thematic baskets', created_at: new Date().toISOString() },
    { id: 'at_debt', name: 'Fixed Deposits & Bonds', color: '#6366F1', category: 'Debt', description: 'Capital protection fixed-yield instruments', created_at: new Date().toISOString() },
    { id: 'at_retire', name: 'EPF & Provident Funds', color: '#8B5CF6', category: 'Retirement', description: 'Compulsory retirement provident fund', created_at: new Date().toISOString() },
    { id: 'at_gold', name: 'Gold & Commodities', color: '#F59E0B', category: 'Commodity', description: 'Sovereign gold bonds & precious metals', created_at: new Date().toISOString() },
    { id: 'at_crypto', name: 'Crypto & Digital Assets', color: '#EC4899', category: 'Crypto', description: 'Decentralized protocol tokens & staking', created_at: new Date().toISOString() },
    { id: 'at_reit', name: 'REITs & Real Estate', color: '#14B8A6', category: 'Real Estate', description: 'Commercial office & warehouse REITs', created_at: new Date().toISOString() },
    { id: 'at_cash', name: 'Liquid Cash & Savings', color: '#06B6D4', category: 'Cash', description: 'Emergency reserve in high-yield account', created_at: new Date().toISOString() },
  ],

  investment_platforms: [
    { id: 'ip_zerodha', name: 'Zerodha (Coin/Kite)', url: 'https://kite.zerodha.com', created_at: new Date().toISOString() },
    { id: 'ip_groww', name: 'Groww', url: 'https://groww.in', created_at: new Date().toISOString() },
    { id: 'ip_hdfc', name: 'HDFC Bank', url: 'https://hdfcbank.com', created_at: new Date().toISOString() },
    { id: 'ip_epfo', name: 'EPFO India', url: 'https://epfindia.gov.in', created_at: new Date().toISOString() },
    { id: 'ip_binance', name: 'Binance / Vault', url: 'https://binance.com', created_at: new Date().toISOString() },
  ],

  investments: [
    { id: 'inv_1', name: 'UTI Nifty 50 Index Fund Direct Growth', asset_type_id: 'at_mf', platform_id: 'ip_zerodha', notes: 'Core long-term index allocation (Nifty 50)', extra_configuration: { mf_scheme_code: '120716' }, created_at: new Date(Date.now() - 365 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv_2', name: 'Parag Parikh Flexi Cap Fund', asset_type_id: 'at_mf', platform_id: 'ip_groww', notes: 'Active diversified equity with global exposure', extra_configuration: { mf_scheme_code: '122639' }, created_at: new Date(Date.now() - 300 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv_3', name: 'Midcap High-Beta Momentum Basket', asset_type_id: 'at_stocks', platform_id: 'ip_zerodha', notes: 'Smallcase thematic basket (underperforming post-correction)', extra_configuration: null, created_at: new Date(Date.now() - 180 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv_4', name: 'Clean Energy & Solar Thematic ETF', asset_type_id: 'at_stocks', platform_id: 'ip_zerodha', notes: 'Clean energy transition ETF (cyclical headwind)', extra_configuration: null, created_at: new Date(Date.now() - 210 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv_5', name: 'HDFC Bank Fixed Deposit (7.25% p.a.)', asset_type_id: 'at_debt', platform_id: 'ip_hdfc', notes: '18-month senior term deposit', extra_configuration: null, created_at: new Date(Date.now() - 240 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv_6', name: 'Employee Provident Fund (EPF)', asset_type_id: 'at_retire', platform_id: 'ip_epfo', notes: 'Statutory retirement contribution (8.25% interest rate)', extra_configuration: null, created_at: new Date(Date.now() - 500 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv_7', name: 'Sovereign Gold Bond 2023 Series III', asset_type_id: 'at_gold', platform_id: 'ip_zerodha', notes: 'RBI SGB yielding 2.5% semi-annual coupon + capital appreciation', extra_configuration: null, created_at: new Date(Date.now() - 270 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv_8', name: 'Ethereum (ETH) Staking Vault', asset_type_id: 'at_crypto', platform_id: 'ip_binance', notes: 'Lido staked ETH (bought during mid-cycle top)', extra_configuration: { coin_id: 'ethereum' }, created_at: new Date(Date.now() - 120 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv_9', name: 'Brookfield India Real Estate Trust (REIT)', asset_type_id: 'at_reit', platform_id: 'ip_groww', notes: 'Grade-A office parks commercial REIT with quarterly distribution', extra_configuration: null, created_at: new Date(Date.now() - 150 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'inv_10', name: 'Emergency Cash Reserve (High-Yield Savings)', asset_type_id: 'at_cash', platform_id: 'ip_hdfc', notes: '6-month liquidity buffer', extra_configuration: null, created_at: new Date(Date.now() - 400 * 86400000).toISOString(), updated_at: new Date().toISOString() },
  ],

  investment_transactions: [
    // inv_1: UTI Nifty 50 Index Fund (Total 150k)
    { id: 'tx_1_1', investment_id: 'inv_1', transaction_date: daysAgo(180), amount_invested: 90000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(180) },
    { id: 'tx_1_2', investment_id: 'inv_1', transaction_date: daysAgo(150), amount_invested: 15000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(150) },
    { id: 'tx_1_3', investment_id: 'inv_1', transaction_date: daysAgo(120), amount_invested: 15000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(120) },
    { id: 'tx_1_4', investment_id: 'inv_1', transaction_date: daysAgo(90), amount_invested: 15000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(90) },
    { id: 'tx_1_5', investment_id: 'inv_1', transaction_date: daysAgo(30), amount_invested: 15000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(30) },

    // inv_2: Parag Parikh Flexi Cap Fund (Total 120k)
    { id: 'tx_2_1', investment_id: 'inv_2', transaction_date: daysAgo(180), amount_invested: 80000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(180) },
    { id: 'tx_2_2', investment_id: 'inv_2', transaction_date: daysAgo(150), amount_invested: 10000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(150) },
    { id: 'tx_2_3', investment_id: 'inv_2', transaction_date: daysAgo(120), amount_invested: 10000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(120) },
    { id: 'tx_2_4', investment_id: 'inv_2', transaction_date: daysAgo(90), amount_invested: 10000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(90) },
    { id: 'tx_2_5', investment_id: 'inv_2', transaction_date: daysAgo(30), amount_invested: 10000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(30) },

    // inv_3: Midcap Momentum (Total 60k)
    { id: 'tx_3_1', investment_id: 'inv_3', transaction_date: daysAgo(180), amount_invested: 40000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(180) },
    { id: 'tx_3_2', investment_id: 'inv_3', transaction_date: daysAgo(120), amount_invested: 20000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(120) },

    // inv_4: Clean Energy ETF (Total 80k)
    { id: 'tx_4_1', investment_id: 'inv_4', transaction_date: daysAgo(180), amount_invested: 50000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(180) },
    { id: 'tx_4_2', investment_id: 'inv_4', transaction_date: daysAgo(90), amount_invested: 30000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(90) },

    // inv_5: HDFC Bank Fixed Deposit (Total 100k)
    { id: 'tx_5_1', investment_id: 'inv_5', transaction_date: daysAgo(180), amount_invested: 100000, tenure_months: 18, interest_rate: 7.25, maturity_date: daysAgo(-365), created_at: daysAgoIso(180) },

    // inv_6: EPF (Total 240k)
    { id: 'tx_6_1', investment_id: 'inv_6', transaction_date: daysAgo(180), amount_invested: 200000, tenure_months: null, interest_rate: 8.25, maturity_date: null, created_at: daysAgoIso(180) },
    { id: 'tx_6_2', investment_id: 'inv_6', transaction_date: daysAgo(150), amount_invested: 8000, tenure_months: null, interest_rate: 8.25, maturity_date: null, created_at: daysAgoIso(150) },
    { id: 'tx_6_3', investment_id: 'inv_6', transaction_date: daysAgo(120), amount_invested: 8000, tenure_months: null, interest_rate: 8.25, maturity_date: null, created_at: daysAgoIso(120) },
    { id: 'tx_6_4', investment_id: 'inv_6', transaction_date: daysAgo(90), amount_invested: 8000, tenure_months: null, interest_rate: 8.25, maturity_date: null, created_at: daysAgoIso(90) },
    { id: 'tx_6_5', investment_id: 'inv_6', transaction_date: daysAgo(60), amount_invested: 8000, tenure_months: null, interest_rate: 8.25, maturity_date: null, created_at: daysAgoIso(60) },
    { id: 'tx_6_6', investment_id: 'inv_6', transaction_date: daysAgo(30), amount_invested: 8000, tenure_months: null, interest_rate: 8.25, maturity_date: null, created_at: daysAgoIso(30) },

    // inv_7: Sovereign Gold Bond (Total 65k)
    { id: 'tx_7_1', investment_id: 'inv_7', transaction_date: daysAgo(180), amount_invested: 65000, tenure_months: 96, interest_rate: 2.5, maturity_date: daysAgo(-2700), created_at: daysAgoIso(180) },

    // inv_8: Ethereum ETH Vault (Total 110k)
    { id: 'tx_8_1', investment_id: 'inv_8', transaction_date: daysAgo(180), amount_invested: 70000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(180) },
    { id: 'tx_8_2', investment_id: 'inv_8', transaction_date: daysAgo(120), amount_invested: 40000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(120) },

    // inv_9: Brookfield REIT (Total 75k)
    { id: 'tx_9_1', investment_id: 'inv_9', transaction_date: daysAgo(180), amount_invested: 75000, tenure_months: null, interest_rate: null, maturity_date: null, created_at: daysAgoIso(180) },

    // inv_10: Emergency Cash Reserve (Total 150k)
    { id: 'tx_10_1', investment_id: 'inv_10', transaction_date: daysAgo(180), amount_invested: 130000, tenure_months: null, interest_rate: 3.5, maturity_date: null, created_at: daysAgoIso(180) },
    { id: 'tx_10_2', investment_id: 'inv_10', transaction_date: daysAgo(150), amount_invested: 5000, tenure_months: null, interest_rate: 3.5, maturity_date: null, created_at: daysAgoIso(150) },
    { id: 'tx_10_3', investment_id: 'inv_10', transaction_date: daysAgo(120), amount_invested: 5000, tenure_months: null, interest_rate: 3.5, maturity_date: null, created_at: daysAgoIso(120) },
    { id: 'tx_10_4', investment_id: 'inv_10', transaction_date: daysAgo(90), amount_invested: 5000, tenure_months: null, interest_rate: 3.5, maturity_date: null, created_at: daysAgoIso(90) },
    { id: 'tx_10_5', investment_id: 'inv_10', transaction_date: daysAgo(30), amount_invested: 5000, tenure_months: null, interest_rate: 3.5, maturity_date: null, created_at: daysAgoIso(30) },
  ],

  investment_valuations: buildHistoricalValuations(),

  sip_configs: [
    { id: 'sc_1', investment_id: 'inv_1', amount: 15000, sip_day: 5, is_active: true, start_date: '2023-01-05', end_date: null, last_executed_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'sc_2', investment_id: 'inv_2', amount: 10000, sip_day: 10, is_active: true, start_date: '2023-03-10', end_date: null, last_executed_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'sc_3', investment_id: 'inv_10', amount: 5000, sip_day: 1, is_active: true, start_date: '2023-01-01', end_date: null, last_executed_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],

  ats_platforms: [
    { id: 'ats1', name: 'ChatGPT', url: 'https://chatgpt.com', is_default: true },
    { id: 'ats2', name: 'Jobscan', url: 'https://jobscan.co', is_default: false },
    { id: 'ats3', name: 'Resume Worded', url: 'https://resumeworded.com', is_default: false },
    { id: 'ats4', name: 'Teal', url: 'https://tealhq.com', is_default: false },
  ],

  job_platforms: [
    { id: 'jp1', name: 'LinkedIn', url: 'https://linkedin.com/jobs', is_active: true },
    { id: 'jp2', name: 'Wellfound (AngelList)', url: 'https://wellfound.com/jobs', is_active: true },
    { id: 'jp3', name: 'Ashby', url: 'https://ashbyhq.com', is_active: true },
    { id: 'jp4', name: 'Indeed', url: 'https://indeed.com', is_active: true },
  ],

  job_applications_status: [
    {
      id: 'jas_1',
      status: 'interviewing',
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'jas_2',
      status: 'applied',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'jas_3',
      status: 'accepted',
      created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'jas_4',
      status: 'negotiating',
      created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],

  job_applications: [
    {
      id: 'j1',
      company_name: 'Stripe',
      role_name: 'Senior Full Stack Engineer (Core Infra)',
      status_id: 'jas_1',
      status: 'interviewing',
      status_updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      job_type: 'Remote',
      city: 'Bengaluru',
      country: 'India',
      visa_sponsorship: 'maybe yes',
      salary_min_inr: 4200000,
      salary_max_inr: 5200000,
      salary_currency: 'INR',
      application_link: 'https://stripe.com/jobs',
      chatgpt_thread_link: 'https://chatgpt.com/c/670e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
      applied_date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
      ats_score: 88,
      follow_ups: [
        { id: 'fu_1', date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], type: 'Email', notes: 'Recruiter screen completed. Advanced to Technical Deep Dive round.' },
        { id: 'fu_2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], type: 'Phone Call', notes: 'Reviewed System Architecture expectations with hiring manager.' },
      ],
      notes: 'Tailored resume with emphasis on distributed ledger and payments transaction reliability.',
      platform: 'LinkedIn',
      ats_scores: [
        { id: 'sc_1', job_id: 'j1', platform_name: 'ChatGPT', score: 90 },
        { id: 'sc_2', job_id: 'j1', platform_name: 'Jobscan', score: 86 },
      ],
    },
    {
      id: 'j2',
      company_name: 'Vercel',
      role_name: 'Staff Frontend Engineer (Developer Experience)',
      status_id: 'jas_2',
      status: 'applied',
      status_updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      job_type: 'Remote',
      city: 'San Francisco',
      country: 'United States',
      visa_sponsorship: 'yes',
      salary_min_inr: 5000000,
      salary_max_inr: 6500000,
      salary_currency: 'INR',
      application_link: 'https://vercel.com/careers',
      chatgpt_thread_link: 'https://chatgpt.com/c/671f2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
      applied_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      ats_score: 92,
      follow_ups: [
        { id: 'fu_3', date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], type: 'LinkedIn', notes: 'Sent connection request and personalized note to VP of Engineering.' },
      ],
      notes: 'Highlighted React performance optimization, next.js server components, and bundle analysis.',
      platform: 'Ashby',
      ats_scores: [
        { id: 'sc_3', job_id: 'j2', platform_name: 'ChatGPT', score: 94 },
        { id: 'sc_4', job_id: 'j2', platform_name: 'Jobscan', score: 90 },
      ],
    },
    {
      id: 'j3',
      company_name: 'Figma',
      role_name: 'Lead Platform Engineer',
      status_id: 'jas_3',
      status: 'accepted',
      status_updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      job_type: 'Hybrid',
      city: 'London',
      country: 'United Kingdom',
      visa_sponsorship: 'no',
      salary_min_inr: 6000000,
      salary_max_inr: 7500000,
      salary_currency: 'INR',
      application_link: 'https://figma.com/careers',
      applied_date: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
      ats_score: 85,
      follow_ups: [
        { id: 'fu_4', date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], type: 'Email', notes: 'Offer letter received! Reviewing compensation package and equity grants.' },
      ],
      notes: 'Strong alignment with real-time multiplayer WebAssembly and CRDT synchronization.',
      platform: 'Wellfound (AngelList)',
      ats_scores: [
        { id: 'sc_5', job_id: 'j3', platform_name: 'ChatGPT', score: 88 },
        { id: 'sc_6', job_id: 'j3', platform_name: 'Resume Worded', score: 82 },
      ],
    },
    {
      id: 'j4',
      company_name: 'Canva',
      role_name: 'Senior Frontend Infrastructure Engineer',
      status_id: 'jas_4',
      status: 'negotiating',
      status_updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      job_type: 'Hybrid',
      city: 'Sydney',
      country: 'Australia',
      visa_sponsorship: 'maybe no',
      salary_min_inr: 5500000,
      salary_max_inr: 6800000,
      salary_currency: 'INR',
      application_link: 'https://canva.com/careers',
      applied_date: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
      ats_score: 87,
      follow_ups: [
        { id: 'fu_5', date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], type: 'Email', notes: 'Final interview passed. Discussing visa limitations and relocation requirements.' },
      ],
      notes: 'Focused on large-scale web canvas rendering and asset pipeline optimization.',
      platform: 'LinkedIn',
      ats_scores: [
        { id: 'sc_7', job_id: 'j4', platform_name: 'ChatGPT', score: 89 },
      ],
    },
  ],

  job_application_ats_scores: [
    { id: 'sc_1', job_id: 'j1', platform_id: 'ats1', platform_name: 'ChatGPT', score: 90 },
    { id: 'sc_2', job_id: 'j1', platform_id: 'ats2', platform_name: 'Jobscan', score: 86 },
    { id: 'sc_3', job_id: 'j2', platform_id: 'ats1', platform_name: 'ChatGPT', score: 94 },
    { id: 'sc_4', job_id: 'j2', platform_id: 'ats2', platform_name: 'Jobscan', score: 90 },
    { id: 'sc_5', job_id: 'j3', platform_id: 'ats1', platform_name: 'ChatGPT', score: 88 },
    { id: 'sc_6', job_id: 'j3', platform_id: 'ats3', platform_name: 'Resume Worded', score: 82 },
    { id: 'sc_7', job_id: 'j4', platform_id: 'ats1', platform_name: 'ChatGPT', score: 89 },
  ],

  saved_job_links: [
    {
      id: 's1',
      company_name: 'Datadog',
      role_name: 'Senior Distributed Systems Engineer',
      url: 'https://datadoghq.com/careers',
      source: 'LinkedIn',
      status: 'to_apply',
      salary: '45 - 55 LPA',
      location: 'Remote, India',
    },
    {
      id: 's2',
      company_name: 'Linear',
      role_name: 'Full Stack Product Engineer',
      url: 'https://linear.app/careers',
      source: 'Wellfound (AngelList)',
      status: 'researching',
      salary: '50 - 65 LPA',
      location: 'Remote Worldwide',
    },
  ],
};

// Aliases for backwards compatibility between singular and plural naming
GUEST_SAMPLE_DATA.revision_category = GUEST_SAMPLE_DATA.revision_categories;
GUEST_SAMPLE_DATA.revision_element = GUEST_SAMPLE_DATA.revision_elements;
GUEST_SAMPLE_DATA.movies_tv = GUEST_SAMPLE_DATA.movies;
GUEST_SAMPLE_DATA.movies_categories = GUEST_SAMPLE_DATA.movie_categories;
GUEST_SAMPLE_DATA.movies_platforms = GUEST_SAMPLE_DATA.movie_platforms;

