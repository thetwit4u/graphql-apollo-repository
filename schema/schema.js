const {GraphQLSchema} = require('graphql')
const queryType = require('./QueryType')

const schema = new GraphQLSchema({
  query: queryType,
  // mutation: mutationType,
});


module.exports = schema;