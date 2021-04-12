import { ROUTER_PROPERTY_NAME } from '../utils';

class RouterLink extends HTMLElement{
     constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._$a = null;
     }

     connectedCallback() {
        if(this.to){
            this.addEventListener("click", (event) => {
                console.log("Go to: ",this.to)
            })
        }
     }

     connectedCallback() {
        this.path = this.getAttribute("to") || "";

        this.shadowRoot.innerHTML = `<a href="#${this.path}">${this.innerHTML}</a>`;

        this._$a = this.shadowRoot.querySelector("a");

        this.attachAttributes();

        this._$a.addEventListener("click", event => {
            event.preventDefault();
            this.redirect()
        });

        this.parentElement.insertBefore(this._$a, this);

        this.remove()
      }

      attachAttributes(){
        [...this.attributes].forEach(attr => {
            this._$a.setAttribute(attr.name, attr.value)
        })

        this._$a.removeAttribute("to");
      }

      get observedAttributes() { return ["class","style"]; }

      attributeChangedCallback(name, oldValue, newValue){
        this._$a.setAttribute(name, newValue)
      }

      get $router(){
          return window[ROUTER_PROPERTY_NAME];
      }
      
      redirect(){
        if(this.$router && ("redirect" in this.$router)){
            this.$router.redirect(this.path)
        }
      }
}

window.customElements.define('router-link', RouterLink);