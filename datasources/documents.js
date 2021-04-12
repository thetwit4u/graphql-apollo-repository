const { RESTDataSource } = require("apollo-datasource-rest");
const { CheckResultAndHandleErrors } = require("graphql-tools");
const _ = require('lodash')
const {getPagingUrl, getFilterUrl, getPagingInfo} = require('./utils')
const {JSON_DB_URL} = process.env




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

    async getProvenanceByIds(ids,args){
        let idsParams = 'id='+ _.join(ids,'&id=')
        const filterParams = getFilterUrl(args)
        const queryParams = [idsParams,filterParams].join('&')
        const data = await this.get(`/provenances/?${queryParams}`);
        return data;
    }

}

module.exports = DocumentAPI;