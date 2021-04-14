
const _ = require('lodash')
const {globalIdField, fromGlobalId,  toGlobalId,connectionFromArray, connectionArgs,mutationWithClientMutationId ,connectionDefinitions, nodeDefinitions, cursorToOffset} = require('graphql-relay')
const {GraphQLSchema, GraphQLObjectType, GraphQLID, GraphQLString, GraphQLNonNull, GraphQLInt, GraphQLInputObjectType,GraphQLList, GraphQLBoolean, GraphQLInterfaceType} = require('graphql')
const { GraphQLDateTime,GraphQLDate } = require('graphql-iso-date')
const { GraphQLJSONObject } = require('graphql-type-json')


const faker = require('faker')


const DEFAULT_LANGUAGE = 'EN'
const {LANGUAGE, SORT, CONCEPT_TYPE} = require('./enumTypes')



/**
 * Helper functions
 */
 const generateRandomText = () => {
  const nbTextParts = Array.from(Array(faker.datatype.number(4)).keys())
  
  const text = nbTextParts.map(() => {
    const title = `<h2>${faker.lorem.sentence()}</h2>`
    const nbTextParafs =  Array.from(Array(faker.datatype.number(5)).keys())
    const textParts = nbTextParafs.map(() => {return `<p>${faker.lorem.paragraph(faker.datatype.number(12))}}</p>`})

    return `${title}${textParts.join('')}`
 })
 return text.join('')
}

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
    inPublication: {type: ApolloPublicationType, description:'derived from bibliographicResourceType MACK Content Expression'},
    about: {type: conceptsConnection, description:'[MACK Content Expression -> pcicore:isAbout]'},
  }),
  resolveType: (obj) => {
      if(obj.inPublication === 'wkbe-news'){
        return WKBENewsType
      }
      if(obj.inPublication === 'wkbe-legislation'){
        return WKBELegislationType
      }

      if(obj.inPublication === 'hrlp-lippincott-procedures'){
        return HRLPDocumentType
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
    conceptScheme: { type: ConceptSchemeType},
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
    if (type === 'WKBENews') return dataSources.documentAPI.getDocumentById(id);
    if (type === 'WKBELegislation') return dataSources.documentAPI.getDocumentById(id);
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
    if(obj.inPublication === 'wkbe-news'){
      return WKBENewsType
    }    
    if(obj.inPublication === 'wkbe-legislation'){
      return WKBELegislationType
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

const LabelSearchOptionType = new GraphQLInputObjectType({
  name: 'LabelSearchOption',
  fields: () => ({
    startsWith :  { 
      type:  GraphQLString
    },
    contains :  { 
      type:  GraphQLString
    },
    endsWith :  { 
      type:  GraphQLString
    },
    exactMatch :  { 
      type:  GraphQLString
    },
  })
});

const SearchConceptFilterType = new GraphQLInputObjectType({
  name: 'SearchConceptFilter',
  fields: () => ({
    prefLabelValue:  { 
      type: LabelSearchOptionType
    },
    altLabelValue : { 
      type: LabelSearchOptionType
    },
    conceptType : { type: CONCEPT_TYPE,defaultValue: 'ONLY_LEAF' , description: 'Only search for concepts that have no narrower (ONLY_LEAF), topconcepts (ONLY_TOP) or all concepts (ALL)'},
    language : { type: LANGUAGE,defaultValue: DEFAULT_LANGUAGE , description: 'Language to search in'},
  })
});


const SearchConceptOrderByType = new GraphQLInputObjectType({
  name: 'SearchConceptOrderBy',
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
      resolve: () => `${faker.name.lastName()} ${faker.name.lastName()}`,
    },
    contributor: {
      type: GraphQLString,
      resolve: () => `${faker.name.lastName()} ${faker.name.lastName()}`,
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
    type: {
      type: ConceptType,
      resolve: async ({type}, args,{dataSources}) => {
        const typeData = await dataSources.conceptAPI.getConceptById(type);
        return typeData
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


/**
 * Documents
 */


 
 const ApolloDocumentFilterType = new GraphQLInputObjectType({
  name: 'ApolloDocumentFilter',
  fields: () => ({
    ids:  { type: new GraphQLList(GraphQLID),description: `Filter on document ids (Global Identifier)`},
    aboutIds:  { type: new GraphQLList(GraphQLID),description: `Filter on Concept ids (Global Identifier)
    All documents classified with these concept (or narrower terms) are retrieved`}
  })
});

const ApolloDocumentOrderByType = new GraphQLInputObjectType({
  name: 'ApolloDocumentOrderBy',
  fields: () => ({
    title_nl: { type: SORT},
    title_en: { type: SORT },
    title_fr: { type: SORT }
  })
});



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
    creator: {
      type: GraphQLString,
      resolve: () => `${faker.name.lastName()} ${faker.name.lastName()}`,
    },
    modified: {
      type: GraphQLDateTime,
      resolve: () => faker.date.recent(1)
    },
    contributor: {
      type: GraphQLString,
      resolve: () => `${faker.name.lastName()} ${faker.name.lastName()}`,
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
    },
    about: {
      type: conceptsConnection,
      description: 'HRLP Classification',
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({about}, args,{dataSources}) => {
        const concepts = await dataSources.conceptAPI.getConceptByIds(about,args);
        const totalCount = concepts.length
        return {
          ...connectionFromArray([...concepts],args),
          ...{totalCount : totalCount}
        }
      },
    },
    content: {
      type: ContentDataType,
      description: 
      `Publication : unique collection for this type of documents 
      [MACK Content Expression -> pcicore:isInPublication]`,
      resolve: async ({content}, args,{dataSources}) => {
        const contentData = await dataSources.documentAPI.getContentById(content);
        return contentData
      },
    },

  }),
});


const WKBENewsType = new GraphQLObjectType({
  name: 'WKBENews',
  interfaces: [nodeInterface, IApolloDocumentInterface],
  fields: () => ({
    id: globalIdField('WKBENews'),
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
    },
    about: {
      type: conceptsConnection,
      description: `Subjectregister concepts inherited the first time from the source law.  Can be manually updated afterwards by the author.
      [MACK Content Expression -> pcicore:isAbout]`,
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({about}, args,{dataSources}) => {
        const concepts = await dataSources.conceptAPI.getConceptByIds(about,args);
        const totalCount = concepts.length
        return {
          ...connectionFromArray([...concepts],args),
          ...{totalCount : totalCount}
        }
      },
    },

  }),
});


const WKBELegislationType = new GraphQLObjectType({
  name: 'WKBELegislation',
  interfaces: [nodeInterface, IApolloDocumentInterface],
  fields: () => ({
    id: globalIdField('WKBELegislation'),
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
    },
    about: {
      type: conceptsConnection,
      description: `Subjectregister concepts classification managed in Brons and cannot be modified in Apollo.
      [MACK Content Expression -> pcicore:isAbout]`,
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({about}, args,{dataSources}) => {
        const concepts = await dataSources.conceptAPI.getConceptByIds(about,args);
        const totalCount = concepts.length
        return {
          ...connectionFromArray([...concepts],args),
          ...{totalCount : totalCount}
        }
      },
    },
  }),
});

const ContentDataType = new GraphQLObjectType({
  name: 'ContentData',
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField('ContentData'),
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    identifier: { type: GraphQLString },
    type: {
      type: ConceptType,
      resolve: async ({type}, args,{dataSources}) => {
        const typeData = await dataSources.conceptAPI.getConceptById(type);
        return typeData
      },
    },
    asString: {
      type: GraphQLString, 
      description:'Content as escaped string',
      resolve: (parent, args,{dataSources}) => {
        const text = generateRandomText()
        return text
      },
    },
    asBase64: {
      type: GraphQLString, 
      description:'Content as escaped string',
      resolve: (parent, args,{dataSources}) => {
        const text = generateRandomText()
        const buf = Buffer.from(text);
        return buf.toString('base64')
      },
    },
    asDataUrl: {type: GraphQLString, description:'Content as data url'},
    downloadUrl: {
      type: GraphQLString, 
      description:'Content as escaped string',
      resolve: (parent, args,{dataSources}) => {
        return `s3://apollobucket/id-${faker.datatype.uuid()}`
      },
    },
    size: {
      type: GraphQLInt, 
      description:'Content Size in bytes',
      resolve: (parent, args,{dataSources}) => {
        return faker.datatype.number({options:{min:4000,max:100000}})
      },
    },
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
    },
    about: {
      type: conceptsConnection,
      description: `Subjectregister concepts classification managed in Brons and cannot be modified in Apollo.
      [MACK Content Expression -> pcicore:isAbout]`,
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({about}, args,{dataSources}) => {
        const concepts = await dataSources.conceptAPI.getConceptByIds(about,args);
        const totalCount = concepts.length
        return {
          ...connectionFromArray([...concepts],args),
          ...{totalCount : totalCount}
        }
      },
    },
  }),
});

/**
 * Connection Types
 */
const totalCountConfig = 
  {
    totalCount: {
      type: GraphQLInt,
      resolve: (connection) => connection.totalCount,
      description: `A count of the total number of objects in this connection, ignoring pagination.
      This allows a client to fetch the first five objects by passing "5" as the
      argument to "first", then fetch the total count so it could display "5 of 83"
      for example.`
    }}

const { connectionType: conceptSchemesConnection } = connectionDefinitions({
  nodeType: ConceptSchemeType,
  connectionFields: () => ({...totalCountConfig})
});

const { connectionType: conceptsConnection } = connectionDefinitions({
  nodeType: IConceptInterface,
  connectionFields: () => ({...totalCountConfig})
});

const { connectionType: publicationsConnection } = connectionDefinitions({
  nodeType: ApolloPublicationType,
  connectionFields: () => ({...totalCountConfig})
});

const { connectionType: apolloDocumentConnection } = connectionDefinitions({
  nodeType: IApolloDocumentInterface,
  connectionFields: () => ({...totalCountConfig})
});

const { connectionType: hrlpDocumentConnection } = connectionDefinitions({
  nodeType: HRLPDocumentType,
  connectionFields: () => ({...totalCountConfig})
});
const { connectionType: wkbeLegislationConnection } = connectionDefinitions({
  nodeType: WKBELegislationType,
  connectionFields: () => ({...totalCountConfig})
});

const { connectionType: wkbeNewsConnection } = connectionDefinitions({
  nodeType: WKBENewsType,
  connectionFields: () => ({...totalCountConfig})
});



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


module.exports = {
  conceptSchemesConnection, conceptsConnection, publicationsConnection,  wkbeNewsConnection, wkbeLegislationConnection, apolloDocumentConnection,hrlpDocumentConnection,
  ConceptSchemeType, ConceptType,
  WKBENewsType,WKBELegislationType,HRLPDocumentType,ApolloPublicationType,
  IApolloDocumentInterface,IConceptInterface,nodeInterface, nodeField, nodesField ,
  ConceptSchemeFilterType, ConceptFilterType, ApolloDocumentFilterType,SearchConceptFilterType,
  ConceptOrderByType, ConceptSchemeOrderByType, ApolloDocumentOrderByType,SearchConceptOrderByType
}
