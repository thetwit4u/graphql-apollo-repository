
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
  const nbTextParts = Array.from(Array(faker.datatype.number({
    'min': 1,
    'max': 4
})).keys())
  
  const text = nbTextParts.map(() => {
    const title = `<h2>${faker.lorem.sentence()}</h2>`
    const nbTextParafs =  Array.from(Array(faker.datatype.number({
      'min': 2,
      'max': 5
  })).keys())
    const textParts = nbTextParafs.map(() => {return `<p>${faker.lorem.paragraph(faker.datatype.number({
      'min': 3,
      'max': 12
  }))}</p>`})

    return `${title}${textParts.join('')}`
 })
 return text.join('')
}

/**
 * Interface Types
 */


const IApolloDocumentInterface = new GraphQLInterfaceType({
  description: 'Apollo Document Interface should be supported by each document type within the CMS *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content)]*',
  name: 'IApolloDocument',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    identifier: {type: GraphQLString, description:'Unique identifier *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> dcterms:identifier]*'},
    title: {
      type: GraphQLString,
      description: 'Main Title within Apollo CMS *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> dcterms:title]*',
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
    },
    inPublication: {type: ApolloPublicationType, description:'Apollo Publication of the document *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> bibliographicResourceType]*'},
    about: {type: conceptsConnection, description:'General classification of the document *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> pcicore:isAbout]*'},
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
    const { type, id } = fromGlobalId(globalId);
  
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
    if (obj._type === 'http://www.w3.org/2004/02/skos/core#ConceptScheme') {
      return ConceptSchemeType;
    }
    if (obj._type === 'http://www.w3.org/2004/02/skos/core#Concept') {
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
    id: globalIdField('ConceptScheme',(obj) => obj._id),
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    created: {type: GraphQLDateTime},
    creator: { type: GraphQLString },
    modified: {type: GraphQLDateTime },
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
    conceptSchemeId : { type: GraphQLID},
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
 * MACK provenance
 *
 */

const MACKProvenanceType = new GraphQLObjectType({
  name: 'MACKProvenance',
  description: `Management data of a resource, i.e. metadata about each change of a resource in the CMS *[[MACK Provenance](https://confluence.wolterskluwer.io/display/AP/MACK+Provenance)]*`,
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField('MACKProvenance'),
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    created: {
      type: GraphQLDateTime,
      description: `Date of first admission of a resource in the Apollo CMS. *[[MACK Provenance](https://confluence.wolterskluwer.io/display/AP/MACK+Provenance)  -> dcterms:modified]*`,
      resolve: () => faker.date.recent(4)
    },
    contributor: {
      type: GraphQLString,
      description: `Agent technically responsible for creation or change of resource in the Apollo CMS. *[[MACK Provenance](https://confluence.wolterskluwer.io/display/AP/MACK+Provenance) -> dcterms:contributor]*`,
      resolve: () => faker.name.lastName(),
    },
    modified: {
      type: GraphQLDateTime,
      description: `Date of change of a resource in the Apollo CMS *[[MACK Provenance](https://confluence.wolterskluwer.io/display/AP/MACK+Provenance) -> dcterms:created]*`,
      resolve: () => faker.date.recent(1)
    },
    type: {
        type: ConceptType,
        description: 'Type of change of the resource in the Apollo CMS, indicating the reason why it has been changed *[[MACK Provenance](https://confluence.wolterskluwer.io/display/AP/MACK+Provenance) -> dcterms:type]*',
        resolve: async ({type}, args,{dataSources}) => {
          const concept = await dataSources.conceptAPI.getConceptById(type);
          return concept
        },
    },
  }),
});

/**
 *  MACK BibliographicReference
 *
 */

const MACKBibliographicReferenceType = new GraphQLObjectType({
  name: 'MACKBibliographicReference',
  description: `Container that groups together all information needed to create bibliographic references to primary content and editorial content such as books, magazines, commentaries on law and jurisprudence.  *[[MACK Bibliographic Reference](https://confluence.wolterskluwer.io/display/AP/MACK+Bibliographic+Reference)]*`,
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField('MACKBibliographicReference'),
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    identifier: {type: GraphQLString, description:'The unique id of the reference *[dcterms:identifier]*'},
    prefLabel: {
      type: GraphQLString,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args) => {
        let langText = parent[`prefLabel_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
    altLabels: {
      type: new GraphQLList(GraphQLString),
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args) => {
        let langText = parent[`altLabels_${args?.language?.toLowerCase()}`]
        return langText
      },
    },
  })
 })


/**
 * Publication Type
 */


 const ApolloPublicationType = new GraphQLObjectType({
  name: 'ApolloPublication',
  description: `Publication is the abstract notion of a 'bundle' of content, that a publisher recognizes as one product. *[[MACK Publication](https://confluence.wolterskluwer.io/display/AP/MACK+Publication)]* `,
  interfaces: [nodeInterface, IConceptInterface],
  fields: () => ({
    id: globalIdField('ApolloPublication'),
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    identifier: {type: GraphQLString, description:'The unique id of the publication as used in the publication controlled vocabulary.*[[MACK Publication](https://confluence.wolterskluwer.io/display/AP/MACK+Publication) -> dcterms:identifier]*'},
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
      description: `Title of the publication *[[MACK Provenance](https://confluence.wolterskluwer.io/display/AP/MACK+Provenance) -> dcterms:title ]*`,
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
  description: `HRLPDocument based on ApolloDocument Interface *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content)]*`,
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
      `Unique collection for this type of documents *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> pcicore:isInPublication]*`,
      resolve: async ({inPublication}, args,{dataSources}) => {
        const pubData = await dataSources.conceptAPI.getConceptById(inPublication);
        return pubData
      },
    },
    about: {
      type: conceptsConnection,
      description: `HRLP Classification *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> pcicore:isAbout]*`,
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
  description : `WKBE Specific Implementation of News Document *[[See Mapping Apollo - News](https://confluence.wolterskluwer.io/display/AP/3.+Mapping+Brons+to+Apollo+-+News)]*`,
  interfaces: [nodeInterface, IApolloDocumentInterface],
  fields: () => ({
    id: globalIdField('WKBENews'),
    _id: {type: GraphQLString, description:`
    Unique URI of the document 
    *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Work]*`},
    identifier: { type: GraphQLString,description:`
    Unique identifier of the document
    *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Work -> dcterms:identifier]*` },
    language: {
      type: ConceptType,
      description: 
      `Language of the document
      *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) -> dcterms:language]*`,
      resolve: async ({language}, args,{dataSources}) => {
        const languageData = await dataSources.conceptAPI.getConceptById(language);
        return languageData
      },
    },
    languageVariant: {
      type: WKBENewsType,
      description: 
      `Link to other language
      *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Work -> pcicore:hasLanguageVariant]*`,
      resolve: async ({languageVariant}, args,{dataSources}) => {
        const languageVariantData = await dataSources.documentAPI.getDocumentById(languageVariant);
        return languageVariantData
      },
    },
    
    created: {
      type: GraphQLDateTime,
      resolve: () => faker.date.recent(4)
    },
    creator: {
      type: GraphQLString,
      description:`Comma-seperated list of authors *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> dcterms:creator]*`,
      resolve: () => `${faker.name.lastName()} ${faker.name.lastName()}`,
    },
    bibliographicResourceType: {
      type: ApolloPublicationType,
      description: 
      `Type of the document *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) -> pcicore:hasBibliographicResourceType]*`,
      resolve: async ({bibliographicResourceType}, args,{dataSources}) => {
        const bibData = await dataSources.conceptAPI.getConceptById(bibliographicResourceType);
        return bibData
      },
    },
    modified: {
      type: GraphQLDateTime,
      resolve: () => faker.date.recent(1)
    },

    title: {
      type: GraphQLString,
      description: `Title of the document *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> dcterms:title]*`,
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
      *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> pcicore:isInPublication]*`,
      resolve: async ({inPublication}, args,{dataSources}) => {
        const pubData = await dataSources.conceptAPI.getConceptById(inPublication);
        return pubData
      },
    },
    about: {
      type: conceptsConnection,
      description: `Subjectregister concepts inherited the first time from the source law.  Can be manually updated afterwards by the author. *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> pcicore:isAbout]*`,
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
    practiceArea :{
      type: conceptsConnection,
      description: `News domains *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Content Expression -> pcilr:hasPracticeArea]*`,
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({practiceArea}, args,{dataSources}) => {
        const practiceAreaData = await dataSources.conceptAPI.getConceptByIds(practiceArea,args);
        const totalCount = practiceAreaData.length
        return {
          ...connectionFromArray([...practiceAreaData],args),
          ...{totalCount : totalCount}
        }
      },     
    },
    primarySource: {
      type: IApolloDocumentInterface,
      description: `Primary Source of News *[MACK Based on relation](https://confluence.wolterskluwer.io/display/AP/MACK+Based+on+relation) -> "Dependency Relationship Type"]*`,
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({primarySource}, args,{dataSources}) => {
        const primarySourceData = await dataSources.documentAPI.getDocumentById(primarySource,args);
        return primarySourceData
      },         
    },
    provenances: {
      type: mackProvenanceConnection,
      description: `List of creation and modification events based on *[MACK Provenance](https://confluence.wolterskluwer.io/display/AP/MACK+Provenance)`,
      args: {
        ...connectionArgs,
      },
      resolve: async ({provenances}, args,{dataSources}) => {
        const provenanceData = await dataSources.documentAPI.getProvenanceByIds(provenances,args);
        const totalCount = provenanceData.length
        return {
          ...connectionFromArray([...provenanceData],args),
          ...{totalCount : totalCount}
        }
      }, 
    },
    content: {
      type: ContentDataType,
      description: 
      `The manifestation of the document *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Manifestion -> frbr:embodiment]*`,
      resolve: async ({content}, args,{dataSources}) => {
        const contentData = await dataSources.documentAPI.getContentById(content);
        return contentData
      },
    },

  }),
});







const WKBELegislationType = new GraphQLObjectType({
  name: 'WKBELegislation',
  description : `WKBE Specific Implementation of Legislation Document *[[See Mapping Apollo - Legislation](https://confluence.wolterskluwer.io/display/AP/2.+Mapping+Brons+to+Apollo+-+Legislation)]*`,
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
    issued: {
      type: GraphQLDate,
      description: `The date when then law was first promulgated by the legislative body (this is usually several days before the publication). *[[MACK Content Set](https://confluence.wolterskluwer.io/display/AP/MACK+Content+Set)  -> dcterms:issued]*`
    },
    publicationDate: {
      type: GraphQLDate,
      description: `The date when the law first appeared in the official publication of the government (usually 'Belgisch Staatsblad').  *[[MACK Content Set](https://confluence.wolterskluwer.io/display/AP/MACK+Content+Set)  -> pcicore:hasPublicationDate]*`
    },
    identifier: { type: GraphQLString },
    alternativeId: { 
      type: GraphQLString,
      description: `Brons Identifier *[[MACK Content Set](https://confluence.wolterskluwer.io/display/AP/MACK+Content+Set) -> [MACK Alternative Identifier](https://confluence.wolterskluwer.io/display/AP/MACK+Alternative+Identifier)]*`
    },
    title: {
      type: GraphQLString,
      description: ` Title of the law in multiple languages *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> dcterms:title]*`,
      args: { language: { type: LANGUAGE, defaultValue: DEFAULT_LANGUAGE } },
      resolve: (parent, args,{dataSources}) => {
        let langText = parent[`title_${args?.language?.toLowerCase()}`]
        return langText
      },
    },   
    shortTitles: {
      type: MACKBibliographicReferenceType,
      description: 
      `skos:prefLabel -> brons:title,  skos:altLabels -> brons:short-title type=altaard + date of legislation
      *[MACK Content Set](https://confluence.wolterskluwer.io/display/AP/MACK+Content+Set) -> [MACK BibliographicReference](https://confluence.wolterskluwer.io/display/AP/MACK+Bibliographic+Reference) *`,
      resolve: async ({shortTitles}, args,{dataSources}) => {
        const bibRef = await dataSources.documentAPI.getBibliographicReferenceById(shortTitles);
        return bibRef
      },
    },
    officialTitle: {
      type: MACKBibliographicReferenceType,
      description: 
      `skos:prefLabel -> brons:title
      *[MACK Content Set](https://confluence.wolterskluwer.io/display/AP/MACK+Content+Set) -> [MACK BibliographicReference](https://confluence.wolterskluwer.io/display/AP/MACK+Bibliographic+Reference) *`,
      resolve: async ({officialTitle}, args,{dataSources}) => {
        const bibRef = await dataSources.documentAPI.getBibliographicReferenceById(officialTitle);
        return bibRef
      },
    },
    printTitle: {
      type: MACKBibliographicReferenceType,
      description: 
      `skos:prefLabel ->	brons:short-title type=nietgang
      *[MACK Content Set](https://confluence.wolterskluwer.io/display/AP/MACK+Content+Set) -> [MACK BibliographicReference](https://confluence.wolterskluwer.io/display/AP/MACK+Bibliographic+Reference) *`,
      resolve: async ({printTitle}, args,{dataSources}) => {
        const bibRef = await dataSources.documentAPI.getBibliographicReferenceById(printTitle);
        return bibRef
      },
    },
    bibliographicResourceType: {
      type: ConceptType,
      description: `Legislation type *[[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Work -> pcicore:hasBibliographicResourceType]*`,
      resolve: async ({bibliographicResourceType}, args,{dataSources}) => {
        const bibresId =  bibliographicResourceType.split('/').pop()
        const concept = await dataSources.conceptAPI.getConceptById(bibresId);
        return concept
      },
    },
    source: {
      type: ConceptType,
      description: `'WKBE Source' where the legislation was published *[[MACK Content Set](https://confluence.wolterskluwer.io/display/AP/MACK+Content+Set) -> pcicore:isInPublication]*`,
      resolve: async ({source}, args,{dataSources}) => {
        const concept = await dataSources.conceptAPI.getConceptById(source);
        return concept
      },
  },
    inPublication: {
      type: ApolloPublicationType,
      description: 
      `Publication : unique collection for this type of documents 
      *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> pcicore:isInPublication]*`,
      resolve: async ({inPublication}, args,{dataSources}) => {
        const pubData = await dataSources.conceptAPI.getConceptById(inPublication);
        return pubData
      },
    },
    about: {
      type: conceptsConnection,
      description: `Subjectregister concepts classification managed in Brons and cannot be modified in Apollo.
      *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> pcicore:isAbout]*`,
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
    territorialApplication: {
      type: conceptsConnection,
      description: ` WKBE Territorial application.
      *[MACK Content](https://confluence.wolterskluwer.io/display/AP/MACK+Content) Expression -> pcicore:coversLocation]*`,
      args: {
        ...connectionArgs,
        orderBy: {type: ConceptOrderByType},
        filters: { type: ConceptFilterType }
      },
      resolve: async ({territorialApplication}, args,{dataSources}) => {
        const concepts = await dataSources.conceptAPI.getConceptByIds(territorialApplication,args);
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
  description : `Content can be retrieved directly from Alfresco`,
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField('ContentData'),
    _id: {type: GraphQLString, description:'Unique URI within Apollo'},
    identifier: { type: GraphQLString },
    type: {
      type: ConceptType,
      description: `MIMEType of the content available in Controlled Vocabulary`,
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

const { connectionType: mackProvenanceConnection } = connectionDefinitions({
  nodeType: MACKProvenanceType,
  connectionFields: () => ({...totalCountConfig})
});


/***
 * Mutation Config
 */

const AddConceptToHRLPDocumentMutation = mutationWithClientMutationId({
  name: 'addConceptToHRLPDocument',
  description : `Add one or more concept (only leaf concepts) to the HRLPDocument.  Concepts that are already present will be ignored`,
  inputFields: {
    id : { type: new GraphQLNonNull(GraphQLID),description:'HRLPDocument Id' },
    conceptIds: { type: new GraphQLNonNull( new GraphQLList(GraphQLID)),description:'Concept Ids to be used for classification' }
  },
  outputFields: {
      document: {
        type: HRLPDocumentType,
        resolve: (payload,args,{dataSources}) => {
          const {id:docId} = fromGlobalId(payload.id)
          return dataSources.documentAPI.getDocumentById(docId)
        }
      },
  },
  mutateAndGetPayload: ({
     id, conceptIds
  },{dataSources}) => dataSources.documentAPI.addClassification({id, conceptIds}),
});


const RemoveConcepFromHRLPDocumentMutation = mutationWithClientMutationId({
    name: 'removeConceptToHRLPDocument',
    description : `Remove one or more concept from the HRLPDocument. A minimum of 1 concept is required`,
    inputFields: {
      id : { type: new GraphQLNonNull(GraphQLID),description:'HRLPDocument Id' },
      conceptIds: { type: new GraphQLNonNull( new GraphQLList(GraphQLID)),description:'Concept Ids to be used for classification' }
    },
    outputFields: {
      document: {
        type: HRLPDocumentType,
        resolve: (payload,args,{dataSources}) => {
          const {id:docId} = fromGlobalId(payload.id)
          return dataSources.documentAPI.getDocumentById(docId)
        }
      },
  },
  mutateAndGetPayload: ({
     id, conceptIds
  },{dataSources}) => dataSources.documentAPI.removeClassification({id, conceptIds}),
});


module.exports = {
  conceptSchemesConnection, conceptsConnection, publicationsConnection,  wkbeNewsConnection, wkbeLegislationConnection, apolloDocumentConnection,hrlpDocumentConnection,
  ConceptSchemeType, ConceptType,
  WKBENewsType,WKBELegislationType,HRLPDocumentType,ApolloPublicationType,
  IApolloDocumentInterface,IConceptInterface,nodeInterface, nodeField, nodesField ,
  ConceptSchemeFilterType, ConceptFilterType, ApolloDocumentFilterType,SearchConceptFilterType,
  ConceptOrderByType, ConceptSchemeOrderByType, ApolloDocumentOrderByType,SearchConceptOrderByType,
  AddConceptToHRLPDocumentMutation,RemoveConcepFromHRLPDocumentMutation
  
}
