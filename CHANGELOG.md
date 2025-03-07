# Changelog

All notable changes to this project will be documented in this file.

## [0.25.6] TBD

- Added support for `orderByNullsFirst` in `PostgresDataProvider` to change the default postgres behavior where nulls are last
- Added support for `tableName` option argument for `dbNamesOf` that'll add the table name to each field
  Before:
  ```ts
  const orders = await dbNamesOf(Order)
  return `(select count(*) from ${orders} where ${orders}.${orders.id}=1)
  ```
  Now:
  ```ts
  const orders = await dbNamesOf(Order, { tableNames:true })
  return `(select count(*) from ${orders} where ${orders.id}=1)
  ```
- improved dbNamesOf of to use by default the wrapIdentifier of the current data provider if no wrap identifier was provided
- Added support for using dbNamesOf in an sql expression for that same entity
- Improved performance of dbNamesOf
- Added support for [Hono](https://hono.dev/) web framework
- Improved support for Mono repo scenario [#355](https://github.com/remult/remult/issues/355)
- Added `withRemult` to next js page router
- Fixed custom message to some validators (in etc...)
- Improved support for union string fields

## [0.25.5] 2024-02-11

- Added `admin` option to servers, enabling the `/api/admin` route with a built in entity explorer
- Fixed multiple issues with GraphQL and relations
- Improved support for esm/cjs in same process scenario
- Enabled json storage type for mysql & mysql2 knex adapters
- Fixed issue in case of missing `reflect-metadata`
- Added a recommended way to use remult in `sveltekit` using `api/[...remult]/+server.ts` route instead of a hook
- Added ArrayEntityDataProvider to the external api

## [0.25.4] 2024-01-15

- Fixed issue where a new row that was saved, changed again and saved again - provide wrong `isNew:true` value for field validate

## [0.25.3] 2024-01-15

- Fixed [#320](https://github.com/remult/remult/issues/320), dbReadonly columns are not created in the db

## [0.25.2] 2024-01-12

- Fix the `defaultMessage` of validators
- Added Validators.minLength

## [0.25.1] 2024-01-11

- Fixed issue where `defaultGetLimit` caused issues with include queries

## [0.25.0] 2024-01-10

### Improvement for validators

- Added `required` as a `FieldOption`
- Added validation for `maxLength` in `StringFieldOptions`
- Added the following validators to the `Validators` class:
  - regex
  - email
  - url
  - in
  - notNull
  - enum
  - relationExists,
  - maxLength
- Added support for return value for validations - true || undefined are valid, string will provide the message. For example:
  ```ts
  @Fields.string({
    validate:(task)=> task.title.length > 5 || "too short"
  })
  ```
- Added the `valueValidator` helper function:
  ```ts
  @Fields.string({
    validate: valueValidator(value => value.length > 5)
  })
  ```
- Added helper functions to create validators, `createValueValidator`, `createValueValidatorWithArgs`, `createValidator` & `createValidatorWithArgs`
- Changed signature of `FieldOptions`.`validate` the receive `ValidateFieldEvent` object as the second parameter instead of `FieldRef`
- Updated Signature of `required` and `unique` based on api change
- Adjusted the `unique` validator to only run on the backend

### New Frontend Data Providers

- Added Origin Private File System Storage to store entities in the front end
  ```ts
  const db = new JsonDataProvider(new JsonEntityOpfsStorage())
  repo(Task, db)
    .find()
    .then((tasks) => console.table(tasks))
  ```
- Added `SqlJsDataProvider` for use with front end sqlite implementation [sql.js](https://sql.js.org/)
  ```ts
  const db = new SqlDatabase(
    new SqlJsDataProvider(initSqlJs().then((x) => new x.Database())),
  )
  repo(Task, db)
    .find()
    .then((tasks) => console.table(tasks))
  ```

### Other

- Added `clone` to `EntityRef`
- Fixed issue where `findOne` didn't work
- Fixed issue where exception `XXX is not a known entity, did you forget to set @Entity() or did you forget to add the '@' before the call to Entity?` was thrown in cases where multiple instances of remult were in memory
- Issue [#314](https://github.com/remult/remult/issues/314) resolved by @itamardavidyan in https://github.com/remult/remult/pull/315

## [0.24.1] 2023-12-30

- Improved JsonDataProvider to support promise for load and save, useful in all sorts of cases
- Fixed issue with ESM on NodeJS - Module '"remult/postgres"' has no exported member 'createPostgresDataProvider'.

## [0.24.0] 2023-12-29

### Changed

- **BREAKING CHANGE: PostgresDataProvider:** Column & table names are now quoted (e.g., `"firstName"`) to enforce specific casing in PostgreSQL.
  - To revert to the old (version < 0.24) case-insensitive identifiers, set `caseInsensitiveIdentifiers: true` when using `createPostgresDataProvider`.

### Added

- ESM support for NodeJS
- Support for [nuxt](https://nuxt.com/) Fullstack framework
- Support for the `sqlExpression` field option in entities using the `knex` data provider.
- `schema` parameter to `PostgresDataProvider` & `createPostgresDataProvider`.
- `findOne` method in `Repository` with a unified `options` parameter for simplicity.
- `withRemultAsync` function in `remultExpress` for contexts outside the normal request lifecycle.
- `withRemult` function for obtaining a valid remult context in server scenarios.
- Inclusion of `EntityMetadata` in `CaptionTransformer.transformCaption` method.
- `dbName` attribute in `EntityMetadata` & `FieldMetadata`.
- `wrapIdentifier` optional parameter in `dbNamesOf` function.
- `dbNames` as an optional parameter in the `filterToRaw` method of `SqlDatabase`.
- `wrapIdentifier` method in `SqlDatabase` for wrapping identifiers before sending to the database.

### Deprecated

- `getDbName` method in `EntityMetadata` & `FieldMetadata` (to be removed in future versions).

### Removed

- `run` method from `Remult`.

### Renamed

- `withRemultPromise` to `withRemultAsync` in `RemultServer`.

## [0.23.6] 2023-12-26

- Fixed issue where delete by id on the backend, didn't go through the deleting hook

## [0.23.5] 2023-12-23

- Fixed `toOne` relation filter null for non nullable fields to work
- Fixed `toOne` relation filter on $id:0 failed to work
- Fixed wrongful loading of `toMany` relation on api with `defaultIncluded`

## [0.23.4] 2023-12-20

- Fixed Live query to also work in init api [#306](https://github.com/remult/remult/issues/306)

## [0.23.3] 2023-12-19

- Added support for notContains filter option

## [0.23.1] 2023-12-12

- Fixed case insensitivity in contains for mongo db

## [0.23.0] 2023-12-11

- Added Relations - see [Relations](https://remult.dev/docs/entity-relations.html)
- Added LifecycleEvent info for saving,saved,deleting,deleted - see [Entity Lifecycle Hooks](https://remult.dev/docs/lifecycle-hooks.html)
- Saving, Saved, Deleting, Deleted all run only on the backend now
- include in api now supports expressions that use the current row
  - Breaking change - instead of `if(repo.fields.name.includedInApi)` you now need `if(repo.fields.name.includedInApi(instance))`
- Changed the way an entity id is defined see [Entity id's doc](http://localhost:5173/docs/ref_entity.html#id)
  Example:

  ```ts
  @Entity<OrderDetails>("orderDetails", { id: { orderId: true, productCode: true } })
  ```

- added repo function which is A convenient shortcut function to quickly obtain a repository for a specific entity type in Remult.

  ```ts
  await repo(Task).find()
  ```

- Added support for (Hapi api server)[https://hapi.dev/]
- Fixed exception with toRawFilter
- Fixed json db to support db names
- Fixed issue with sort result after live query
- Fix issue with compound id on middleware based servers
- Added with remult for sveltekit for usage before the remult hook
- Fixed issue with requireId not respecting in statement #290
- `findId` was changed to no longer use cache by default

## [0.22.12] 2023-11-26

- [#297](https://github.com/remult/remult/issues/297) - Crash on ensure schema failure

## [0.22.11] 2023-11-23

- Improved support for Mongo `ObjectId` field type [#295](https://github.com/remult/remult/issues/295)

## [0.22.10] 2023-11-17

- Fixed issue with `repo.validate` without specifying fields

## [0.22.9] 2023-10-06

- Fixed issue with Entity Backend Method and fields with allow api false #255

## [0.22.8] 2023-09-27

- Fixed an issue with rest call that had both and & or
- Fixed an issue regarding the usage of ManyToOne fields as part of the id

## [0.22.7] - 2023-09-05

- Fixed max stack reached in case of reference to self
- Improved graphql one to many relations
- Fixed live-query issue with complex filters
- Refactored tests to use vitest, and latest typescript version
- Fixed issue with postgres schema builder
- Fixed schema build to support table name with schema name
- Cleaned up code and removed angular dependency

## [0.22.6] - 2023-08-10

- Implemented $contains for mongo
- Implemented contains for graphql

## [0.22.5] - 2023-08-09

- Fixed issue [#220](https://github.com/remult/remult/issues/220)

## [0.22.4] - 2023-08-03

- Fixed an issue where an update with only a few fields, would update all other fields to their default values.

## [0.22.3] - 2023-08-02

- Fixed an issue with the many-to-one relation where the 'many' table did not store the ID as a `string` in cases where the 'one' table's ID column was not an integer
- Added tests for MariaDB and fixed issues

## [0.22.2] - 2023-07-30

- Fixed [#216](https://github.com/remult/remult/issues/216) wrong date type saved on update

## [0.22.1] - 2023-07-25

- Fixed issue [#215](https://github.com/remult/remult/issues/215) support for mongo without transactions

## [0.22.0] - 2023-07-16

- Added `ToJson` and `FromJson` methods the the `Repository` object. These are extremely useful in the context of SSR (next etc...) where you need to send plain json over the wire, but still want to have dates and other cool stuff in your app
- Fixed an issue with the many-to-one relation where the 'many' table did not store the ID as an 'integer' in cases where the 'one' table's ID column was an integer
- Fixed issue where using displayValue or validate on a spread object, marked it as new, and always triggered a post call
- Added Remult.run
- isBackend will return true or false based on dataProvider.isProxy equal false or runningOnServer member
- Backend method will call backend based on isBackend method,
- Replaced deprecated cuid with `paralleldrive/cuid2`
- Fixed an issue where when `getDb` was called without a `remult` parameter, it wouldn't use the default remult
- Fixed liveQuery's apply changes to also support state that it's initial value is undefined.
- Typescript 5 style decorators are now supported in development, but to deploy you still need `experimentalDecorators` .
  - Also, the decorators now do type checking, so if you put @Fields.string() on a number, it'll give you an error
  - And - no longer need for the Generics in the decorators setting.
    - `@Entity<Task>(...)` is now `@Entity(...)`
    - `@Fields.string<Task>(...)` is now `@Fields.string(...)`
  - Why didn't we implement typescript 5 decorators in runtime? the implementation for that is not yet fully supported with tools such as esbuild etc... so implementing it is trying to hit a moving target.
    At this time we recommend using `experimentalDecorator:false` for development, to get the typing, but `experimentalDecorator:true` for deploying and functionality.
- Added 404 on missing route for next app router - issue #211
- Fixed an issue where live query would not unsubscribe automatically to a query that failed to fetch.
- Fixed an issue where, when using the cache with findId or findFirst, and requesting to load fields, if the cache contained a row without those fields, it would return the cached row without those fields.
- Fixed an issue where in a filter that contained multiple instances of the same custom filter, with an 'and' condition did not work correctly
- Graphql Mutations now display validation errors in the graphql way

## [0.21.1] - 2023-06-25

- Fixed issue with `Field.Json` fails to insert in case of array

## [0.21.0] - 2023-06-22

- Major improvements to the GraphQL support:
  - Better Query support
  - Mutation Support
  - Improved compatibility to standard GraphQL structures
  - **Breaking Change** Note that the GraphQL Schema has changed, and client code needs to be adjusted. If you run into any issues, please open a github issue or reach out to us on discord.
- Improved SQL Log to Console see [PR #204](https://github.com/remult/remult/pull/204),

### Big Thanks

- to [jycouet](https://github.com/jycouet) for his first two pull requests, and his help forming the GraphQL Schema according to best practices.
- to [talmosko](https://github.com/talmosko) for his help and improvements for the tutorials and documentation.

## [0.20.6] - 2023-06-19

- Fixed an issue when apiPrefilter was an arrow function, it did not affect get of a specific resource

## [0.20.5] - 2023-06-11

- fixed issue #200 transactions on mongo db

## [0.20.4] - 2023-06-05

- fixed issue with columns in postgres with casing in the db - sa `createdAt`
- Issue #196 fixed - load options in live query
- Fixed issue with `apiReadAllowed:false` when `apiUpdateAllowed` is set to undefined

## [0.20.3] - 2023-05-23

- Improved Open API Support

## [0.20.2] - 2023-05-22

- createdAt & updatedAt are by default `allowApiUpdate` false
- Added `apiPrefix` to `BackendMethod` `options` to allow more control over backend method routes. #189

## [0.20.1] - 2023-05-17

- Improved support for compound id entity
- Minor bug fixes
- Improved memory usage

## [0.20.0] - 2023-05-08

- Added `handle` method for using remult in `next.js` api handlers. see [using remult in a next.js api handler](https://remult.dev/tutorials/react-next/appendix-1-get-server-side-props.html#using-remult-in-a-next-js-api-handler)
- Added `remult-sveltekit` see [Add remult to your project](https://remult.dev/docs/add-remult-to-your-app.html#sveltekit)
- Added support for `next.js` App Router. See [Add remult to your project](https://remult.dev/docs/add-remult-to-your-app.html#next-js-app-router)

## [0.19.0] - 2023-03-26

- `Repository`
  - Added a `validate` method that returns an `ErrorInfo` object if invalid.
  - Added a `fields` member that can be used to access the metadata of specific fields, for example:
    ```ts
    repo.fields.title.caption
    //or
    repo.fields.title.inputType
    ```
  - The `insert`, `validate`, `create`, `save` and `update` value will now run `fromJson` and `toJson` for field values that do not match their type - for consistent behavior with the `api`
- `FieldMetadata`
  - Added `apiUpdateAllowed` to query if `update` is allowed for this field
  - Added `includedInApi` to query of this field would be returned from the backend as part of the api
  - Added `displayValue` that can be used to achieve a consistent way a field is displayed.
  - Added `toInput` and `fromInput` methods that'll help with translating values from and to inputs.
- `getId` method added to `IdMetadata` to enable extracting the id from immutable objects, this is mainly useful for entities where the `id` column is not called `id` :)
  ```ts
  repo.metadata.idMetadata.getId(task)
  ```
-

### Breaking Changes

- In `EntityMetadata` the `apiUpdateAllowed`, `apiDeleteAllowed` and `apiInsertAllowed` that previously were boolean fields, are now methods that accepts item and return true or false. This is useful for cases where the apiAllowed rules refer to the specific values of an entity.
  ```ts
  // Previously
  if (repo.metadata.apiDeleteAllowed) {
  }
  // Now
  if (repo.metadata.apiDeleteAllowed(task)) {
  }
  ```
- The `validate` method in `EntityRef` and `ControllerRef` that previously returned true if valid, now returns `undefined` if valid and `ErrorInfo` if invalid
- `FieldMetadata`'s `ValueConverter` field's members are now mandatory and no longer optional - it's expected that they'll be implemented
