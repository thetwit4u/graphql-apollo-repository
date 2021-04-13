require('dotenv').config()

const {ApolloServer} = require('apollo-server')
const ConceptSchemeAPI = require('./datasources/conceptschemes')
const ConceptAPI = require('./datasources/concepts')
const DocumentAPI = require('./datasources/documents')
// const UserAPI = require('./datasources/users')
const schema = require('./schema/schema')


const dataSources = () => ({
  conceptSchemeAPI: new ConceptSchemeAPI(),
  conceptAPI: new ConceptAPI(),
  documentAPI: new DocumentAPI()
})

const server = new ApolloServer({
  schema,
  dataSources,
  introspection: true,
  playground: true,
});


server
  .listen({port: process.env.PORT || 3333})
  .then(({url}) => {
    console.log(`graphQL running at ${url}`);
  })
