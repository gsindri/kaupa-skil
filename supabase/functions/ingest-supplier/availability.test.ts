import { describe, it, expect } from 'vitest'
import { cleanAvailabilityText, availabilityStatusFromText } from './availability'
import { newDb } from 'pg-mem'

describe('availability text utilities', () => {
  it('normalizes and classifies out-of-stock text', () => {
    const raw = '  <span>Ekki</span> til  á\n lager  '
    const cleaned = cleanAvailabilityText(raw)
    expect(cleaned).toBe('ekki til á lager')
    expect(availabilityStatusFromText(raw)).toBe('OUT_OF_STOCK')
  })

  it.each([
    ['til á lager', 'IN_STOCK'],
    ['ekki til á lager', 'OUT_OF_STOCK'],
    ['ekki til á lager í dag', 'OUT_OF_STOCK']
  ])('maps %s to %s', (text, status) => {
    expect(availabilityStatusFromText(text)).toBe(status)
  })
})

describe('v_public_catalog view availability', () => {
  function setupDb(availability: string) {
    const db = newDb()
    db.public.none(`
      CREATE TABLE catalog_product (
        id text primary key,
        name text,
        brand text
      );
    `)
    db.public.none(`
      CREATE TABLE supplier_product (
        id serial primary key,
        catalog_product_id text references catalog_product(id),
        availability_text text
      );
    `)
    db.public.none(`
      CREATE VIEW v_public_catalog AS
      SELECT
        cp.id as catalog_id,
        CASE
          WHEN bool_or(LOWER(sp.availability_text) LIKE '%til á lager%' AND NOT (LOWER(sp.availability_text) LIKE '%ekki%')) THEN 'IN_STOCK'
          WHEN bool_or(LOWER(sp.availability_text) LIKE '%ekki til á lager%' OR LOWER(sp.availability_text) LIKE '%out of stock%') THEN 'OUT_OF_STOCK'
          WHEN bool_or(LOWER(sp.availability_text) LIKE '%low stock%' OR LOWER(sp.availability_text) LIKE '%lítið á lager%') THEN 'LOW_STOCK'
          ELSE 'UNKNOWN'
        END as availability_status
      FROM catalog_product cp
      LEFT JOIN supplier_product sp ON sp.catalog_product_id = cp.id
      GROUP BY cp.id;
    `)
    db.public.none(`INSERT INTO catalog_product (id, name, brand) VALUES ('1', 'test', 'brand');`)
    db.public.none(`INSERT INTO supplier_product (catalog_product_id, availability_text) VALUES ('1', '${availability}');`)
    return db
  }

  it.each([
    ['til á lager', 'IN_STOCK'],
    ['ekki til á lager', 'OUT_OF_STOCK'],
    ['ekki til á lager í dag', 'OUT_OF_STOCK']
  ])('view maps %s to %s', (text, status) => {
    const db = setupDb(text)
    const result = db.public.one(`SELECT availability_status FROM v_public_catalog WHERE catalog_id = '1'`)
    expect(result.availability_status).toBe(status)
  })
})
