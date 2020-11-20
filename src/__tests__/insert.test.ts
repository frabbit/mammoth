import { defineDb, defineTable, integer, text, timestampWithTimeZone, uuid } from '..';

import { toSnap } from './helpers';

describe(`insert`, () => {
  const foo = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    createDate: timestampWithTimeZone().notNull().default(`now()`),
    name: text().notNull(),
    value: integer(),
  });

  const db = defineDb({ foo }, () => Promise.resolve({ rows: [], affectedCount: 0 }));

  it(`should insert a single row`, () => {
    const query = db.insertInto(db.foo).values({
      name: `Test`,
    });

    expect(toSnap(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "Test",
        ],
        "text": "INSERT INTO foo (name) VALUES ($1)",
      }
    `);
  });

  it(`should insert multiple rows`, () => {
    const query = db.insertInto(db.foo).values([
      {
        name: `Test`,
      },
      {
        name: `Test 2`,
      },
    ]);

    expect(toSnap(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "Test",
          "Test 2",
        ],
        "text": "INSERT INTO foo (name) VALUES ($1), ($2)",
      }
    `);
  });

  it(`should insert foo on conflict do update set`, () => {
    const query = db
      .insertInto(db.foo)
      .values({
        name: `Test`,
      })
      .onConflict(`id`)
      .doUpdateSet({
        name: `Test 2`,
      });

    expect(toSnap(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "Test",
          "Test 2",
        ],
        "text": "INSERT INTO foo (name) VALUES ($1) ON CONFLICT (id) DO UPDATE SET name = $2",
      }
    `);
  });

  it(`should insert with default values`, () => {
    const query = db.insertInto(db.foo).defaultValues();

    expect(toSnap(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "INSERT INTO foo DEFAULT VALUES",
      }
    `);
  });

  it(`should insert with returning`, () => {
    const query = db.insertInto(db.foo).values({ name: `Test` }).returning(`id`);

    expect(toSnap(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "Test",
        ],
        "text": "INSERT INTO foo (name) VALUES ($1) RETURNING id",
      }
    `);
  });

  it(`should insert into select`, () => {
    const query = db
      .insertInto(db.foo, [`name`, `value`, `createDate`])
      .select(db.foo.id, db.foo.name, db.foo.createDate)
      .from(db.foo);

    expect(toSnap(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [],
        "text": "INSERT INTO foo (name, value, create_date) SELECT foo.id, foo.name, foo.create_date \\"createDate\\" FROM foo",
      }
    `);
  });

  it(`should insert update returning`, () => {
    const query = db
      .insertInto(db.foo, [`name`, `value`, `createDate`])
      .update(db.foo)
      .set({ value: 123 })
      .returning(`name`, `value`, `createDate`);

    expect(toSnap(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          123,
        ],
        "text": "INSERT INTO foo (name, value, create_date) UPDATE foo SET value = $1 RETURNING name, value, create_date \\"createDate\\"",
      }
    `);
  });

  it(`should insert delete returning`, () => {
    const query = db
      .insertInto(db.foo, [`name`, `value`, `createDate`])
      .deleteFrom(db.foo)
      .where(db.foo.value.lt(123))
      .returning(`name`, `value`, `createDate`);

    expect(toSnap(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          123,
        ],
        "text": "INSERT INTO foo (name, value, create_date) DELETE FROM foo WHERE foo.value < $1 RETURNING name, value, create_date \\"createDate\\"",
      }
    `);
  });

  it(`insert into on conflict do nothing`, () => {
    const query = db.insertInto(db.foo).values({ name: `Test` }).onConflict().doNothing();

    expect(toSnap(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "Test",
        ],
        "text": "INSERT INTO foo (name) VALUES ($1) ON CONFLICT DO NOTHING",
      }
    `);
  });
});
