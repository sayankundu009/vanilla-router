import "./components/view";
import "./components/link";
import { ROUTER_PROPERTY_NAME, ROUTER_VIEW_PROPERTY_NAME, tryCatch, convertScriptsToIife, generateQueryString, pathToRegex} from "./utils"

import HashNavigator from "./navigators/hash"

class VanillaRouter {
    constructor({mode = "hash", routes}){

        this.checkIfAlreadyExists();

        this.mode = mode
        this.routes = routes;
    
        this.initializeNavigator();
        this.initializeTemplates();
        this.initializeRouterComponents();
        
        window[ROUTER_PROPERTY_NAME] = this

        window.$router = this.getRouterProperties();

        this.$navigator.start()
    }

    checkIfAlreadyExists(){
        tryCatch(() => {
            if(window[ROUTER_PROPERTY_NAME]) throw Error("Router already exists")
        })
    }

    checkMode(){
        if(!["history","hash"].includes(this.mode)) this.mode = "hash"
    }

    initializeNavigator(){
        this.checkMode();

        switch(this.mode){
            case "hash": {
                this.$navigator = new HashNavigator();
            }
        }

        this.$navigator.onRouteChange(() => {
            this.onRouteChange()
        });
    }

    initializeTemplates(){
        const templates = document.querySelectorAll("body > template[page]");
        const list = new Map();

        templates.forEach(template => {
            let name = (template.getAttribute("page") ?? "").trim();

            if(name) list.set(name, template)
        })

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
        let component = this.getRouteMatch(path)
        
        if(component){
            this.activeRoute = component;
            const { template } = component;
            this.render(template)
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

            convertScriptsToIife([...templateFragment.querySelectorAll("script")])

            this.routerView.appendChild(templateFragment);
        }
    }

    redirect(path = "/", query = {}){
        const queryString = generateQueryString(query);

        this.$navigator.replace(path + queryString);
    }

    onRouteChange(){
        const path = this.$navigator.currentPath()

        this.show(path);

        console.log(this.$navigator.$route)
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

window.VanillaRouter = VanillaRouter