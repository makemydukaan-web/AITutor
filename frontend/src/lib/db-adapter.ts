/**
 * Database adapter that works with both better-sqlite3 (local dev) and Cloudflare D1 (production)
 */

import Database from 'better-sqlite3';

export interface DBAdapter {
  prepare(sql: string): {
    get(params?: any): any;
    all(params?: any): any[];
    run(...params: any[]): any;
    bind(...params: any[]): {
      first(): Promise<any>;
      all(): Promise<any[]>;
      run(): Promise<any>;
    };
  };
  exec?(sql: string): void;
  pragma?(pragma: string): void;
}

export function createSQLiteAdapter(db: Database.Database): DBAdapter {
  return {
    prepare(sql: string) {
      const stmt = db.prepare(sql);
      return {
        get(params?: any) {
          return params ? stmt.get(params) : stmt.get();
        },
        all(params?: any) {
          return params ? stmt.all(params) : stmt.all();
        },
        run(...params: any[]) {
          return stmt.run(...params);
        },
        bind(...params: any[]) {
          // For compatibility with D1 syntax
          return {
            async first() {
              return params.length > 0 ? stmt.get(...params) : stmt.get();
            },
            async all() {
              return params.length > 0 ? stmt.all(...params) : stmt.all();
            },
            async run() {
              return stmt.run(...params);
            }
          };
        }
      };
    },
    exec(sql: string) {
      db.exec(sql);
    },
    pragma(pragma: string) {
      db.pragma(pragma);
    }
  };
}

export function createD1Adapter(d1: any): DBAdapter {
  return {
    prepare(sql: string) {
      const stmt = d1.prepare(sql);
      return {
        get(param?: any) {
          // D1 doesn't have synchronous .get(), use .bind().first() instead
          throw new Error('Use .bind().first() for D1 database queries');
        },
        all(param?: any) {
          throw new Error('Use .bind().all() for D1 database queries');
        },
        run(...params: any[]) {
          throw new Error('Use .bind().run() for D1 database queries');
        },
        bind(...params: any[]) {
          return stmt.bind(...params);
        }
      };
    }
  };
}

/**
 * Helper to get the appropriate database adapter based on environment
 */
export function getDBAdapter(d1?: any, sqlite?: Database.Database): DBAdapter {
  if (d1) {
    return createD1Adapter(d1);
  }
  if (sqlite) {
    return createSQLiteAdapter(sqlite);
  }
  throw new Error('No database instance provided');
}
