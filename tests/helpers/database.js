const createTables = (database) =>
  Promise.all([
    database.schema.createTable('users', table => {
      table.increments()
      table.string('email').notNullable()
      table.string('password').notNullable()
      table.boolean('deleted').defaultTo(false)
      table.timestamps()
    }),

    database.schema.createTable('profiles', table => {
      table.increments()
      table.integer('user_id').notNullable().references('id').inTable('users')
      table.boolean('deleted').defaultTo(false)
      table.timestamps()
    })
  ])

module.exports = {
  createTables
}
