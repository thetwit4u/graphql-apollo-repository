const { RESTDataSource } = require("apollo-datasource-rest");
const { CheckResultAndHandleErrors } = require("graphql-tools");
const _ = require('lodash')
const {getPagingUrl, getFilterUrl, getPagingInfo} = require('./utils')
const {JSON_DB_URL} = process.env
const {fromGlobalId} = require('graphql-relay')



class DocumentAPI extends RESTDataSource{
    constructor(){
        super();
        this.baseURL = `${JSON_DB_URL}/`;
        this.totalCount = 0;
    }

    didReceiveResponse(response, _request) { 
       this.totalCount = response.headers.get('X-Total-Count')
       return super.didReceiveResponse(response, _request);
    }

    async getExpressionsBytype(expressionType,args){
        const pagingParams = getPagingUrl(args)
        const filterParams = getFilterUrl(args)
        let expressionTypeFilter
        if (expressionType) {
            expressionTypeFilter = 'inPublication=' + expressionType
        }
        const queryParams = [expressionTypeFilter,pagingParams,filterParams].join('&')
        const data = await this.get(`/expressions?${queryParams}`);
        return data;
    }
    async getDocumentsByType(documentType,args){
        const pagingParams = getPagingUrl(args)
        const filterParams = getFilterUrl(args)
        let documentTypeFilter
        if (documentType) {
            documentTypeFilter = 'inPublication=' + documentType
        }
        const queryParams = [documentTypeFilter,pagingParams,filterParams].join('&')
        const data = await this.get(`/apollodocuments?${queryParams}`);
        return data;
    }
    async getDocuments(args){
        const pagingParams = getPagingUrl(args)
        const filterParams = getFilterUrl(args)
        const queryParams = [pagingParams,filterParams].join('&')
        const data = await this.get(`/apollodocuments?${queryParams}`);
        return data;
    }
    async getDocumentById(id){
        const data = await this.get(`/apollodocuments/${id}`);
        return data;
    }
    async getWorkById(id){
        const data = await this.get(`/work/${id}`);
        return data;
    }
    async getContentSetById(id){
        const data = await this.get(`/contentset/${id}`);
        return data;
    }
    async getBibliographicReferenceById(id){
        const data = await this.get(`/bibliographicreferences/${id}`);
        return data;
    }

    async getContentByIds(ids,args){
        let idsParams = 'id='+ _.join(ids,'&id=')
        const data = await this.get(`/content/?${idsParams}`);
        return data;
    }
    async getContentById(id,args){
        const data = await this.get(`/content/${id}`);
        return data;
    }
    async getProvenanceByIds(ids,args){
        let idsParams = 'id='+ _.join(ids,'&id=')
        const filterParams = getFilterUrl(args)
        const queryParams = [idsParams,filterParams].join('&')
        const data = await this.get(`/provenances/?${queryParams}`);
        return data;
    }

    async searchDocuments(args,dataSources){
        const pagingParams = getPagingUrl(args)
        const filterParams = getFilterUrl(args,dataSources)
        let leafIdsFilter
        if (args?.filters?.aboutIds?.length > 0) {

            const ids = args?.filters?.aboutIds.map((gid) => {
               const {id} = fromGlobalId(gid)
               return id
            })
            const leafIds = await dataSources.conceptAPI.getNarrowerConceptsByIds(ids) 
            const idsToFilter = (leafIds && Array.isArray(leafIds)) ? leafIds: [concept];
            leafIdsFilter = idsToFilter.map((leafId) => {return `about_like=${leafId}`}).join('&')
        }
        const queryParams = [pagingParams,filterParams,leafIdsFilter].join('&')
        const data = await this.get(`/apollodocuments/?${queryParams}`);
        return data;
    }
    async addClassification({id, conceptIds}) {
        console.log(conceptIds)
        const {id:transId} = fromGlobalId(id)
        const transConceptIds = conceptIds.map((conceptId) => {
            const {id:transCid} = fromGlobalId(conceptId)
            return transCid
        })
        console.log(transId)
        console.log(transConceptIds)
        return {id:id}

    }
    

    




}

module.exports = DocumentAPI;