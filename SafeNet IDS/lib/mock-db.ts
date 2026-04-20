const globalAny = globalThis as any;
if (!globalAny.mockDb) {
  globalAny.mockDb = {
    packets: [] as any[],
    alerts: [] as any[],
    ip_blacklist: [] as any[],
    ip_whitelist: [] as any[],
    port_scan_events: [] as any[],
    dos_events: [] as any[],
    protocol_anomalies: [] as any[]
  };
}
const db = globalAny.mockDb;

export const clearDb = () => {
  const newDb = { packets: [], alerts: [], ip_blacklist: [], ip_whitelist: [], port_scan_events: [], dos_events: [], protocol_anomalies: [] };
  Object.assign(db, newDb);
};

class MockQuery {
  table: string;
  data: any[];
  isSelect: boolean = false;
  isCountExact: boolean = false;

  constructor(table: string) {
    this.table = table;
    this.data = [...db[table as keyof typeof db]];
  }

  select(cols?: string, options?: any) {
    this.isSelect = true;
    if (options?.count === 'exact') {
      this.isCountExact = true;
    }
    return this;
  }

  insert(record: any) {
    const records = Array.isArray(record) ? record : [record];
    const newRecords = records.map(r => ({
      ...r,
      id: r.id || Math.random().toString(36).substr(2, 9),
      created_at: r.created_at || new Date().toISOString()
    }));
    (db[this.table as keyof typeof db] as any[]).push(...newRecords);
    return Promise.resolve({ data: newRecords, error: null });
  }

  update(updates: any) {
    this.data = this.data.map(item => ({ ...item, ...updates }));
    const dbTable = db[this.table as keyof typeof db] as any[];
    for (let i = 0; i < dbTable.length; i++) {
      if (this.data.find(d => d.id === dbTable[i].id)) {
        dbTable[i] = { ...dbTable[i], ...updates };
      }
    }
    return this;
  }

  delete() {
    this.isSelect = false;
    return this;
  }

  eq(col: string, val: any) {
    if (this.isSelect === false) {
      // Handle delete
      const dbTable = db[this.table as keyof typeof db] as any[];
      db[this.table as keyof typeof db] = dbTable.filter(item => item[col] !== val) as any;
      return this;
    }
    this.data = this.data.filter(item => item[col] === val);
    return this;
  }

  gt(col: string, val: any) {
    this.data = this.data.filter(item => new Date(item[col]) > new Date(val));
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    const asc = opts?.ascending ?? true;
    this.data.sort((a, b) => {
      if (a[col] < b[col]) return asc ? -1 : 1;
      if (a[col] > b[col]) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(n: number) {
    this.data = this.data.slice(0, n);
    return this;
  }

  range(start: number, end: number) {
    this.data = this.data.slice(start, end + 1);
    return this;
  }

  async then(resolve: any) {
    if (this.isCountExact && !this.isSelect) {
      resolve({ count: this.data.length, error: null });
    } else {
      resolve({ data: this.data, count: this.data.length, error: null });
    }
  }
}

export const createClient = (url: string, key: string) => {
  return {
    from: (table: string) => new MockQuery(table)
  };
};

export const createServerClient = () => {
  return createClient('mock', 'mock');
};
