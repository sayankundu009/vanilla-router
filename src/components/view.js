import { ROUTER_VIEW_PROPERTY_NAME, tryCatch } from '../utils';

class RouterView extends HTMLElement{
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.checkIfAlreadyExists()
        this.shadowRoot.innerHTML = `<slot></slot>`;
        window[ROUTER_VIEW_PROPERTY_NAME] = this
    }

    checkIfAlreadyExists(){
        tryCatch(() =>{
            if(window[ROUTER_VIEW_PROPERTY_NAME]) throw Error("Router View already exists")
        })
    }
}

window.customElements.define('router-view', RouterView);