
const _ = require('lodash')
const {globalIdField, fromGlobalId,  toGlobalId,connectionFromArray, connectionArgs,mutationWithClientMutationId ,connectionDefinitions, nodeDefinitions, cursorToOffset} = require('graphql-relay')
const {GraphQLSchema, GraphQLObjectType, GraphQLID, GraphQLString, GraphQLNonNull, GraphQLInt, GraphQLInputObjectType,GraphQLList, GraphQLBoolean, GraphQLInterfaceType} = require('graphql')
const { GraphQLDateTime,GraphQLDate } = require('graphql-iso-date')
const { GraphQLJSONObject } = require('graphql-type-json')


const faker = require('faker')


const DEFAULT_LANGUAGE = 'EN'
const {LANGUAGE, SORT} = require('./enumTypes')




/**
 * Interface Types
 */


const IApolloDocumentInterface = new GraphQLInterfaceType({
  name: 'IApolloDocument',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    identifier: {type: GraphQLString, description:'derived from MACK Content Expression'},
    title: {
      type: GraphQLString,
      description: 'derived from MACK Content Expression',
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
    },
//    bibliographicResourceType: {type: ConceptType, description:'derived from bibliographicResourceType MACK Content Work'},
    inPublication: {type: ApolloPublicationType, description:'derived from bibliographicResourceType MACK Content Expression'},

  }),
  resolveType: (obj) => {
      // if(obj.inPublication === 'wkbe-news'){
      //   return WKBENewsDocumentType
      // }
      // if(obj.inPublication === 'wkbe-legislation'){
      //   return WKBELegislationDocumentType
      // }
      if(obj.inPublication === 'hrlp-lippincott-procedures'){
        return HRLPDocument
      }
      return null;
  }
});


 const IConceptInterface = new GraphQLInterfaceType({
  name: 'IConcept',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    created: { type: GraphQLDateTime},
    creator: { type: GraphQLString },
    contributor: {type: GraphQLString},
    modified: { type: GraphQLDateTime},
    prefLabel: { 
        type: GraphQLString,
        args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
    },
    altLabel: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
    },
    definition: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
    },
    notation: {type: GraphQLString},
    hasNarrower: { type: GraphQLBoolean},
    broader: {
      type: conceptsConnection,
      args: {
          ...connectionArgs,
          orderBy: {type: ConceptOrderByType},
          filters: { type: ConceptFilterType }
      }
    },
    narrower: {
      type: conceptsConnection,
      args: {
          ...connectionArgs,
          orderBy: {type: ConceptOrderByType},
          filters: { type: ConceptFilterType }
      }
    },
  }),
  resolveType: (obj) => {
      if(obj.bibliographicResourceType === 'http://data.wolterskluwer.com/apollo/resource/object-type/7c688f91-55e0-4a65-aec4-2185b30ef494'){
        return ApolloPublicationType
      }
      return ConceptType;
  }
});



/**
 * Node Definitions
 */

const { nodeInterface, nodeField, nodesField } = nodeDefinitions(
  (globalId, {dataSources}) => {
    const { type, id } = fromGlobalId(globalId);;      
    if (type === 'ConceptScheme') return dataSources.conceptSchemeAPI.getConceptSchemeById(id);
    if (type === 'Concept') return dataSources.conceptAPI.getConceptById(id);
    if (type === 'ApolloPublication') return dataSources.conceptAPI.getConceptById(id);
    if (type === 'HRLPDocument') return dataSources.documentAPI.getDocumentById(id);
    return null;
  },
  (obj) => {
    if(obj.bibliographicResourceType === 'http://data.wolterskluwer.com/apollo/resource/object-type/7c688f91-55e0-4a65-aec4-2185b30ef494'){
      return ApolloPublicationType;
    }
    if (obj.type === 'http://www.w3.org/2004/02/skos/core#ConceptScheme') {
      return ConceptSchemeType;
    }
    if (obj.type === 'http://www.w3.org/2004/02/skos/core#Concept') {
      return ConceptType;
    }
    if(obj.inPublication === 'hrlp-lippincott-procedures'){
      return HRLPDocumentType
    }
    return null;
  },
);



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
    ids:  { type: new GraphQLList(GraphQLID)},
    conceptSchemeId : { type: GraphQLID}
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
  interfaces: [nodeInterface, IConceptInterface],
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
      resolve: (parent, args) => {
        let langText = parent[`definition_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
    notation: {type: GraphQLString},
    conceptScheme: {
      type: ConceptSchemeType,
      resolve: async ({inscheme}, args,{dataSources}) => {
        const id =  inscheme.split('/').pop()
        const conceptScheme = await dataSources.conceptSchemeAPI.getConceptSchemeById(id);
        return conceptScheme
      },
    },
    hasNarrower: {
      type: GraphQLBoolean,
      resolve: ({narrower}, args) => {
        const res =  (narrower && (narrower?.length > 0))?true:false
        return res
      },
    },
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
  nodeType: IConceptInterface,
  connectionFields: () => ({
  totalCount: {
    type: GraphQLInt,
    resolve: (connection) => connection.totalCount,
    description: `A count of the total number of objects in this connection, ignoring pagination.
This allows a client to fetch the first five objects by passing "5" as the
argument to "first", then fetch the total count so it could display "5 of 83"
for example.`
}})});


/**
 * Publication Type
 */


 const ApolloPublicationType = new GraphQLObjectType({
  name: 'ApolloPublication',
  interfaces: [nodeInterface, IConceptInterface],
  fields: () => ({
    id: globalIdField('ApolloPublication'),
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
    title: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args) => {
        let langText = parent[`title_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
    definition: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args) => {
        let langText = parent[`definition_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
    notation: {type: GraphQLString},
    conceptScheme: {
      type: ConceptSchemeType,
      resolve: async ({inscheme}, args,{dataSources}) => {
        const id =  inscheme.split('/').pop()
        const conceptScheme = await dataSources.conceptSchemeAPI.getConceptSchemeById(id);
        return conceptScheme
      },
    },
    bibliographicResourceType: {
        type: ConceptType,
        description: 'bibliographicResourceType',
        resolve: async ({bibliographicResourceType}, args,{dataSources}) => {
          const bibresId =  bibliographicResourceType.split('/').pop()
          const concept = await dataSources.conceptAPI.getConceptById(bibresId);
          return concept
        },
    },
    hasNarrower: {
      type: GraphQLBoolean,
      resolve: ({narrower}, args) => {
        const res =  (narrower && (narrower?.length > 0))?true:false
        return res
      },
    },
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

const { connectionType: publicationsConnection } = connectionDefinitions({
  nodeType: ApolloPublicationType,
  connectionFields: () => ({
  totalCount: {
    type: GraphQLInt,
    resolve: (connection) => connection.totalCount,
    description: `A count of the total number of objects in this connection, ignoring pagination.
This allows a client to fetch the first five objects by passing "5" as the
argument to "first", then fetch the total count so it could display "5 of 83"
for example.`
}})});


/**
 * Documents
 */


 const HRLPDocumentType = new GraphQLObjectType({
  name: 'HRLPDocument',
  interfaces: [nodeInterface, IApolloDocumentInterface],
  fields: () => ({
    id: globalIdField('HRLPDocument'),
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
    inPublication: {
      type: ApolloPublicationType,
      description: 
      `Publication : unique collection for this type of documents 
      [MACK Content Expression -> pcicore:isInPublication]`,
      resolve: async ({inPublication}, args,{dataSources}) => {
        const pubData = await dataSources.conceptAPI.getConceptById(inPublication);
        return pubData
      },
    }

  }),
});

const { connectionType: hrlpDocumentConnection } = connectionDefinitions({
  nodeType: HRLPDocumentType,
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
          resolve: async (_obj, args,{dataSources}) => {
            const conceptSchemes = await dataSources.conceptSchemeAPI.getConceptSchemes(args);
            const totalCount = conceptSchemes.length
            return {
              ...connectionFromArray([...conceptSchemes],args),
              ...{totalCount : totalCount}
            }
          },
        },
        conceptScheme: {
          type: ConceptSchemeType,
          description: 'Get a conceptscheme with GlobalID',
          args: {
            id: {type:GraphQLNonNull(GraphQLID)}
          },
          resolve: async (_obj, args,{dataSources}) => {
            const {id} = fromGlobalId(args.id)
            const conceptScheme = await dataSources.conceptSchemeAPI.getConceptSchemeById(id);
            return conceptScheme
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
          resolve: async (_obj, args,{dataSources}) => {
            const concepts = await dataSources.conceptAPI.getConcepts(args);
            const totalCount = concepts.length
            return {
              ...connectionFromArray([...concepts],args),
              ...{totalCount : totalCount}
            }
          },
        },
        publications: {
          type: publicationsConnection,
          description: 'All Publications',
          args: {
            ...connectionArgs
          },
          resolve: async (_obj, _args,{dataSources}) => {
            const args = {filters : {bibliographicResourceType : toGlobalId('ApolloPublication','7c688f91-55e0-4a65-aec4-2185b30ef494')}}
            const publications = await dataSources.conceptAPI.getConcepts(args);
            const totalCount = publications.length
            return {
              ...connectionFromArray([...publications],args),
              ...{totalCount : totalCount}
            }
          },
        },
        concept: {
          type: IConceptInterface,
          description: 'Get a concept with a GlobalID',
          args: {
            id: {type:GraphQLNonNull(GraphQLID)}
          },
          resolve: async (_obj, args,{dataSources}) => {
            const {id} = fromGlobalId(args.id)
            const concept = await dataSources.conceptAPI.getConceptById(id);
            return concept
          },
        },
        hrlpDocuments: {
          type: hrlpDocumentConnection,
          description: 'All HRLP Documents',
          args: {
            ...connectionArgs,
            // orderBy: {type: DocumentOrderByType},
            // filters: { type: DocumentFilterType }
          },
          resolve: async (_obj, args,{dataSources}) => {
            const publicationId =  toGlobalId('HRLPDocument','hrlp-lippincott-procedures') 
            const newArgs =  _.merge(args,{filters : {inPublication:publicationId}})
            const documents = await dataSources.documentAPI.getDocuments(newArgs);
            const totalCount = documents.length
            return {
              ...connectionFromArray([...documents],args),
              ...{totalCount : totalCount}
            }  
          },
        },
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