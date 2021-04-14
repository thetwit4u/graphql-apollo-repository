const { RESTDataSource } = require("apollo-datasource-rest")
const { CheckResultAndHandleErrors } = require("graphql-tools")
const { keyBy } = require("lodash")
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
        return data;
    }
    async getConceptsByBibliographicResourcetype(bibrestype){
        const data = await this.get(`/?bibliographicResourceType=${bibrestype}`);
        return data;
    }
    
    async getNarrowerConceptsByIds(ids){
        const idsFilter = [].concat(ids.map((id) => {return `id=${id}`}))
        const queryStr = `?${idsFilter.join('&')}&narrower_like=.&_limit=100`
        const data = await this.get(queryStr)
        const narrowers = _.flatten(data.map(({narrower}) => { return narrower}))

        let returns
        if ((narrowers === undefined) || (narrowers.length === 0)) {
            returns = ids     
        } else {
            const children = await this.getNarrowerConceptsByIds(narrowers)
            returns = children
        }
        return returns 
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
    async searchConcepts(args){
        const pagingParams = getPagingUrl(args)
        const filterParams = getFilterUrl(args)
        const queryParams = [pagingParams,filterParams].join('&')
        const data = await this.get(`/?${queryParams}`);
        // remove concepts based on type filter
        let filteredArray = data
        if (args.filters?.conceptType) {
            switch (args.filters?.conceptType) {
                case 'ONLY_LEAF' : {
                     _.remove(filteredArray, function(o) { 
                        return (((!(o.narrower === undefined)) && (o.narrower?.length > 0))); 
                     }); 
                     break;
                     
                }
                case 'ONLY_TOP' : {
                    _.remove(filteredArray, function(o) { 
                        return (((!(o.broader === undefined)) && (o.broader?.length > 0))); 
                     }); 
                     break;
                }
                default : {
                }
            }
        }
        return filteredArray;
    }

    
}

module.exports = ConceptAPI;