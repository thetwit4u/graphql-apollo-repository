const {
    conceptSchemesConnection, conceptsConnection, publicationsConnection,  wkbeNewsConnection, wkbeLegislationConnection, apolloDocumentConnection,hrlpDocumentConnection,
    ConceptSchemeType, ConceptType,
    WKBENewsType,WKBELegislationType,HRLPDocumentType,ApolloPublicationType,
    IApolloDocumentInterface,IConceptInterface,nodeInterface, nodeField, nodesField ,
    ConceptSchemeFilterType, ConceptFilterType, ApolloDocumentFilterType,
    ConceptOrderByType, ConceptSchemeOrderByType, ApolloDocumentOrderByType
  } = require('./Types')
const _ = require('lodash')
const { fromGlobalId,  toGlobalId,connectionFromArray, connectionArgs} = require('graphql-relay')
const { GraphQLObjectType, GraphQLID, GraphQLNonNull,GraphQLString} = require('graphql')

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
        concept: {
            type: IConceptInterface,
            description: 'Get a concept with a GlobalID',
            args: {
              id: {type:GraphQLID},
              _id: {type:GraphQLString}
            },
            resolve: async (_obj, args,{dataSources}) => {
              let searchId;
              if (args._id) {
                searchId =  args._id.split('/').pop()
              } else {
                const {id} = fromGlobalId(args.id)
                searchId = id
              }
              const concept = await dataSources.conceptAPI.getConceptById(searchId);
              return concept
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
        apolloDocument: {
            type: IApolloDocumentInterface,
            description: 'Get an ApolloDocument',
            args: {
              id: {type:GraphQLID},
              _id: {type:GraphQLString}
            },
            resolve: async (_obj, args,{dataSources}) => {
              let searchId;
              if (args._id) {
                searchId =  args._id.split('/').pop()
              } else {
                const {id} = fromGlobalId(args.id)
                searchId = id
              }
              const doc = await dataSources.documentAPI.getDocumentById(searchId);
              return doc
            },
        },
        wkbeNewsDocuments: {
            type: wkbeNewsConnection,
            description: 'All WKBENews Documents',
            args: {
              ...connectionArgs,
              // orderBy: {type: DocumentOrderByType},
              // filters: { type: DocumentFilterType }
            },
            resolve: async (_obj, args,{dataSources}) => {
              const publicationId =  toGlobalId('WKBENews','wkbe-news') 
              const newArgs =  _.merge(args,{filters : {inPublication:publicationId}})
              const documents = await dataSources.documentAPI.getDocuments(newArgs);
              const totalCount = documents.length
              return {
                ...connectionFromArray([...documents],args),
                ...{totalCount : totalCount}
              }  
            },
          },
        searchDocuments: {
          type: apolloDocumentConnection,
          description: 'Search Documents in Apollo',
          args: {
            ...connectionArgs,
            orderBy: {type: ApolloDocumentOrderByType},
            filters: { type: ApolloDocumentFilterType }
          },
          resolve: async (_obj, args,{dataSources}) => {
            const documents = await dataSources.documentAPI.searchDocuments(args,dataSources);
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
  
module.exports = queryType