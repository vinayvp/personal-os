import { supabase, getIsGuestMode } from './appClient';
import { createGuestMockClient } from './guestMockClient';

const guestMock = createGuestMockClient();

function createResilientBuilder(realBuilder: any, table: string, mockClient: any) {
  let mockBuilder = (mockClient as any).from(table);

  return new Proxy(realBuilder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (resolve: any, reject: any) => {
          return target.then(
            (res: any) => {
              const isSchemaError =
                res &&
                res.error &&
                (res.error.message?.includes('Invalid schema') ||
                  res.error.message?.includes('schema cache') ||
                  res.error.code === 'PGRST106');

              if (isSchemaError && getIsGuestMode()) {
                console.warn(
                  `[Finance Guest Mode] Schema 'finance' not exposed in Supabase (${res.error.message}). Gracefully serving demo data for table '${table}'.`
                );
                return mockBuilder.then(resolve, reject);
              }
              return resolve(res);
            },
            (err: any) => {
              if (getIsGuestMode()) {
                console.warn(
                  `[Finance Guest Mode] Supabase query rejected (${err?.message}). Gracefully serving demo data for table '${table}'.`
                );
                return mockBuilder.then(resolve, reject);
              }
              return reject(err);
            }
          );
        };
      }

      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return (...args: any[]) => {
          const nextTarget = val.apply(target, args);
          if (typeof (mockBuilder as any)[prop] === 'function') {
            mockBuilder = (mockBuilder as any)[prop](...args);
          }
          return createResilientBuilder(nextTarget, table, mockClient);
        };
      }
      return val;
    },
  });
}

/**
 * Helper to query the finance schema tables.
 * In Guest Mode, gracefully falls back to local sample data if the
 * Supabase instance hasn't added 'finance' to Exposed Schemas in Project Settings.
 */
export const financeDb = {
  from: (
    table:
      | 'investments'
      | 'investment_transactions'
      | 'asset_types'
      | 'sip_configs'
      | 'investment_valuations'
  ) => {
    const realBuilder = (supabase as any).schema('finance').from(table);
    if (!getIsGuestMode()) {
      return realBuilder;
    }
    return createResilientBuilder(realBuilder, table, guestMock);
  },
};

