const { RESTDataSource } = require('apollo-datasource-rest')
const basicAuth = require ('basic-authorization-header')
const { getSortingSparql, getFilterSparql} = require('./utils')
const _ = require('lodash');
const {fromGlobalId} = require('graphql-relay')
// const {JSON_DB_URL} = process.env
const {AG_DB_URL,AG_DB_REPO,AG_DB_USER,AG_DB_PWD } = process.env

class ConceptSchemeAPI extends RESTDataSource{
    constructor(){
        super(); 
        this.baseURL = `${AG_DB_URL}${AG_DB_REPO}`;
        // this.headers = {
        //     'Accept':'application/sparql-results+json',
        //     'Authorization' :basicAuth(AG_DB_USER,AG_DB_PWD),
        //     'Content-Type':'application/x-www-form-urlencoded'
        // }
    }

    parseBody(response) {
        if (response.headers.get('Content-Type').includes('application/sparql-results+json')) {
          return response.json();
        } else {
          return response.text();
        }
    }

    didReceiveResponse(response, _request) { 
        return super.didReceiveResponse(response, _request);
    }

    willSendRequest(request) { 
        request.headers.set('Accept','application/sparql-results+json')
        request.headers.set('Authorization',basicAuth(AG_DB_USER,AG_DB_PWD))
        request.headers.set('Content-Type','application/x-www-form-urlencoded')
     
    }



    async getConceptSchemeById(id) {

        const idFilter = ` values ?_id { <${id}> } .`

        const SPARQL = `
        select ?_id ?title_en ?title_nl ?title_fr ?definition_en ?definition_nl ?definition_fr ?created ?creator ?modified  WHERE  {
            {
            ?_id rdf:type skos:ConceptScheme .  
            ${idFilter}
            optional {  ?_id dcterms:created ?created }
            optional { ?_id dcterms:creator ?creator } .
            optional { ?_id dcterms:modified ?modified } .
            optional {?_id skos:hasTopConcept ?c } .
            optional {?_id dcterms:title ?title_en . filter langMatches(lang(?title_en), "en")  } .
            optional { ?_id dcterms:title ?title_nl . filter langMatches(lang(?title_nl), "nl") }
            optional {?_id dcterms:title ?title_fr . filter langMatches(lang(?title_fr), "fr") }
            optional {?_id skos:definition ?definition_en  . filter langMatches(lang(?definition_en), "en")  } .
            optional { ?_id skos:definition ?definition_nl . filter langMatches(lang(?definition_nl), "nl") }
            optional {?_id skos:definition ?definition_fr . filter langMatches(lang(?definition_fr), "fr") }
            }
        }
        group by ?_id ?title_en ?title_nl ?title_fr ?definition_en ?definition_nl ?definition_fr ?created ?creator ?modified
        `
        
        const data = await this.get(`/?query=${encodeURI(SPARQL)}`);
        
        const reMap = data.results?.bindings.map((res) => {
            let newRecord = {}
            Object.keys(res).map(function(key) {
                newRecord[key] = res[key].value;
            });
            return newRecord
        })
        return reMap[0] || {};
    }


    async getConceptSchemes(args){
        const filterParams = getFilterSparql(args)
        const sortingSparql = getSortingSparql(args)
        const SPARQL = `
        select ?_id ?title_en ?title_nl ?title_fr ?definition_en ?definition_nl ?definition_fr ?created ?creator ?modified  WHERE  {
            {
            ?_id rdf:type skos:ConceptScheme .  
            ${filterParams}
            optional {  ?_id dcterms:created ?created }
            optional { ?_id dcterms:creator ?creator } .
            optional { ?_id dcterms:modified ?modified } .
            optional {?_id skos:hasTopConcept ?c } .
            optional {?_id dcterms:title ?title_en . filter langMatches(lang(?title_en), "en")  } .
            optional { ?_id dcterms:title ?title_nl . filter langMatches(lang(?title_nl), "nl") }
            optional {?_id dcterms:title ?title_fr . filter langMatches(lang(?title_fr), "fr") }
            optional {?_id skos:definition ?definition_en  . filter langMatches(lang(?definition_en), "en")  } .
            optional { ?_id skos:definition ?definition_nl . filter langMatches(lang(?definition_nl), "nl") }
            optional {?_id skos:definition ?definition_fr . filter langMatches(lang(?definition_fr), "fr") }
            }
        }
        group by ?_id ?title_en ?title_nl ?title_fr ?definition_en ?definition_nl ?definition_fr ?created ?creator ?modified
        ${sortingSparql}
        `
    
        // const pagingParams = getPagingUrl(args)
        const data = await this.get(`/?query=${encodeURI(SPARQL)}`);
        const reMap = data.results?.bindings.map((res) => {
            let newRecord = {}
            Object.keys(res).map(function(key) {
                newRecord[key] = res[key].value;
            });
            return newRecord
        })

        return reMap;
    }
}

module.exports = ConceptSchemeAPI;