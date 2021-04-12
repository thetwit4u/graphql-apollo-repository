const { RESTDataSource } = require("apollo-datasource-rest")
const { CheckResultAndHandleErrors } = require("graphql-tools")
const _ = require('lodash')
const {getPagingUrl, getFilterUrl, getSortingUrl} = require('./utils')
const {JSON_DB_URL} = process.env


class ConceptAPI extends RESTDataSource{
    constructor(){
        super();
        this.baseURL = `${JSON_DB_URL}/concepts`;
        this.totalCount = 0;
    }

    didReceiveResponse(response, _request) { 
       this.totalCount = response.headers.get('X-Total-Count')
       return super.didReceiveResponse(response, _request);
    }

    async getConcepts(args){
        const pagingParams = getPagingUrl(args)
        const filterParams = getFilterUrl(args)
        const queryParams = [pagingParams,filterParams].join('&')
        const data = await this.get(`/?${queryParams}`);
        //const pagingInfo = getPagingInfo(args,this.totalCount);
        return data;
    }
    async getConceptsByBibliographicResourcetype(bibrestype){
        const data = await this.get(`/?bibliographicResourceType=${bibrestype}`);
        return data;
    }
    

    async getConceptById(id){
        const data = await this.get(`/${id}`);
        return data;
    }

    async getConceptByIds(ids,args){
        const pagingParams = getPagingUrl(args)
        const filterParams = getFilterUrl(args)
        const sortingParams = getSortingUrl(args)
        let idsParams
        if (!(args?.filters?.ids?.length > 0)) {
            idsParams = 'id='+ _.join(ids,'&id=')
        }
        const queryParams = [idsParams,pagingParams,filterParams,sortingParams].join('&')
        const data = await this.get(`/?${queryParams}`);
        return data;
    }
}

module.exports = ConceptAPI;