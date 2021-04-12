const {globalIdField, fromGlobalId,connectionFromArray, connectionArgs,mutationWithClientMutationId ,connectionDefinitions, nodeDefinitions, cursorToOffset} = require('graphql-relay')
const {GraphQLSchema, GraphQLObjectType, GraphQLID, GraphQLString, GraphQLNonNull, GraphQLInt, GraphQLInputObjectType,GraphQLList} = require('graphql')
const { GraphQLDateTime,GraphQLDate } = require('graphql-iso-date')
const { GraphQLJSONObject } = require('graphql-type-json')


const faker = require('faker')

const DEFAULT_LANGUAGE = 'EN'
const {LANGUAGE} = require('./enumTypes')
const {SORT} = require('./enumTypes')



/**
 * Node Definitions
 */

const { nodeInterface, nodeField, nodesField } = nodeDefinitions(
  (globalId, {dataSources}) => {
    const { type, id } = fromGlobalId(globalId);
  //   if (type === 'User') return dataSources.userAPI.getUser(id);
  //   if (type === 'Race') return dataSources.userAPI.getRace(id);      
  if (_type === 'ConceptScheme') return dataSources.conceptSchemeAPI.getConceptSchemeById(id);
  if (_type === 'Concept') return dataSources.conceptAPI.getConceptById(id);
  return null;
  },
  (obj) => {
    if (obj.type === 'http://www.w3.org/2004/02/skos/core#ConceptScheme') {
      return ConceptSchemeType;
    }
    if (obj.type === 'http://www.w3.org/2004/02/skos/core#Concept') {
      // if (obj.bibliographicResourceType === 'http://data.wolterskluwer.com/apollo/resource/object-type/7c688f91-55e0-4a65-aec4-2185b30ef494') {
      // }
      return ConceptType;
    }
    return null;
  },
);

/**
 * Interface Types
 */


/**
 * ConceptScheme
 */

const ConceptSchemeFilterType = new GraphQLInputObjectType({
  name: 'ConceptSchemeFilter',
  fields: () => ({
    ids:  { type: new GraphQLList(GraphQLID)}
  })
});

const ConceptSchemeOrderByType = new GraphQLInputObjectType({
  name: 'ConceptSchemeOrderBy',
  fields: () => ({
    title_nl: { type: SORT},
    title_en: { type: SORT },
    title_fr: { type: SORT }
  })
});


const ConceptSchemeType = new GraphQLObjectType({
  name: 'ConceptScheme',
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField('ConceptScheme'),
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    created: {
      type: GraphQLDateTime,
      resolve: () => faker.date.recent(4)
    },
    modified: {
      type: GraphQLDateTime,
      resolve: () => faker.date.recent(1)
    },
    identifier: { type: GraphQLString },
    title: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args,{dataSources}) => {
        let langText = parent[`title_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
    definition: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args,{dataSources}) => {
        let langText = parent[`definition_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
    topConcepts: {
      type: conceptsConnection,
      description: 'Top Concepts of the Concept Scheme',
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({topconcepts}, args,{dataSources}) => {
        const concepts = await dataSources.conceptAPI.getConceptByIds(topconcepts,args);
        const totalCount = concepts.length
        return {
          ...connectionFromArray([...concepts],args),
          ...{totalCount : totalCount}
        }
      },
    },
  }),
});

const { connectionType: conceptSchemesConnection } = connectionDefinitions({
  nodeType: ConceptSchemeType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      resolve: (connection) => connection.totalCount,
      description: `A count of the total number of objects in this connection, ignoring pagination.
  This allows a client to fetch the first five objects by passing "5" as the
  argument to "first", then fetch the total count so it could display "5 of 83"
  for example.`
  }})});

//x _id: ID!
// type: Concept 
// inScheme: ConceptScheme
//x created: DateTime
//x creator: String
//x contributor: String
//x modified: DateTime
//x prefLabel(language:Language = EN): String
//x altLabel(language:Language = EN): String
//x definition(language:Language = EN): String
//x notation: String
//x narrower(filters:ConceptFilters): [Concept]
//x broader(filters:ConceptFilters): [Concept]


const ConceptFilterType = new GraphQLInputObjectType({
  name: 'ConceptFilter',
  fields: () => ({
    ids:  { type: new GraphQLList(GraphQLID)}
  })
});

const ConceptOrderByType = new GraphQLInputObjectType({
  name: 'ConceptOrderBy',
  fields: () => ({
    prefLabel_nl: { type: SORT},
    prefLabel_en: { type: SORT },
    prefLabel_fr: { type: SORT }
  })
});


const ConceptType = new GraphQLObjectType({
  name: 'Concept',
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField('Concept'),
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    created: {
      type: GraphQLDateTime,
      resolve: () => faker.date.recent(4)
    },
    creator: {
      type: GraphQLString,
      resolve: () => faker.name.lastName(),
    },
    contributor: {
      type: GraphQLString,
      resolve: () => faker.name.lastName(),
    },
    modified: {
      type: GraphQLDateTime,
      resolve: () => faker.date.recent(1)
    },
    prefLabel: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args) => {
        let langText = parent[`prefLabel_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
    altLabel: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args) => {
        let langText = parent[`altLabel_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
    definition: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args,{dataSources}) => {
        let langText = parent[`definition_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
    notation: {type: GraphQLString},
    broader: {
      type: conceptsConnection,
      description: 'Broader Concepts of the Concept',
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({broader}, args,{dataSources}) => {
        const concepts = await dataSources.conceptAPI.getConceptByIds(broader,args);
        const totalCount = concepts.length
        return {
          ...connectionFromArray([...concepts],args),
          ...{totalCount : totalCount}
        }
      },
    },
    narrower: {
      type: conceptsConnection,
      description: 'Narrower Concepts of the Concept',
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({narrower}, args,{dataSources}) => {
        const concepts = await dataSources.conceptAPI.getConceptByIds(narrower,args);
        const totalCount = concepts.length
        return {
          ...connectionFromArray([...concepts],args),
          ...{totalCount : totalCount}
        }
      },
    },
  }),
});

const { connectionType: conceptsConnection } = connectionDefinitions({
  nodeType: ConceptType,
  connectionFields: () => ({
  totalCount: {
    type: GraphQLInt,
    resolve: (connection) => connection.totalCount,
    description: `A count of the total number of objects in this connection, ignoring pagination.
This allows a client to fetch the first five objects by passing "5" as the
argument to "first", then fetch the total count so it could display "5 of 83"
for example.`
}})});


// const RaceType = new GraphQLObjectType({
//     name: 'Race',
//     interfaces: [nodeInterface],
//     fields: () => ({
//       id: globalIdField('Race'),
//       date: { type: GraphQLString, description: 'Date of the race' },
//       type: { type: GraphQLString, description: 'Type of race' },
//       time: { type: GraphQLString, description: 'Finish time of the race' },
//       user: {
//         type: UserType,
//         resolve: (source,args,{dataSources}) => dataSources.userAPI.getUser(source.userId),
//       },
//     }),
// });

// const { connectionType: raceConnection } = connectionDefinitions({
//     nodeType: RaceType,
// });

// const UserType = new GraphQLObjectType({
//   name: 'User',
//   description: 'A user who loves to run',
//   interfaces: [nodeInterface],
//   fields: () => ({
//     id: globalIdField(),
//     username: { type: GraphQLString, description: 'The name of the user' },
//     email: { type: GraphQLString },
//     races: {
//       type: raceConnection,
//       description: 'The races for a specific user',
//       args: connectionArgs,
//       resolve: async (user, args,{dataSources}) => {
//         const userRaces = await dataSources.userAPI.getRaces(user.id);
//         // Very powerful helper function below. This is what gives us many of our paging options
//         // ... first, last, after, before
//         return connectionFromArray([...userRaces], args);
//       },
//     },
//   }),
// });

// const { connectionType: userConnection } = connectionDefinitions({
//     nodeType: UserType,
// });


// const AddRaceMutation = mutationWithClientMutationId({
//     name: 'addRace',
//     inputFields: {
//         type: { type: new GraphQLNonNull(GraphQLString) },
//         date: { type: new GraphQLNonNull(GraphQLString) },
//         time: { type: new GraphQLNonNull(GraphQLString) },
//         userId: { type: new GraphQLNonNull(GraphQLInt) },
//     },
//     outputFields: {
//         race: {
//         type: RaceType,
//         resolve: (payload,args,{dataSources}) => dataSources.userAPI.getRace(payload.raceId),
//         },
//         user: {
//         type: UserType,
//         resolve: (payload,args,{dataSources}) => dataSources.userAPI.getUser(payload.userId),
//         },
//     },
//     mutateAndGetPayload: ({
//         type, date, time, userId,
//     }) => dataSources.userAPI.addRace(type, date, time, userId),
// });


// const DeleteRaceMutation = mutationWithClientMutationId({
//     name: 'deleteRace',
//     inputFields: {
//         id: { type: new GraphQLNonNull(GraphQLInt) },
//         userId: { type: new GraphQLNonNull(GraphQLInt) },
//     },
//     outputFields: {
//         deletedRace: {
//         type: RaceType,
//         resolve: (payload,args,{dataSources}) => payload.race,
//         },
//         user: {
//         type: UserType,
//         resolve: ({ userId }) => dataSources.userAPI.getUser(userId),
//         },
//     },
//     mutateAndGetPayload: ({ id, userId }) => dataSources.userAPI.deleteRace(id, userId),
// });


// const EditRaceMutation = mutationWithClientMutationId({
//     name: 'editRace',
//     inputFields: {
//         id: { type: new GraphQLNonNull(GraphQLInt) },
//         userId: { type: new GraphQLNonNull(GraphQLInt) },
//         type: { type: GraphQLString },
//         date: { type: GraphQLString },
//         time: { type: GraphQLString },
//     },
//     outputFields: {
//         editedRace: {
//         type: RaceType,
//         resolve: (payload) => payload,
//         },
//         user: {
//         type: UserType,
//         resolve: ({ userId },args,{dataSources}) => dataSources.userAPI.getUser(userId),
//         },
//     },
//     mutateAndGetPayload: ({
//         id, userId, type, date, time,
//     }) => dataSources.userAPI.editRace(id, userId, type, date, time),
// });

/**
 * Query Type
 */


const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        conceptSchemes: {
          type: conceptSchemesConnection,
          description: 'All ConceptSchemes',
          args: {
            ...connectionArgs,
            orderBy: {type: ConceptSchemeOrderByType},
            filters: { type: ConceptSchemeFilterType }
          },
          resolve: async (_, args,{dataSources}) => {
            const conceptSchemes = await dataSources.conceptSchemeAPI.getConceptSchemes(args);
            const totalCount = conceptSchemes.length
            return {
              ...connectionFromArray([...conceptSchemes],args),
              ...{totalCount : totalCount}
            }
          },
        },
        concepts: {
          type: conceptsConnection,
          description: 'All Concepts',
          args: {
            ...connectionArgs,
            orderBy: {type: ConceptOrderByType},
            filters: { type: ConceptFilterType }
          },
          resolve: async (_, args,{dataSources}) => {
            const concepts = await dataSources.conceptAPI.getConcepts(args);
            const totalCount = concepts.length
            return {
              ...connectionFromArray([...concepts],args),
              ...{totalCount : totalCount}
            }
          },
        },
        // user: {
        //   type: UserType,
        //   args: { id: { type: GraphQLID } },
        //   resolve: (_, args,{dataSources}) => {
        //     const { id } = fromGlobalId(args.id);
        //     return dataSources.userAPI.getUser(id);
        //   },
        // },
        // users: {
        //   type: userConnection,
        //   description: 'All users',
        //   args: connectionArgs,
        //   resolve: async (user, args,{dataSources}) => {
        //     const users = await dataSources.userAPI.getUsers();
        //     return connectionFromArray([...users], args);
        //   },
        // },
        // race: {
        //   type: RaceType,
        //   args: { id: { type: GraphQLID } },
        //   resolve: (_, args,{dataSources}) => {
        //     const { id } = fromGlobalId(args.id);
        //     return dataSources.userAPI.getRace(id);
        //   },
        // },
        // viewer: {
        //   type: UserType,
        //   resolve: (_,args,{dataSources}) => dataSources.userAPI.getViewer(),
        // },
        node: nodeField,
        nodes: nodesField,
      }),
    });
  

    // const mutationType = new GraphQLObjectType({
    //     name: 'Mutation',
    //     fields: () => ({
    //             addRace: AddRaceMutation,
    //             deleteRace: DeleteRaceMutation,
    //             editRace: EditRaceMutation,

    //     }),
    // });


/**
 * Construct Schema
 */    
const schema = new GraphQLSchema({
    query: queryType,
    // mutation: mutationType,
});

  
module.exports = schema;