(function () {
    'use strict';

    const ROUTER_PROPERTY_NAME = "__vanilla_router__";
    const ROUTER_VIEW_PROPERTY_NAME = "__vanilla_router_view__";
    const PATH_PARAM_REGEX = new RegExp(/:[^\s/]+/g);

    function tryCatch(callback){
        try{
            callback();
        }catch(error){
            console.error("[vanilla-router] ", error.message);
        }
    }

    function convertScriptsToIife(scripts){
        tryCatch(() => {
            scripts.forEach((scriptTag) => {
                scriptTag.text = `(function vnlr(){${scriptTag.text}})()`;
            });
        });
    }

    function generateQueryString(query){
        let queryString = "?";

        Object.entries(query).forEach(([key,value])=>{
            queryString +=  `${key}=${value}&`;
        });

        queryString = queryString.slice(0, -1);
        
        if(queryString.length == 1){
            queryString = "";
        }

        return queryString;
    }

    function isNumeric(value) {
        return /^-?\d+$/.test(value);
    }

    function pathToRegex(path){
     return new RegExp("^" + path.replace(/:[^\s/]+/g, '((?:[^\/]+?))') + "$")
    }

    class RouterView extends HTMLElement{
        constructor() {
            super();

            this.attachShadow({ mode: 'open' });
        }

        connectedCallback() {
            this.checkIfAlreadyExists();
            this.shadowRoot.innerHTML = `<slot></slot>`;
            window[ROUTER_VIEW_PROPERTY_NAME] = this;
        }

        checkIfAlreadyExists(){
            tryCatch(() =>{
                if(window[ROUTER_VIEW_PROPERTY_NAME]) throw Error("Router View already exists")
            });
        }
    }

    window.customElements.define('router-view', RouterView);

    class RouterLink extends HTMLElement{
         constructor() {
            super();
            this.attachShadow({ mode: "open" });
            this._$a = null;
         }

         connectedCallback() {
            if(this.to){
                this.addEventListener("click", (event) => {
                    console.log("Go to: ",this.to);
                });
            }
         }

         connectedCallback() {
            this.path = this.getAttribute("to") || "";

            this.shadowRoot.innerHTML = `<a href="#${this.path}">${this.innerHTML}</a>`;

            this._$a = this.shadowRoot.querySelector("a");

            this.attachAttributes();

            this._$a.addEventListener("click", event => {
                event.preventDefault();
                this.redirect();
            });

            this.parentElement.insertBefore(this._$a, this);

            this.remove();
          }

          attachAttributes(){
            [...this.attributes].forEach(attr => {
                this._$a.setAttribute(attr.name, attr.value);
            });

            this._$a.removeAttribute("to");
          }

          get observedAttributes() { return ["class","style"]; }

          attributeChangedCallback(name, oldValue, newValue){
            this._$a.setAttribute(name, newValue);
          }

          get $router(){
              return window[ROUTER_PROPERTY_NAME];
          }
          
          redirect(){
            if(this.$router && ("redirect" in this.$router)){
                this.$router.redirect(this.path);
            }
          }
    }

    window.customElements.define('router-link', RouterLink);

    class HashNavigator{
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
            const searchParams = new URLSearchParams(this.currentQueryString());

            const query = {};

            for(var value of searchParams.keys()) {
                query[value] = searchParams.get(value);
            }

            return query
        }

        getPathParams(){
            const activeRoute = this.getRouter().activeRoute;
            const params = {};

            if(!activeRoute || activeRoute.fast_star) return params;

            const pathRegex = pathToRegex(activeRoute.path);

            const paramRegex = PATH_PARAM_REGEX;

            let routeMatch = this.currentPath().match(pathRegex);
            let paramKeys = activeRoute.path.match(paramRegex);
            let paramValues = routeMatch ? routeMatch.splice(1) : [];

            if(paramKeys){
                paramKeys.forEach((key, index) => {
                    let value = paramValues[index];
        
                    value = isNumeric(value) ? Number(value) : String(value);
        
                    params[key.replace(":", "")] = value;
                });
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
            this.onHashChange();
        }

        start(){
            if(!this.currentPath()){
                this.replace("/");
            }else {
                this.triggerRouteChange();
            }
        }
    }

    class VanillaRouter {
        constructor({mode = "hash", routes}){

            this.checkIfAlreadyExists();

            this.mode = mode;
            this.routes = routes;
        
            this.initializeNavigator();
            this.initializeTemplates();
            this.initializeRouterComponents();
            
            window[ROUTER_PROPERTY_NAME] = this;

            window.$router = this.getRouterProperties();

            this.$navigator.start();
        }

        checkIfAlreadyExists(){
            tryCatch(() => {
                if(window[ROUTER_PROPERTY_NAME]) throw Error("Router already exists")
            });
        }

        checkMode(){
            if(!["history","hash"].includes(this.mode)) this.mode = "hash";
        }

        initializeNavigator(){
            this.checkMode();

            switch(this.mode){
                case "hash": {
                    this.$navigator = new HashNavigator();
                }
            }

            this.$navigator.onRouteChange(() => {
                this.onRouteChange();
            });
        }

        initializeTemplates(){
            const templates = document.querySelectorAll("body > template[page]");
            const list = new Map();

            templates.forEach(template => {
                let name = (template.getAttribute("page") ?? "").trim();

                if(name) list.set(name, template);
            });

            this.routerTemplates = list;
        }

        initializeRouterComponents(){
            this.routerComponents = new Map();

            Object.entries(this.routes).forEach(([path, component]) => {
                const pageName = (component.page ?? "").trim();

                if(pageName){
                    const template = this.routerTemplates.get(pageName);
                    const fast_star = path === '*';

                    const pathRegex = !fast_star ?
                    pathToRegex(path) 
                    : null;

                    this.routerComponents.set(path, {
                        path,
                        pathRegex,
                        template,
                        alise: pageName,
                        fast_star
                    });
                } 
            });
        }

        setCurrentRoute(){
            this.activeRoute = {};
        }

        checkIfActiveRoute(component){
            return (component.alise === this.activeRoute?.alise) 
        }

        get routerView(){
            return window[ROUTER_VIEW_PROPERTY_NAME];
        }

        getRouteMatch(path){
            for(let [_ , route] of this.routerComponents){

                if(route.fast_star) continue;

                if(path.match(route.pathRegex)){
                    return route;
                }
            }

            return this.routerComponents.get("*") || null;
        }

        show(path = null){
            let component = this.getRouteMatch(path);
            
            if(component){
                this.activeRoute = component;
                const { template } = component;
                this.render(template);
            }
        }

        clearRouterView(){
            if(this.routerView){
                while (this.routerView.firstChild) {
                    this.routerView.removeChild(this.routerView.lastChild);
                }
            }
        }

        render(template){
            if(this.routerView && template){
                this.clearRouterView();

                const templateFragment = template.content.cloneNode(true);

                convertScriptsToIife([...templateFragment.querySelectorAll("script")]);

                this.routerView.appendChild(templateFragment);
            }
        }

        redirect(path = "/", query = {}){
            const queryString = generateQueryString(query);

            this.$navigator.replace(path + queryString);
        }

        onRouteChange(){
            const path = this.$navigator.currentPath();

            this.show(path);

            console.log(this.$navigator.$route);
        }

        getRouterProperties(){
            const self = this;

            return {
                get route(){
                    return self.$navigator.$route
                },
                redirect: self.redirect.bind(self)
            }
        }
    }

    window.VanillaRouter = VanillaRouter;

}());
