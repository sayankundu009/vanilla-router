import { ROUTER_PROPERTY_NAME, isNumeric} from "../utils"

export default class HashNavigator{
    constructor(){
        window.addEventListener('hashchange', this.onHashChange.bind(this));
    }

    getRouter(){
       return window[ROUTER_PROPERTY_NAME];
    }

    currentHash(){
        return window.location.hash.substring(1);
    }

    currentPath(){
        return this.currentHash().split("?")[0]
    }

    currentQueryString(){
        return this.currentHash().split("?")[1]
    }

    fullPath(){
        return window.location.href
    }

    getRoute(){
        return new URL(this.fullPath())
    }

    getQueryParams(){
        const searchParams = new URLSearchParams(this.currentQueryString())

        const query = {};

        for(var value of searchParams.keys()) {
            query[value] = searchParams.get(value);
        }

        return query
    }

    getPathParams(){
        const activeRoute = this.getRouter().activeRoute
        const params = {}

        if(!activeRoute) return params;

        let pathRegex = new RegExp("^" + activeRoute.path.replace(/:[^\s/]+/g, '([\\w-]+)') + "$")
        const paramRegex = new RegExp(/:[^\s/]+/g)

        let routeMatch = this.currentPath().match(pathRegex);
        let paramKeys = activeRoute.path.match(paramRegex)
        let paramValues = routeMatch ? routeMatch.splice(1) : []

        if(paramKeys){
            paramKeys.forEach((key, index) => {
                let value = paramValues[index];
    
                value = isNumeric(value) ? Number(value) : String(value);
    
                params[key.replace(":", "")] = value
            })
        }

        return params
    }

    replace(pathString){
        location.hash = pathString;
    }

    get $route(){
        return {
            fullPath: this.fullPath(),
            path: this.currentPath(),
            query: this.getQueryParams(),
            params: this.getPathParams(),
        }
    }

    onRouteChange(callback) {
        this.routeChangeCallBack = callback;
    }

    onHashChange(){
        (typeof this.routeChangeCallBack === 'function') && this.routeChangeCallBack(this.$route);
    }

    triggerRouteChange(){
        this.onHashChange()
    }

    start(){
        if(!this.currentPath()){
            this.replace("/");
        }else{
            this.triggerRouteChange()
        }
    }
}