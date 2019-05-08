module.exports = Schema => (
  class ConcepthoSchema extends Schema {
    async createPivotTable (name, table1, table2, table1PrimaryKey = 'id', table2PrimaryKey = 'id') {
      return this.create(name, table => {
        table.increments()
        table
          .integer(`${table1}_${table1PrimaryKey}`)
          .unsigned()
          .notNullable()
          .references(table1PrimaryKey)
          .inTable(table1)
        table
          .integer(`${table2}_${table2PrimaryKey}`)
          .unsigned()
          .notNullable()
          .references(table2PrimaryKey)
          .inTable(table2)
      })
    }
  }
)
