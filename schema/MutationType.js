const {AddConceptToHRLPDocumentMutation, RemoveConcepFromHRLPDocumentMutation} = require('./Types')
const { GraphQLObjectType} = require('graphql')

const mutationType = new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
        addConceptToHRLPDocument: AddConceptToHRLPDocumentMutation,
        removeConceptFromHRLPDocument: RemoveConcepFromHRLPDocumentMutation
    }),
  });

  module.exports = mutationType