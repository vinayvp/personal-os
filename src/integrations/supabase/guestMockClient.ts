import { GUEST_SAMPLE_DATA } from './guestSampleData';

const GUEST_STORAGE_PREFIX = 'guest_db_';

const TABLE_ALIASES: Record<string, string> = {
  revision_category: 'revision_categories',
  revision_element: 'revision_elements',
  movies_tv: 'movies',
  movies_categories: 'movie_categories',
  movies_platforms: 'movie_platforms',
};

export const getGuestTableData = (table: string): any[] => {
  const resolved = TABLE_ALIASES[table] || table;
  if (typeof window === 'undefined') return GUEST_SAMPLE_DATA[resolved] || GUEST_SAMPLE_DATA[table] || [];
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_PREFIX + resolved);
    if (!raw) {
      const initial = GUEST_SAMPLE_DATA[resolved] || GUEST_SAMPLE_DATA[table] || [];
      localStorage.setItem(GUEST_STORAGE_PREFIX + resolved, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return GUEST_SAMPLE_DATA[resolved] || GUEST_SAMPLE_DATA[table] || [];
  }
};

export const setGuestTableData = (table: string, items: any[]) => {
  const resolved = TABLE_ALIASES[table] || table;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_STORAGE_PREFIX + resolved, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save to guest local storage:', err);
  }
};

export const resetGuestStorage = () => {
  if (typeof window === 'undefined') return;
  Object.keys(GUEST_SAMPLE_DATA).forEach((key) => {
    localStorage.setItem(GUEST_STORAGE_PREFIX + key, JSON.stringify(GUEST_SAMPLE_DATA[key]));
  });
};

/**
 * Lightweight mock query builder for guest mode fallback before a second Supabase database is configured.
 */
class GuestMockQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private filters: Array<(item: any) => boolean> = [];
  private orderField?: string;
  private orderAscending = true;
  private isSingle = false;

  constructor(table: string) {
    this.table = TABLE_ALIASES[table] || table;
  }

  select(_columns = '*') {
    this.action = 'select';
    return this;
  }

  insert(values: any | any[]) {
    this.action = 'insert';
    this.payload = values;
    return this;
  }

  update(values: any) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => String(item[column]) === String(value));
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => String(item[column]) !== String(value));
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => values.map(String).includes(String(item[column])));
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderField = column;
    this.orderAscending = options.ascending ?? true;
    return this;
  }

  limit(_count: number) {
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  // Support Promise then/catch to execute seamlessly like Supabase
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any): Promise<any> {
    const current = getGuestTableData(this.table);

    if (this.action === 'select') {
      let filtered = current.filter((item) => this.filters.every((f) => f(item)));
      if (this.orderField) {
        filtered = [...filtered].sort((a, b) => {
          const valA = a[this.orderField!] ?? '';
          const valB = b[this.orderField!] ?? '';
          if (valA < valB) return this.orderAscending ? -1 : 1;
          if (valA > valB) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }
      if (this.table === 'investments') {
        const assetTypes = getGuestTableData('asset_types');
        const platforms = getGuestTableData('investment_platforms');
        filtered = filtered.map((inv: any) => ({
          ...inv,
          asset_type: inv.asset_type || assetTypes.find((at: any) => at.id === inv.asset_type_id) || null,
          investment_platforms: inv.investment_platforms || platforms.find((p: any) => p.id === inv.platform_id) || null,
        }));
      }

      const data = this.isSingle ? (filtered[0] || null) : filtered;
      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    }

    if (this.action === 'insert') {
      const itemsToInsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const stamped = itemsToInsert.map((item, idx) => ({
        id: item.id || `mock_${Date.now()}_${idx}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      }));
      const updated = [...current, ...stamped];
      setGuestTableData(this.table, updated);
      const data = this.isSingle ? stamped[0] : (Array.isArray(this.payload) ? stamped : stamped[0]);
      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    }

    if (this.action === 'update') {
      let updatedCount = 0;
      let lastUpdated: any = null;
      const updated = current.map((item) => {
        if (this.filters.every((f) => f(item))) {
          updatedCount++;
          lastUpdated = { ...item, ...this.payload, updated_at: new Date().toISOString() };
          return lastUpdated;
        }
        return item;
      });
      setGuestTableData(this.table, updated);
      const data = this.isSingle ? lastUpdated : (updatedCount > 0 ? [lastUpdated] : []);
      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    }

    if (this.action === 'delete') {
      const filtered = current.filter((item) => !this.filters.every((f) => f(item)));
      setGuestTableData(this.table, filtered);
      return Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected);
    }

    return Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected);
  }
}

export const createGuestMockClient = () => {
  return {
    schema: (_schemaName: string) => ({
      from: (table: string) => new GuestMockQueryBuilder(table),
    }),
    from: (table: string) => new GuestMockQueryBuilder(table),
    auth: {
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: (_bucket: string) => ({
        upload: async (_path: string, _file: any) => ({ data: { path: 'sample/resume.pdf' }, error: null }),
        getPublicUrl: (_path: string) => ({ data: { publicUrl: 'https://example.com/sample_resume.pdf' } }),
        createSignedUrl: async (_path: string) => ({ data: { signedUrl: 'https://example.com/sample_resume.pdf' }, error: null }),
      }),
    },
    functions: {
      invoke: async (_name: string, _options?: any) => ({ data: { success: true }, error: null }),
    },
  };
};

