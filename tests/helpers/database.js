async function createTables () {
  const Database = use('Database')

  await Database.raw(`drop table if exists profiles`)
  // await Database.raw(`delete from table if exists _user_posts where true`)
  await Database.raw(`drop table if exists _user_posts`)
  // await Database.raw(`delete from table if exists _user_address where true`)
  await Database.raw(`drop table if exists _user_address`)
  await Database.raw(`drop table if exists addresses`)
  await Database.raw(`drop table if exists posts`)
  await Database.raw(`drop table if exists users`)

  await Database.schema.createTable('users', table => {
    table.increments()
    table.string('email')
    table.string('password')
    table.boolean('deleted').defaultTo(false)
    table.timestamps(true, true)
  })

  await Database.schema.createTable('posts', table => {
    table.increments()
    table.string('comment')
    table.boolean('deleted').defaultTo(false)
    table.timestamps(true, true)
  })

  await Database.schema.createTable('_user_posts', table => {
    table.increments()
    table.integer('user_id').notNullable().unsigned().references('id').inTable('users')
    table.integer('post_id').notNullable().unsigned().references('id').inTable('posts')
  })

  await Database.schema.createTable('addresses', table => {
    table.increments()
    table.string('value')
    table.boolean('deleted').defaultTo(false)
    table.timestamps(true, true)
  })

  await Database.schema.createTable('_user_address', table => {
    table.increments()
    table.integer('user_id').notNullable().unsigned().references('id').inTable('users')
    table.integer('address_id').notNullable().unsigned().references('id').inTable('addresses')
  })

  await Database.schema.createTable('profiles', table => {
    table.increments()
    table.integer('user_id').notNullable().unsigned().references('id').inTable('users')
    table.boolean('deleted').defaultTo(false)
    table.timestamps(true, true)
  })
}

module.exports = {
  createTables
}
