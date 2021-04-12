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

  module.exports = {LANGUAGE, SORT}