const { GraphQLEnumType} = require('graphql')

const LANGUAGE = new GraphQLEnumType({
    name: 'LANGUAGE',
    values: {
      NL :{},
      FR : {},
      EN :{},
      DE :{}
    },
  });


  const SORT = new GraphQLEnumType({
    name: 'SORT',
    values: {
      ASC :{},
      DESC : {}
    },
  });

  const CONCEPT_TYPE = new GraphQLEnumType({
    name: 'CONCEPT_TYPE',
    values: {
      ONLY_LEAF :{},
      ONLY_TOP : {},
      ALL : {}
    },
  });

  module.exports = {LANGUAGE, SORT, CONCEPT_TYPE}