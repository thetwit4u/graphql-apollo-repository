const { RESTDataSource } = require("apollo-datasource-rest")
const {getPagingUrl,getFilterUrl, getSortingUrl} = require('./utils')
const _ = require('lodash');
const {JSON_DB_URL} = process.env



class ConceptSchemeAPI extends RESTDataSource{
    constructor(){
        super();
        this.baseURL = `${JSON_DB_URL}/conceptschemes`;
        this.totalCount = 0;
    }

    didReceiveResponse(response, _request) { 
        this.totalCount = response.headers.get('X-Total-Count')
        return super.didReceiveResponse(response, _request);
    }

    async getConceptSchemeById(id){
        const data = await this.get(`/${id}`);
        return data;
    }

    async getConceptSchemes(args){
        const pagingParams = getPagingUrl(args)
        const filterParams = getFilterUrl(args)
        const sortingParams = getSortingUrl(args)
        const queryParams = [pagingParams,filterParams,sortingParams].join('&')
        const data = await this.get(`/?${queryParams}`);
        return data;
    }
}

module.exports = ConceptSchemeAPI;