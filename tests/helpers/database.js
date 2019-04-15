async function createTables () {
  const Database = use('Database')

  await Database.raw(`
    drop table if exists profiles;
    drop table if exists users;
  `)

  await Database.schema.createTable('users', table => {
    table.increments()
    table.string('email')
    table.string('password')
    table.boolean('deleted').defaultTo(false)
    table.timestamps()
  })

  await Database.schema.createTable('profiles', table => {
    table.increments()
    table.integer('user_id').notNullable().references('id').inTable('users')
    table.boolean('deleted').defaultTo(false)
    table.timestamps()
  })
}

module.exports = {
  createTables
}
