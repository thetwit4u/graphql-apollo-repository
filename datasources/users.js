const { RESTDataSource } = require("apollo-datasource-rest");
const { CheckResultAndHandleErrors } = require("graphql-tools");
const { fromGlobalId } = require('graphql-relay');
const _ = require('lodash')
const {getPagingUrl, getFilterUrl, getPagingInfo} = require('./utils')
const {JSON_DB_URL} = process.env




class UserAPI extends RESTDataSource{
    constructor(){
        super();
        this.baseURL = `${JSON_DB_URL}/`;
        this.totalCount = 0;
    }

    didReceiveResponse(response, _request) { 
       this.totalCount = response.headers.get('X-Total-Count')
       return super.didReceiveResponse(response, _request);
    }

    async getViewer(){
        const { id } = fromGlobalId(CURRENT_USER);
        const data = await this.get(`/users/${id}`);
        return data;
    }
    async getUser(id){
        const data = await this.get(`/users/${id}`);
        return data;
    }
    async getRace(id){
        const data = await this.get(`/races/${id}`);
        return data;
    }
    async getRaces(id){
        const data = await this.get(`/users/${id}/races`);
        return data;
    }
    async getUsers(){
        const data = await this.get(`/users`);
        return data;
    }
}

module.exports = UserAPI;


