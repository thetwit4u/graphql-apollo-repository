const {fromGlobalId} = require('graphql-relay')

const TYPES_MAP = {
    'CONTENT_CREATION':'28e5c7d3-fdf7-4c17-acdd-e396a8f0046c',
    'CONTENT_CHANGE' : '22877642-f094-47c1-800a-37f4a41e22cf'
}

const getFilterOnField = (fieldId,{contains,startsWith,endsWith, exactMatch}) => {
    const searchFilter = []
    if (contains) {searchFilter.push(`${fieldId}_like=${contains}`)}
    if (startsWith) {searchFilter.push(`${fieldId}_like=^${startsWith}`)}
    if (endsWith) {searchFilter.push(`${fieldId}_like=${endsWith}$`)}
    if (exactMatch) {searchFilter.push(`${fieldId}=${exactMatch}`)}
    return searchFilter.join('&')
}

module.exports = {

    getPagingInfo : (args,count) => {
        if (args === undefined) {return}
        const {offset = 1, limit = 1000} = args
        return {offset:offset,limit:limit,count:count}
    },
    getPagingUrl : (args) => {
        if (args === undefined) {return}
        const {offset = 0, limit = 1000} = args
        return `_limit=${limit}&_start=${offset}`
    },
    getFilterUrl(args) {
        if (args?.filters === undefined) return
        const {filters} = args
        const filterParams = Object.keys(filters).map((key) => {
            switch (key) {
                case 'ids': {   
                    const conceptFilterArr = filters['ids'].map((globalID) => {
                        const {id } = fromGlobalId(globalID);
                        return `id=${id}`
                    })
                    return conceptFilterArr.join('&')
                }
                case 'conceptSchemeId': {
                    const {id } = fromGlobalId(filters['conceptSchemeId']);
                    return `inscheme_like=/${id}$`
                }
                case 'bibliographicResourceType': {
                        const {id } = fromGlobalId(filters['bibliographicResourceType']);
                        return `bibliographicResourceType_like=/${id}$`
                }
                case 'inPublication': {
                    const {id } = fromGlobalId(filters['inPublication']);
                    return `inPublication=${id}`
                }
                case 'prefLabelValue': {
                    const lang = filters['language'].toLowerCase()
                    const fieldId = `prefLabel_${lang}`
                    const searchFilter = []
                    return getFilterOnField(fieldId,filters['prefLabelValue'])
                }
                case 'altLabelValue': {
                    const lang = filters['language'].toLowerCase()
                    const fieldId = `altLabel_${lang}`
                    const searchFilter = []
                    return getFilterOnField(fieldId,filters['altLabelValue'])
                }
                default:
            }
        })
        return filterParams.join('&')
    },
    getSortingUrl : (args) => {
        if (args?.orderBy === undefined) return
        const {orderBy} = args
        const orderByParams = Object.keys(orderBy).map((key) => {
            return `_sort=${key}&_order=${orderBy[key].toLowerCase()}`
           
        })
        return orderByParams.join('&')
    }

}