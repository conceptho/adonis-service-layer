function createTables () {
  const Database = use('Database')

  return Promise.all([
    Database.schema.createTable('users', table => {
      table.increments()
      table.string('email')
      table.string('password')
      table.boolean('deleted').defaultTo(false)
      table.timestamps()
    }),

    Database.schema.createTable('profiles', table => {
      table.increments()
      table.integer('user_id').notNullable().references('id').inTable('users')
      table.boolean('deleted').defaultTo(false)
      table.timestamps()
    })
  ])
}

module.exports = {
  createTables
}
