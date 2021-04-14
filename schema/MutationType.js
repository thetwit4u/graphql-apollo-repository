const {AddConceptToHRLPDocumentMutation} = require('./Types')
const { GraphQLObjectType} = require('graphql')

const mutationType = new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
        addConceptToHRLPDocument: AddConceptToHRLPDocumentMutation,
    }),
  });

  module.exports = mutationType