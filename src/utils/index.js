export const ROUTER_PROPERTY_NAME = "__vanilla_router__";
export const ROUTER_VIEW_PROPERTY_NAME = "__vanilla_router_view__";


export function tryCatch(callback){
    try{
        callback()
    }catch(error){
        console.error("[vanilla-router] ", error.message)
    }
}

export function convertScriptsToIife(scripts){
    tryCatch(() => {
        scripts.forEach((scriptTag) => {
            scriptTag.text = `(function vnlr(){${scriptTag.text}})()`
        })
    })
}

export function generateQueryString(query){
    let queryString = "?";

    Object.entries(query).forEach(([key,value])=>{
        queryString +=  `${key}=${value}&`
    });

    queryString = queryString.slice(0, -1)
    
    if(queryString.length == 1){
        queryString = ""
    }

    return queryString;
}

export function isNumeric(value) {
    return /^-?\d+$/.test(value);
}