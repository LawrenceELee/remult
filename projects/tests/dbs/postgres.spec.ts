import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Entity,
  Fields,
  Remult,
  SqlDatabase,
  dbNamesOf,
  describeClass,
} from '../../core'
import {
  PostgresDataProvider,
  PostgresSchemaBuilder,
  createPostgresConnection,
} from '../../core/postgres'
import { createEntity as createEntityClass } from '../tests/dynamic-classes'

import * as Knex from 'knex'
import type { ClassType } from '../../core/classType'
import { Categories } from '../tests/remult-3-entities'
import { allDbTests } from './shared-tests'
import { entityWithValidations } from './shared-tests/entityWithValidations'
import { knexTests } from './shared-tests/test-knex'
import { SqlDbTests } from './shared-tests/sql-db-tests'

PostgresSchemaBuilder.logToConsole = false
const postgresConnection = process.env.DATABASE_URL
describe.skipIf(!postgresConnection)('Postgres Tests', () => {
  var db: SqlDatabase
  let remult: Remult
  beforeAll(async () => {
    db = await createPostgresConnection({
      //wrapName: (x) => x,
    })
  })
  beforeEach(() => {
    remult = new Remult(db)
  })

  async function createEntity(entity: ClassType<any>) {
    let repo = remult.repo(entity)
    await db.execute(
      'drop table if exists ' +
        (await dbNamesOf(repo.metadata, db.wrapIdentifier)).$entityName,
    )
    await db.ensureSchema([repo.metadata])
    return repo
  }
  allDbTests({
    getDb() {
      return db
    },
    getRemult() {
      return remult
    },
    createEntity,
  })
  SqlDbTests({
    getDb() {
      return db
    },
    getRemult() {
      return remult
    },
    createEntity,
  })

  it('ensure schema with dbNames that have quotes', async () => {
    const db = SqlDatabase.getDb(remult)
    const entityName = 'test_naming'
    await db.execute('Drop table if exists ' + entityName)
    await db.execute(`create table ${entityName}(id int,"createdAt" Date)`)
    const ent = class {
      id = 0
      createdAt = new Date()
      oneMoreColumn = 0
    }
    describeClass(ent, Entity(entityName), {
      id: Fields.integer(),
      createdAt: Fields.createdAt({ dbName: '"createdAt"' }),
      oneMoreColumn: Fields.integer(),
    })
    await db.ensureSchema([remult.repo(ent).metadata])
    await remult.repo(ent).insert({ id: 1, oneMoreColumn: 8 })
    expect((await remult.repo(ent).findFirst()).createdAt.getFullYear()).toBe(
      new Date().getFullYear(),
    )
  })
  it('null last', async () => {
    @Entity('myEntity')
    class MyEntity {
      @Fields.number()
      id = 0
      @Fields.number({ allowNull: true })
      value: number | null = 0
    }
    const r = await createEntity(MyEntity)
    await r.insert([
      { id: 1, value: null },
      { id: 2, value: 2 },
      { id: 3, value: 3 },
    ])
    expect(
      (await r.find({ orderBy: { value: 'asc' } })).map((x) => x.value),
    ).toEqual([2, 3, null])
  })

  it('ensure on not_public schema', async () => {
    const db = SqlDatabase.getDb(remult)
    const entityName = 'auth.test_not_public'
    // reset the state of the database before the test (make sure we don't have the schema and table)
    await db.execute('Drop table if exists ' + entityName)
    await db.execute('DROP SCHEMA IF EXISTS auth')
    // the test is really starting here
    const ent = class {
      id = 0
      createdAt = new Date()
      oneMoreColumn = 0
    }
    describeClass(ent, Entity(entityName), {
      id: Fields.integer(),
      createdAt: Fields.createdAt({ dbName: '"createdAt"' }),
      oneMoreColumn: Fields.integer(),
    })
    await db.ensureSchema([remult.repo(ent).metadata])
    await remult.repo(ent).insert({ id: 1, oneMoreColumn: 8 })
    expect((await remult.repo(ent).findFirst()).createdAt.getFullYear()).toBe(
      new Date().getFullYear(),
    )
  })

  it('work with native sql', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const sql = SqlDatabase.getDb(remult)
    const r = await sql.execute(
      'select count(*) as c from ' + db.wrapIdentifier(repo.metadata.dbName),
    )
    expect(r.rows[0].c).toBe('4')
  })
  it('work with native sql2', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const sql = PostgresDataProvider.getDb(remult)
    const r = await sql.query(
      'select count(*) as c from ' + db.wrapIdentifier(repo.metadata.dbName),
    )
    expect(r.rows[0].c).toBe('4')
  })
  it('work with native sql3', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    await SqlDatabase.getDb(remult)
      ._getSourceSql()
      .transaction(async (x) => {
        const sql = PostgresDataProvider.getDb(new Remult(new SqlDatabase(x)))
        const r = await sql.query(
          'select count(*) as c from ' +
            db.wrapIdentifier(repo.metadata.dbName),
        )
        expect(r.rows[0].c).toBe('4')
      })
  })
  it('default order by', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    await s.update(1, { name: 'updated name' })
    expect((await s.find()).map((x) => x.myId)).toEqual([1, 2, 3, 4])
  })

  it('sql filter', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: SqlDatabase.rawFilter(async (build) => {
            build.sql =
              db.wrapIdentifier(s.metadata.fields.myId.dbName) + ' in (1,3)'
          }),
        })
      ).length,
    ).toBe(2)
  })
  it('sql filter2', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: {
            $or: [
              SqlDatabase.rawFilter(async (build) => {
                build.sql =
                  db.wrapIdentifier(s.metadata.fields.myId.dbName) + ' in (1,3)'
              }),
              {
                myId: 2,
              },
            ],
          },
        })
      ).length,
    ).toBe(3)
  })
  it('test column error', async () => {
    const c = await createEntity(Categories)
    await c.insert([{ categoryName: 'a', id: 1 }])
    try {
      await remult.repo(testErrorInFromDb).find()
    } catch (err) {
      expect(err.message).toContain('categoryName')
    }
  })
})
describe.skipIf(!postgresConnection)('Postgres null first', () => {
  var db: SqlDatabase
  let remult: Remult
  beforeAll(async () => {
    db = await createPostgresConnection({
      //wrapName: (x) => x,
      orderByNullsFirst: true,
    })
  })
  beforeEach(() => {
    remult = new Remult(db)
  })

  async function createEntity(entity: ClassType<any>) {
    let repo = remult.repo(entity)
    await db.execute(
      'drop table if exists ' +
        (await dbNamesOf(repo.metadata, db.wrapIdentifier)).$entityName,
    )
    await db.ensureSchema([repo.metadata])
    return repo
  }
  it('null last', async () => {
    @Entity('myEntity')
    class MyEntity {
      @Fields.number()
      id = 0
      @Fields.number({ allowNull: true })
      value: number | null = 0
    }
    const r = await createEntity(MyEntity)
    await r.insert([
      { id: 1, value: null },
      { id: 2, value: 2 },
      { id: 3, value: 3 },
    ])
    expect(
      (await r.find({ orderBy: { value: 'desc' } })).map((x) => x.value),
    ).toEqual([3, 2, null])
  })
  it('null first', async () => {
    @Entity('myEntity')
    class MyEntity {
      @Fields.number()
      id = 0
      @Fields.number({ allowNull: true })
      value: number | null = 0
    }
    const r = await createEntity(MyEntity)
    await r.insert([
      { id: 1, value: null },
      { id: 2, value: 2 },
      { id: 3, value: 3 },
    ])
    expect(
      (await r.find({ orderBy: { value: 'asc' } })).map((x) => x.value),
    ).toEqual([null, 2, 3])
  })
})

describe.skipIf(!postgresConnection)('Postgres Knex', () => {
  knexTests(
    Knex.default({
      client: 'pg',
      connection: postgresConnection,
      //debug:true
    }),
  )
})

@Entity('Categories')
class testErrorInFromDb {
  @Fields.integer({ dbName: 'CategoryID' })
  id = 0
  @Fields.string({
    valueConverter: {
      fromDb: (x) => {
        throw 'error'
      },
    },
  })
  categoryName = ''
}
