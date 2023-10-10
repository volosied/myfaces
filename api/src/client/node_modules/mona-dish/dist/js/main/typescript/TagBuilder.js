/*!
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to you under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//poliyfill from @webcomponents/webcomponentsjs
import { DomQuery } from "./DomQuery";
import { _global$ } from "./Global";
if ("undefined" != typeof _global$) {
    (function () {
        if (void 0 === _global$().Reflect || void 0 === _global$().customElements || _global$().customElements.polyfillWrapFlushCallback)
            return;
        const a = HTMLElement;
        _global$().HTMLElement = {
            HTMLElement: function HTMLElement() {
                return Reflect.construct(a, [], this.constructor);
            }
        }.HTMLElement, HTMLElement.prototype = a.prototype, HTMLElement.prototype.constructor = HTMLElement, Object.setPrototypeOf(HTMLElement, a);
    })();
}
/**
 * beginning custom tag support
 *
 * This api is still experimental
 * and might be interwoven with DomQuery
 * so it is bound to change
 *
 * it follows a builder pattern to allow easier creations
 * with less code of custom tags
 */
export class TagBuilder {
    // noinspection JSUnusedGlobalSymbols
    static withTagName(tagName) {
        return new TagBuilder(tagName);
    }
    // noinspection JSUnusedGlobalSymbols
    constructor(tagName) {
        this.extendsType = HTMLElement;
        this.observedAttrs = [];
        this.tagName = tagName;
    }
    // noinspection JSUnusedGlobalSymbols
    withObservedAttributes(...oAttrs) {
        this.observedAttrs = oAttrs;
    }
    // noinspection JSUnusedGlobalSymbols
    withConnectedCallback(callback) {
        this.connectedCallback = callback;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    withDisconnectedCallback(callback) {
        this.disconnectedCallback = callback;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    withAdoptedCallback(callback) {
        this.adoptedCallback = callback;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    withAttributeChangedCallback(callback) {
        this.attributeChangedCallback = callback;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    withExtendsType(extendsType) {
        this.extendsType = extendsType;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    withOptions(theOptions) {
        this.theOptions = theOptions;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    withClass(clazz) {
        if (this.markup) {
            throw Error("Markup already defined, markup must be set in the class");
        }
        this.clazz = clazz;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    withMarkup(markup) {
        if (this.clazz) {
            throw Error("Class already defined, markup must be set in the class");
        }
        this.markup = markup;
        return this;
    }
    // noinspection JSUnusedGlobalSymbols
    register() {
        if (!this.clazz && !this.markup) {
            throw Error("Class or markup must be defined");
        }
        if (this.clazz) {
            let applyCallback = (name) => {
                let outerCallback = this[name];
                let protoCallback = this.clazz.prototype[name];
                let finalCallback = outerCallback || protoCallback;
                if (finalCallback) {
                    this.clazz.prototype[name] = function () {
                        if (outerCallback) {
                            finalCallback.apply(DomQuery.byId(this));
                        }
                        else {
                            protoCallback.apply(this);
                        }
                    };
                }
            };
            applyCallback("connectedCallback");
            applyCallback("disconnectedCallback");
            applyCallback("adoptedCallback");
            applyCallback("attributeChangedCallback");
            //TODO how do we handle the oAttrs?
            if (this.observedAttrs.length) {
                Object.defineProperty(this.clazz.prototype, "observedAttributes", {
                    get() {
                        return this.observedAttrs;
                    }
                });
            }
            _global$().customElements.define(this.tagName, this.clazz, this.theOptions || null);
        }
        else {
            let _t_ = this;
            let applyCallback = (name, scope) => {
                if (_t_[name]) {
                    _t_[name].apply(DomQuery.byId(scope));
                }
            };
            _global$().customElements.define(this.tagName, class extends this.extendsType {
                constructor() {
                    super();
                    this.innerHTML = _t_.markup;
                }
                // noinspection JSUnusedGlobalSymbols
                static get observedAttributes() {
                    return _t_.observedAttrs;
                }
                // noinspection JSUnusedGlobalSymbols
                connectedCallback() {
                    applyCallback("connectedCallback", this);
                }
                // noinspection JSUnusedGlobalSymbols
                disconnectedCallback() {
                    applyCallback("disconnectedCallback", this);
                }
                // noinspection JSUnusedGlobalSymbols
                adoptedCallback() {
                    applyCallback("adoptedCallback", this);
                }
                // noinspection JSUnusedGlobalSymbols
                attributeChangedCallback() {
                    applyCallback("attributeChangedCallback", this);
                }
            }, this.theOptions || null);
        }
    }
}
//# sourceMappingURL=TagBuilder.js.map