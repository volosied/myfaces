/*!
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to you under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http:// www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Optional, ValueEmbedder } from "./Monad";
import { ITERATION_STATUS } from "./SourcesCollectors";
import { Lang } from "./Lang";
import { _global$ } from "./Global";
import { Es2019Array } from "./Es2019Array";
var trim = Lang.trim;
var isString = Lang.isString;
var eqi = Lang.equalsIgnoreCase;
var objToArray = Lang.objToArray;
import { append, assign, simpleShallowMerge } from "./AssocArray";
/**
 *
 *        // - submit checkboxes and radio inputs only if checked
 if ((tagName != "select" && elemType != "button"
 && elemType != "reset" && elemType != "submit" && elemType != "image")
 && ((elemType != "checkbox" && elemType != "radio"
 */
var ALLOWED_SUBMITTABLE_ELEMENTS;
(function (ALLOWED_SUBMITTABLE_ELEMENTS) {
    ALLOWED_SUBMITTABLE_ELEMENTS["SELECT"] = "select";
    ALLOWED_SUBMITTABLE_ELEMENTS["BUTTON"] = "button";
    ALLOWED_SUBMITTABLE_ELEMENTS["SUBMIT"] = "submit";
    ALLOWED_SUBMITTABLE_ELEMENTS["RESET"] = "reset";
    ALLOWED_SUBMITTABLE_ELEMENTS["IMAGE"] = "image";
    ALLOWED_SUBMITTABLE_ELEMENTS["RADIO"] = "radio";
    ALLOWED_SUBMITTABLE_ELEMENTS["CHECKBOX"] = "checkbox";
})(ALLOWED_SUBMITTABLE_ELEMENTS || (ALLOWED_SUBMITTABLE_ELEMENTS = {}));
/**
 * helper to fix a common problem that a system has to wait, until a certain condition is reached.
 * Depending on the browser this uses either the Mutation Observer or a semi compatible interval as fallback.
 * @param root the root DomQuery element to start from
 * @param condition the condition lambda to be fulfilled
 * @param options options for the search
 */
function waitUntilDom(root, condition, options = {
    attributes: true,
    childList: true,
    subtree: true,
    timeout: 500,
    interval: 100
}) {
    return new Promise((success, error) => {
        let observer = null;
        const MUT_ERROR = new Error("Mutation observer timeout");
        // we do the same but for now ignore the options on the dom query
        // we cannot use absent here, because the condition might search for an absent element
        function findElement(root, condition) {
            let found = null;
            if (!!condition(root)) {
                return root;
            }
            if (options.childList) {
                found = (condition(root)) ? root : root.childNodes.filter(item => condition(item)).first().value.value;
            }
            else if (options.subtree) {
                found = (condition(root)) ? root : root.querySelectorAll(" * ").filter(item => condition(item)).first().value.value;
            }
            else {
                found = (condition(root)) ? root : null;
            }
            return found;
        }
        let foundElement = root;
        if (!!(foundElement = findElement(foundElement, condition))) {
            success(new DomQuery(foundElement));
            return;
        }
        if ('undefined' != typeof MutationObserver) {
            const mutTimeout = setTimeout(() => {
                observer.disconnect();
                return error(MUT_ERROR);
            }, options.timeout);
            const callback = (mutationList) => {
                const found = new DomQuery(mutationList.map((mut) => mut.target)).filter(item => condition(item)).first();
                if (found.isPresent()) {
                    clearTimeout(mutTimeout);
                    observer.disconnect();
                    success(new DomQuery(found || root));
                }
            };
            observer = new MutationObserver(callback);
            // browsers might ignore it, but we cannot break the api in the case
            // hence no timeout is passed
            let observableOpts = { ...options };
            delete observableOpts.timeout;
            root.eachElem(item => {
                observer.observe(item, observableOpts);
            });
        }
        else { // fallback for legacy browsers without mutation observer
            let interval = setInterval(() => {
                let found = findElement(root, condition);
                if (!!found) {
                    if (timeout) {
                        clearTimeout(timeout);
                        clearInterval(interval);
                        interval = null;
                    }
                    success(new DomQuery(found || root));
                }
            }, options.interval);
            let timeout = setTimeout(() => {
                if (interval) {
                    clearInterval(interval);
                    error(MUT_ERROR);
                }
            }, options.timeout);
        }
    });
}
export class ElementAttribute extends ValueEmbedder {
    constructor(element, name, defaultVal = null) {
        super(element, name);
        this.element = element;
        this.name = name;
        this.defaultVal = defaultVal;
    }
    get value() {
        let val = this.element.get(0).orElse(...[]).values;
        if (!val.length) {
            return this.defaultVal;
        }
        return val[0].getAttribute(this.name);
    }
    set value(value) {
        let val = this.element.get(0).orElse(...[]).values;
        for (let cnt = 0; cnt < val.length; cnt++) {
            val[cnt].setAttribute(this.name, value);
        }
        val[0].setAttribute(this.name, value);
    }
    getClass() {
        return ElementAttribute;
    }
    static fromNullable(value, valueKey = "value") {
        return new ElementAttribute(value, valueKey);
    }
}
export class Style extends ValueEmbedder {
    constructor(element, name, defaultVal = null) {
        super(element, name);
        this.element = element;
        this.name = name;
        this.defaultVal = defaultVal;
    }
    get value() {
        let val = this.element.values;
        if (!val.length) {
            return this.defaultVal;
        }
        return val[0].style[this.name];
    }
    set value(value) {
        let val = this.element.values;
        for (let cnt = 0; cnt < val.length; cnt++) {
            val[cnt].style[this.name] = value;
        }
    }
    getClass() {
        return ElementAttribute;
    }
    static fromNullable(value, valueKey = "value") {
        return new ElementAttribute(value, valueKey);
    }
}
/**
 * small helper for the specialized jsf case
 * @constructor
 */
const DEFAULT_WHITELIST = () => {
    return true;
};
/**
 * Monadic DomNode representation, ala jquery
 * This is a thin wrapper over querySelectorAll
 * to get slim monadic support
 * to reduce implementation code on the users side.
 * This is vital for frameworks which want to rely on
 * plain dom but still do not want to lose
 * the reduced code footprint of querying dom trees and traversing
 * by using functional patterns.
 *
 * Also, a few convenience methods are added to reduce
 * the code footprint of standard dom processing
 * operations like eval
 *
 * in most older systems
 * Note parts of this code still stem from the Dom.js I have written 10 years
 * ago, those parts look a bit ancient and will be replaced over time.
 *
 */
export class DomQuery {
    constructor(...rootNode) {
        this.rootNode = [];
        this.pos = -1;
        // because we can stream from an array stream directly into the dom query
        this._limits = -1;
        if (Optional.fromNullable(rootNode).isAbsent() || !rootNode.length) {
            return;
        }
        else {
            // we need to flatten out the arrays
            for (let cnt = 0; cnt < rootNode.length; cnt++) {
                if (!rootNode[cnt]) {
                    // we skip possible null entries which can happen in
                    // certain corner conditions due to the constructor re-wrapping single elements into arrays.
                }
                else if (isString(rootNode[cnt])) {
                    let foundElement = DomQuery.querySelectorAll(rootNode[cnt]);
                    if (!foundElement.isAbsent()) {
                        rootNode.push(...foundElement.values);
                    }
                }
                else if (rootNode[cnt] instanceof DomQuery) {
                    this.rootNode.push(...rootNode[cnt].values);
                }
                else {
                    this.rootNode.push(rootNode[cnt]);
                }
            }
        }
    }
    /**
     * returns the first element
     */
    get value() {
        return this.getAsElem(0);
    }
    get values() {
        return this.allElems();
    }
    get global() {
        return _global$;
    }
    get stream() {
        throw Error("Not implemented, include Stream.ts for this to work");
    }
    get lazyStream() {
        throw Error("Not implemented, include Stream.ts for this to work");
    }
    /**
     * returns the id of the first element
     */
    get id() {
        return new ElementAttribute(this.get(0), "id");
    }
    /**
     * length of the entire query set
     */
    get length() {
        return this.rootNode.length;
    }
    /**
     * convenience method for tagName
     */
    get tagName() {
        return this.getAsElem(0).getIf("tagName");
    }
    /**
     * convenience method for nodeName
     */
    get nodeName() {
        return this.getAsElem(0).getIf("nodeName");
    }
    isTag(tagName) {
        return !this.isAbsent()
            && (this.nodeName.orElse("__none___")
                .value.toLowerCase() == tagName.toLowerCase()
                || this.tagName.orElse("__none___")
                    .value.toLowerCase() == tagName.toLowerCase());
    }
    /**
     * convenience property for type
     *
     * returns null in case of no type existing otherwise
     * the type of the first element
     */
    get type() {
        return this.getAsElem(0).getIf("type");
    }
    /**
     * convenience property for name
     *
     * returns null in case of no type existing otherwise
     * the name of the first element
     */
    get name() {
        return new ValueEmbedder(this.getAsElem(0).value, "name");
    }
    /**
     * convenience property for value
     *
     * returns null in case of no type existing otherwise
     * the value of the first element
     */
    get inputValue() {
        if (this.getAsElem(0).getIf("value").isPresent()) {
            return new ValueEmbedder(this.getAsElem(0).value);
        }
        else {
            return ValueEmbedder.absent;
        }
    }
    get val() {
        return this.inputValue.value;
    }
    set val(value) {
        this.inputValue.value = value;
    }
    get nodeId() {
        return this.id.value;
    }
    set nodeId(value) {
        this.id.value = value;
    }
    get checked() {
        return new Es2019Array(...this.values).every(el => !!el.checked);
    }
    set checked(newChecked) {
        this.eachElem(el => el.checked = newChecked);
    }
    get elements() {
        // a simple querySelectorAll should suffice
        return this.querySelectorAll("input, checkbox, select, textarea, fieldset");
    }
    get deepElements() {
        let elemStr = "input, select, textarea, checkbox, fieldset";
        return this.querySelectorAllDeep(elemStr);
    }
    /**
     * a deep search which treats the single isolated shadow dom areas
     * separately and runs the query on each shadow dom
     * @param queryStr
     */
    querySelectorAllDeep(queryStr) {
        let found = [];
        let queryRes = this.querySelectorAll(queryStr);
        if (queryRes.length) {
            found.push(queryRes);
        }
        let shadowRoots = this.querySelectorAll("*").shadowRoot;
        if (shadowRoots.length) {
            let shadowRes = shadowRoots.querySelectorAllDeep(queryStr);
            if (shadowRes.length) {
                found.push(shadowRes);
            }
        }
        return new DomQuery(...found);
    }
    /**
     * disabled flag
     */
    get disabled() {
        return this.attr("disabled").isPresent();
    }
    set disabled(disabled) {
        // this.attr("disabled").value = disabled + "";
        if (!disabled) {
            this.removeAttribute("disabled");
        }
        else {
            this.attr("disabled").value = "disabled";
        }
    }
    removeAttribute(name) {
        this.eachElem(item => item.removeAttribute(name));
    }
    get childNodes() {
        let childNodeArr = [];
        this.eachElem((item) => {
            childNodeArr = childNodeArr.concat(objToArray(item.childNodes));
        });
        return new DomQuery(...childNodeArr);
    }
    get asArray() {
        // filter not supported by IE11
        let items = new Es2019Array(...this.rootNode).filter(item => {
            return item != null;
        }).map(item => {
            return DomQuery.byId(item);
        });
        return items;
    }
    get offsetWidth() {
        return new Es2019Array(...this.rootNode)
            .filter(item => item != null)
            .map(elem => elem.offsetWidth)
            .reduce((accumulate, incoming) => accumulate + incoming, 0);
    }
    get offsetHeight() {
        return new Es2019Array(...this.rootNode)
            .filter(item => item != null)
            .map(elem => elem.offsetHeight)
            .reduce((accumulate, incoming) => accumulate + incoming, 0);
    }
    get offsetLeft() {
        return new Es2019Array(...this.rootNode)
            .filter(item => item != null)
            .map(elem => elem.offsetLeft)
            .reduce((accumulate, incoming) => accumulate + incoming, 0);
    }
    get offsetTop() {
        return new Es2019Array(this.rootNode)
            .filter(item => item != null)
            .map(elem => elem.offsetTop)
            .reduce((accumulate, incoming) => accumulate + incoming, 0);
    }
    get asNodeArray() {
        return new Es2019Array(...this.rootNode.filter(item => item != null));
    }
    get nonce() {
        var _a, _b;
        return Optional.fromNullable((_b = (_a = this === null || this === void 0 ? void 0 : this.rootNode) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.nonce);
    }
    static querySelectorAllDeep(selector) {
        return new DomQuery(document).querySelectorAllDeep(selector);
    }
    /**
     * easy query selector all producer
     *
     * @param selector the selector
     * @returns a results dom query object
     */
    static querySelectorAll(selector) {
        if (selector.indexOf("/shadow/") != -1) {
            return new DomQuery(document)._querySelectorAllDeep(selector);
        }
        else {
            return new DomQuery(document)._querySelectorAll(selector);
        }
    }
    /**
     * byId producer
     *
     * @param selector id
     * @param deep true if you want to go into shadow areas
     * @return a DomQuery containing the found elements
     */
    static byId(selector, deep = false) {
        if (isString(selector)) {
            return (!deep) ? new DomQuery(document).byId(selector) : new DomQuery(document).byIdDeep(selector);
        }
        else {
            return new DomQuery(selector);
        }
    }
    /**
     * byTagName producer
     *
     * @param selector name
     * @return a DomQuery containing the found elements
     */
    static byTagName(selector) {
        if (isString(selector)) {
            return new DomQuery(document).byTagName(selector);
        }
        else {
            return new DomQuery(selector);
        }
    }
    static globalEval(code, nonce) {
        return new DomQuery(document).globalEval(code, nonce);
    }
    static globalEvalSticky(code, nonce) {
        return new DomQuery(document).globalEvalSticky(code, nonce);
    }
    /**
     * builds the ie nodes properly in a placeholder
     * and bypasses a non script insert bug that way
     * @param markup the markup code to be executed from
     */
    static fromMarkup(markup) {
        // https:// developer.mozilla.org/de/docs/Web/API/DOMParser license creative commons
        const doc = document.implementation.createHTMLDocument("");
        markup = trim(markup);
        let lowerMarkup = markup.toLowerCase();
        if (lowerMarkup.search(/<!doctype[^\w\-]+/gi) != -1 ||
            lowerMarkup.search(/<html[^\w\-]+/gi) != -1 ||
            lowerMarkup.search(/<head[^\w\-]+/gi) != -1 ||
            lowerMarkup.search(/<body[^\w\-]+/gi) != -1) {
            doc.documentElement.innerHTML = markup;
            return new DomQuery(doc.documentElement);
        }
        else {
            let startsWithTag = function (str, tagName) {
                let tag1 = ["<", tagName, ">"].join("");
                let tag2 = ["<", tagName, " "].join("");
                return (str.indexOf(tag1) == 0) || (str.indexOf(tag2) == 0);
            };
            let dummyPlaceHolder = new DomQuery(document.createElement("div"));
            // table needs special treatment due to the browsers auto creation
            if (startsWithTag(lowerMarkup, "thead") || startsWithTag(lowerMarkup, "tbody")) {
                dummyPlaceHolder.html(`<table>${markup}</table>`);
                return dummyPlaceHolder.querySelectorAll("table").get(0).childNodes.detach();
            }
            else if (startsWithTag(lowerMarkup, "tfoot")) {
                dummyPlaceHolder.html(`<table><thead></thead><tbody><tbody${markup}</table>`);
                return dummyPlaceHolder.querySelectorAll("table").get(2).childNodes.detach();
            }
            else if (startsWithTag(lowerMarkup, "tr")) {
                dummyPlaceHolder.html(`<table><tbody>${markup}</tbody></table>`);
                return dummyPlaceHolder.querySelectorAll("tbody").get(0).childNodes.detach();
            }
            else if (startsWithTag(lowerMarkup, "td")) {
                dummyPlaceHolder.html(`<table><tbody><tr>${markup}</tr></tbody></table>`);
                return dummyPlaceHolder.querySelectorAll("tr").get(0).childNodes.detach();
            }
            dummyPlaceHolder.html(markup);
            return dummyPlaceHolder.childNodes.detach();
        }
    }
    /**
     * returns the nth element as DomQuery
     * from the internal elements
     * note if you try to reach a non-existing element position
     * you will get back an absent entry
     *
     * @param index the nth index
     */
    get(index) {
        return (index < this.rootNode.length) ? new DomQuery(this.rootNode[index]) : DomQuery.absent;
    }
    /**
     * returns the nth element as optional of an Element object
     * @param index the number from the index
     * @param defaults the default value if the index is overrun default Optional\.absent
     */
    getAsElem(index, defaults = Optional.absent) {
        return (index < this.rootNode.length) ? Optional.fromNullable(this.rootNode[index]) : defaults;
    }
    /**
     * returns the files from a given element
     * @param index
     */
    filesFromElem(index) {
        var _a;
        return (index < this.rootNode.length) ? ((_a = this.rootNode[index]) === null || _a === void 0 ? void 0 : _a.files) ? this.rootNode[index].files : [] : [];
    }
    /**
     * returns the value array< of all elements
     */
    allElems() {
        return this.rootNode;
    }
    /**
     * absent no values reached?
     */
    isAbsent() {
        return this.length == 0;
    }
    /**
     * should make the code clearer
     * note if you pass a function
     * this refers to the active DomQuery object
     */
    isPresent(presentRunnable) {
        let absent = this.isAbsent();
        if (!absent && presentRunnable) {
            presentRunnable.call(this, this);
        }
        return !absent;
    }
    /**
     * should make the code clearer
     * note if you pass a function
     * this refers to the active DomQuery object
     *
     *
     * @param presentRunnable
     */
    ifPresentLazy(presentRunnable = function () {
    }) {
        this.isPresent.call(this, presentRunnable);
        return this;
    }
    /**
     * remove all affected nodes from this query object from the dom tree
     */
    delete() {
        this.eachElem((node) => {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
    }
    querySelectorAll(selector) {
        // We could merge both methods, but for now this is more readable
        if (selector.indexOf("/shadow/") != -1) {
            return this._querySelectorAllDeep(selector);
        }
        else {
            return this._querySelectorAll(selector);
        }
    }
    closest(selector) {
        // We could merge both methods, but for now this is more readable
        if (selector.indexOf("/shadow/") != -1) {
            return this._closestDeep(selector);
        }
        else {
            return this._closest(selector);
        }
    }
    /**
     * core byId method
     * @param id the id to search for
     * @param includeRoot also match the root element?
     */
    byId(id, includeRoot) {
        let res = [];
        if (includeRoot) {
            res = res.concat(...new Es2019Array(...((this === null || this === void 0 ? void 0 : this.rootNode) || []))
                .filter(((item) => id == item.id))
                .map(item => new DomQuery(item)));
        }
        // for some strange kind of reason the # selector fails
        // on hidden elements we use the attributes match selector
        // that works
        res = res.concat(this.querySelectorAll(`[id="${id}"]`));
        return new DomQuery(...res);
    }
    byIdDeep(id, includeRoot) {
        let res = [];
        if (includeRoot) {
            res = res.concat(new Es2019Array(...((this === null || this === void 0 ? void 0 : this.rootNode) || []))
                .filter(item => id == item.id)
                .map(item => new DomQuery(item)));
        }
        let subItems = this.querySelectorAllDeep(`[id="${id}"]`);
        if (subItems.length) {
            res.push(subItems);
        }
        return new DomQuery(...res);
    }
    /**
     * same as byId just for the tag name
     * @param tagName the tag-name to search for
     * @param includeRoot shall the root element be part of this search
     * @param deep do we also want to go into shadow dom areas
     */
    byTagName(tagName, includeRoot, deep) {
        var _a;
        let res = [];
        if (includeRoot) {
            res = new Es2019Array(...((_a = this === null || this === void 0 ? void 0 : this.rootNode) !== null && _a !== void 0 ? _a : []))
                .filter(element => (element === null || element === void 0 ? void 0 : element.tagName) == tagName)
                .reduce((reduction, item) => reduction.concat([item]), res);
        }
        (deep) ? res.push(this.querySelectorAllDeep(tagName)) : res.push(this.querySelectorAll(tagName));
        return new DomQuery(...res);
    }
    /**
     * attr accessor, usage myQuery.attr("class").value = "bla"
     * or let value myQuery.attr("class").value
     * @param attr the attribute to set
     * @param defaultValue the default value in case nothing is presented (defaults to null)
     */
    attr(attr, defaultValue = null) {
        return new ElementAttribute(this, attr, defaultValue);
    }
    style(cssProperty, defaultValue = null) {
        return new Style(this, cssProperty, defaultValue);
    }
    /**
     * Checks for an existing class in the class attributes
     *
     * @param clazz the class to search for
     */
    hasClass(clazz) {
        let hasIt = false;
        this.eachElem(node => {
            hasIt = node.classList.contains(clazz);
            if (hasIt) {
                return false;
            }
        });
        return hasIt;
    }
    /**
     * appends a class string if not already in the element(s)
     *
     * @param clazz the style class to append
     */
    addClass(clazz) {
        this.eachElem(item => item.classList.add(clazz));
        return this;
    }
    /**
     * remove the style class if in the class definitions
     *
     * @param clazz
     */
    removeClass(clazz) {
        this.eachElem(item => item.classList.remove(clazz));
        return this;
    }
    /**
     * checks whether we have a multipart element in our children
     * or are one
     */
    isMultipartCandidate(deep = false) {
        const FILE_INPUT = "input[type='file']";
        return this.matchesSelector(FILE_INPUT) ||
            ((!deep) ? this.querySelectorAll(FILE_INPUT) :
                this.querySelectorAllDeep(FILE_INPUT)).first().isPresent();
    }
    /**
     * innerHtml
     * equivalent to jQueries html
     * as setter the html is set and the
     * DomQuery is given back
     * as getter the html string is returned
     *
     * @param newInnerHTML the inner html to be inserted
     */
    html(newInnerHTML) {
        if (Optional.fromNullable(newInnerHTML).isAbsent()) {
            return this.isPresent() ? Optional.fromNullable(this.innerHTML) : Optional.absent;
        }
        this.innerHTML = newInnerHTML;
        return this;
    }
    /**
     * Standard dispatch event method, delegated from node
     */
    dispatchEvent(evt) {
        this.eachElem(elem => elem.dispatchEvent(evt));
        return this;
    }
    /**
     * abbreviation property to use innerHTML directly like on the dom tree
     * @param newInnerHTML  the new inner html which should be attached to "this" domQuery
     */
    set innerHTML(newInnerHTML) {
        this.eachElem(elem => elem.innerHTML = newInnerHTML);
    }
    /**
     * getter abbreviation to use innerHTML directly
     */
    get innerHTML() {
        let retArr = [];
        this.eachElem(elem => retArr.push(elem.innerHTML));
        return retArr.join("");
    }
    /**
     * since the dom allows both innerHTML and innerHtml we also have to implement both
     * @param newInnerHtml see above
     */
    set innerHtml(newInnerHtml) {
        this.innerHTML = newInnerHtml;
    }
    /**
     * same here, getter for allowing innerHtml directly
     */
    get innerHtml() {
        return this.innerHTML;
    }
    /**
     * filters the current dom query elements
     * upon a given selector
     *
     * @param selector
     */
    filterSelector(selector) {
        let matched = [];
        this.eachElem(item => {
            if (this._mozMatchesSelector(item, selector)) {
                matched.push(item);
            }
        });
        return new DomQuery(...matched);
    }
    /**
     * checks whether any item in this domQuery level matches the selector
     * if there is one element only attached, as root the match is only
     * performed on this element.
     * @param selector
     */
    matchesSelector(selector) {
        return this.asArray
            .some(item => this._mozMatchesSelector(item.getAsElem(0).value, selector));
    }
    /**
     * easy node traversal, you can pass
     * a set of node selectors which are joined as direct children
     *
     * Note!!! The root nodes are not in the getIf, those are always the child nodes
     *
     * @param nodeSelector
     */
    getIf(...nodeSelector) {
        let selectorStage = this.childNodes;
        for (let cnt = 0; cnt < nodeSelector.length; cnt++) {
            selectorStage = selectorStage.filterSelector(nodeSelector[cnt]);
            if (selectorStage.isAbsent()) {
                return selectorStage;
            }
        }
        return selectorStage;
    }
    eachElem(func) {
        for (let cnt = 0, len = this.rootNode.length; cnt < len; cnt++) {
            if (func(this.rootNode[cnt], cnt) === false) {
                break;
            }
        }
        return this;
    }
    firstElem(func = item => item) {
        if (this.rootNode.length > 1) {
            func(this.rootNode[0], 0);
        }
        return this;
    }
    lastElem(func = item => item) {
        if (this.rootNode.length > 1) {
            func(this.rootNode[this.rootNode.length - 1], 0);
        }
        return this;
    }
    each(func) {
        new Es2019Array(...this.rootNode)
            .forEach((item, cnt) => {
            // we could use a filter, but for the best performance we don´t
            if (item == null) {
                return;
            }
            return func(DomQuery.byId(item), cnt);
        });
        return this;
    }
    /**
     * replace convenience function, replaces one or more elements with
     * a set of elements passed as DomQuery
     * @param toReplace the replaced nodes as reference (original node has been replaced)
     */
    replace(toReplace) {
        this.each(item => {
            let asElem = item.getAsElem(0).value;
            let parent = asElem.parentElement;
            let nextElement = asElem.nextElementSibling;
            let previousElement = asElem.previousElementSibling;
            if (nextElement != null) {
                new DomQuery(nextElement).insertBefore(toReplace);
            }
            else if (previousElement) {
                new DomQuery(previousElement).insertAfter(toReplace);
            }
            else {
                new DomQuery(parent).append(toReplace);
            }
            item.delete();
        });
        return toReplace;
    }
    /**
     * returns a new dom query containing only the first element max
     *
     * @param func a an optional callback function to perform an operation on the first element
     */
    first(func = (item) => item) {
        if (this.rootNode.length >= 1) {
            func(this.get(0), 0);
            return this.get(0);
        }
        return this;
    }
    /**
     * returns a new dom query containing only the first element max
     *
     * @param func a an optional callback function to perform an operation on the first element
     */
    last(func = (item) => item) {
        if (this.rootNode.length >= 1) {
            let lastNode = this.get(this.rootNode.length - 1);
            func(lastNode, 0);
            return lastNode;
        }
        return this;
    }
    /**
     * filter function which filters a subset
     *
     * @param func
     */
    filter(func) {
        let reArr = [];
        this.each((item) => {
            func(item) ? reArr.push(item) : null;
        });
        return new DomQuery(...reArr);
    }
    /**
     * global eval head appendix method
     * no other methods are supported anymore
     * @param code the code to be evaluated
     * @param  nonce optional  nonce key for higher security
     */
    globalEval(code, nonce) {
        var _a, _b, _c;
        const head = (_b = (_a = document.getElementsByTagName("head")) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : (_c = document.documentElement.getElementsByTagName("head")) === null || _c === void 0 ? void 0 : _c[0];
        const script = document.createElement("script");
        if (nonce) {
            if ('undefined' != typeof (script === null || script === void 0 ? void 0 : script.nonce)) {
                script.nonce = nonce;
            }
            else {
                script.setAttribute("nonce", nonce);
            }
        }
        script.type = "text/javascript";
        script.innerHTML = code;
        let newScriptElement = head.appendChild(script);
        head.removeChild(newScriptElement);
        return this;
    }
    /**
     * global eval head appendix method
     * no other methods are supported anymore
     * @param code the code to be evaluated
     * @param  nonce optional  nonce key for higher security
     */
    globalEvalSticky(code, nonce) {
        let head = document.getElementsByTagName("head")[0] || document.documentElement;
        let script = document.createElement("script");
        this.applyNonce(nonce, script);
        script.type = "text/javascript";
        script.innerHTML = code;
        head.appendChild(script);
        return this;
    }
    /**
     * detaches a set of nodes from their parent elements
     * in a browser independent manner
     * @return {Array} an array of nodes with the detached dom nodes
     */
    detach() {
        this.eachElem((item) => {
            item.parentNode.removeChild(item);
        });
        return this;
    }
    /**
     * appends the current set of elements
     * to the element or first element passed via elem
     * @param elem
     */
    appendTo(elem) {
        if (Lang.isString(elem)) {
            this.appendTo(DomQuery.querySelectorAll(elem));
            return this;
        }
        this.eachElem((item) => {
            let value1 = elem.getAsElem(0).orElseLazy(() => {
                return {
                    appendChild: () => {
                    }
                };
            }).value;
            value1.appendChild(item);
        });
        return this;
    }
    /**
     * loads and evaluates a script from a source uri
     *
     * @param src the source to be loaded and evaluated
     * @param delay in milliseconds execution default (0 == no delay)
     * @param nonce optional nonce value to allow increased security via nonce crypto token
     */
    loadScriptEval(src, delay = 0, nonce) {
        this._loadScriptEval(false, src, delay, nonce);
        return this;
    }
    /**
     * loads and evaluates a script from a source uri
     *
     * @param src the source to be loaded and evaluated
     * @param delay in milliseconds execution default (0 == no delay)
     * @param nonce optional nonce parameter for increased security via nonce crypto token
     */
    loadScriptEvalSticky(src, delay = 0, nonce) {
        this._loadScriptEval(true, src, delay, nonce);
        return this;
    }
    insertAfter(...toInsertParams) {
        this.each(existingItem => {
            let existingElement = existingItem.getAsElem(0).value;
            let rootNode = existingElement.parentNode;
            for (let cnt = 0; cnt < toInsertParams.length; cnt++) {
                let nextSibling = existingElement.nextSibling;
                toInsertParams[cnt].eachElem(insertElem => {
                    if (nextSibling) {
                        rootNode.insertBefore(insertElem, nextSibling);
                        existingElement = nextSibling;
                    }
                    else {
                        rootNode.appendChild(insertElem);
                    }
                });
            }
        });
        let res = [];
        res.push(this);
        res = res.concat(toInsertParams);
        return new DomQuery(...res);
    }
    insertBefore(...toInsertParams) {
        this.each(existingItem => {
            let existingElement = existingItem.getAsElem(0).value;
            let rootNode = existingElement.parentNode;
            for (let cnt = 0; cnt < toInsertParams.length; cnt++) {
                toInsertParams[cnt].eachElem(insertElem => {
                    rootNode.insertBefore(insertElem, existingElement);
                });
            }
        });
        let res = [];
        res.push(this);
        res = res.concat(toInsertParams);
        return new DomQuery(...res);
    }
    orElse(...elseValue) {
        if (this.isPresent()) {
            return this;
        }
        else {
            return new DomQuery(...elseValue);
        }
    }
    orElseLazy(func) {
        if (this.isPresent()) {
            return this;
        }
        else {
            return new DomQuery(func());
        }
    }
    /**
     * find all parents in the hierarchy for which the selector matches
     * @param selector
     */
    allParents(selector) {
        let parent = this.parent();
        let ret = [];
        while (parent.isPresent()) {
            if (parent.matchesSelector(selector)) {
                ret.push(parent);
            }
            parent = parent.parent();
        }
        return new DomQuery(...ret);
    }
    /**
     * finds the first parent in the hierarchy for which the selector matches
     * @param selector
     */
    firstParent(selector) {
        let parent = this.parent();
        while (parent.isPresent()) {
            if (parent.matchesSelector(selector)) {
                return parent;
            }
            parent = parent.parent();
        }
        return DomQuery.absent;
    }
    /**
     * fetches all parents as long as the filter criterium matches
     * @param selector
     */
    parentsWhileMatch(selector) {
        const retArr = [];
        let parent = this.parent().filter(item => item.matchesSelector(selector));
        while (parent.isPresent()) {
            retArr.push(parent);
            parent = parent.parent().filter(item => item.matchesSelector(selector));
        }
        return new DomQuery(...retArr);
    }
    parent() {
        let ret = [];
        this.eachElem((item) => {
            let parent = item.parentNode || item.host || item.shadowRoot;
            if (parent && ret.indexOf(parent) == -1) {
                ret.push(parent);
            }
        });
        return new DomQuery(...ret);
    }
    copyAttrs(sourceItem) {
        sourceItem.eachElem((sourceNode) => {
            let attrs = objToArray(sourceNode.attributes);
            for (let item of attrs) {
                let value = item.value;
                let name = item.name;
                switch (name) {
                    case "id":
                        this.id.value = value;
                        break;
                    case "disabled":
                        this.resolveAttributeHolder("disabled").disabled = value;
                        break;
                    case "checked":
                        this.resolveAttributeHolder("checked").checked = value;
                        break;
                    default:
                        this.attr(name).value = value;
                }
            }
        });
        return this;
    }
    /**
     * outerHTML convenience method
     * browsers only support innerHTML but
     * for instance for your jsf.js we have a full
     * replace pattern which needs outerHTML processing
     *
     * @param markup the markup which should replace the root element
     * @param runEmbeddedScripts if true the embedded scripts are executed
     * @param runEmbeddedCss if true the embedded css are executed
     * @param deep should this also work for shadow dom (run scripts etc...)
     */
    outerHTML(markup, runEmbeddedScripts, runEmbeddedCss, deep = false) {
        var _a;
        if (this.isAbsent()) {
            return;
        }
        let focusElementId = (_a = document === null || document === void 0 ? void 0 : document.activeElement) === null || _a === void 0 ? void 0 : _a.id;
        let caretPosition = (focusElementId) ? DomQuery.getCaretPosition(document.activeElement) : null;
        let nodes = DomQuery.fromMarkup(markup);
        let res = [];
        let toReplace = this.getAsElem(0).value;
        let firstInsert = nodes.get(0);
        let parentNode = toReplace.parentNode;
        let replaced = firstInsert.getAsElem(0).value;
        parentNode.replaceChild(replaced, toReplace);
        res.push(new DomQuery(replaced));
        // no replacement possible
        if (this.isAbsent()) {
            return this;
        }
        let insertAdditionalItems = [];
        if (nodes.length > 1) {
            insertAdditionalItems = insertAdditionalItems.concat(...nodes.values.slice(1));
            res.push(DomQuery.byId(replaced).insertAfter(new DomQuery(...insertAdditionalItems)));
        }
        if (runEmbeddedScripts) {
            this.runScripts();
        }
        if (runEmbeddedCss) {
            this.runCss();
        }
        let focusElement = DomQuery.byId(focusElementId);
        if (focusElementId && focusElement.isPresent() &&
            caretPosition != null && "undefined" != typeof caretPosition) {
            focusElement.eachElem(item => DomQuery.setCaretPosition(item, caretPosition));
        }
        return nodes;
    }
    /**
     * Run through the given nodes in the DomQuery execute the inline scripts
     * @param sticky if set to true the evaluated elements will stick to the head, default false
     * @param whitelisted: optional whitelist function which can filter out script tags which are not processed
     * defaults to the standard jsf.js exclusion (we use this code for myfaces)
     */
    runScripts(sticky = false, whitelisted = DEFAULT_WHITELIST) {
        const evalCollectedScripts = (scriptsToProcess) => {
            if (scriptsToProcess.length) {
                // script source means we have to eval the existing
                // scripts before we run the 'include' command
                // this.globalEval(finalScripts.join("\n"));
                let joinedScripts = [];
                new Es2019Array(...scriptsToProcess).forEach(item => {
                    if (!item.nonce) {
                        joinedScripts.push(item.evalText);
                    }
                    else {
                        if (joinedScripts.length) {
                            this.globalEval(joinedScripts.join("\n"));
                            joinedScripts.length = 0;
                        }
                        (!sticky) ?
                            this.globalEval(item.evalText, item.nonce) :
                            this.globalEvalSticky(item.evalText, item.nonce);
                    }
                });
                if (joinedScripts.length) {
                    (!sticky) ? this.globalEval(joinedScripts.join("\n")) :
                        this.globalEvalSticky(joinedScripts.join("\n"));
                    joinedScripts.length = 0;
                }
                scriptsToProcess = [];
            }
            return scriptsToProcess;
        };
        let finalScripts = [], allowedItemTypes = ["", "script", "text/javascript", "text/ecmascript", "ecmascript"], execScript = (item) => {
            var _a, _b, _c, _d;
            let tagName = item.tagName;
            let itemType = ((_a = item === null || item === void 0 ? void 0 : item.type) !== null && _a !== void 0 ? _a : '').toLowerCase();
            if (tagName &&
                eqi(tagName, "script") &&
                allowedItemTypes.indexOf(itemType) != -1) {
                let src = item.getAttribute('src');
                if ('undefined' != typeof src
                    && null != src
                    && src.length > 0) {
                    let nonce = (_b = item === null || item === void 0 ? void 0 : item.nonce) !== null && _b !== void 0 ? _b : item.getAttribute('nonce').value;
                    // we have to move this into an inner if because chrome otherwise chokes
                    // due to changing the and order instead of relying on left to right
                    // if jsf.js is already registered we do not replace it anymore
                    if (whitelisted(src)) {
                        // we run the collected scripts, before we run the 'include' command
                        finalScripts = evalCollectedScripts(finalScripts);
                        if (!sticky) {
                            (!!nonce) ? this.loadScriptEval(src, 0, nonce) :
                                // if no nonce is set we do not pass any once
                                this.loadScriptEval(src, 0);
                        }
                        else {
                            (!!nonce) ? this.loadScriptEvalSticky(src, 0, nonce) :
                                // if no nonce is set we do not pass any once
                                this.loadScriptEvalSticky(src, 0);
                        }
                    }
                }
                else {
                    // embedded script auto eval
                    // probably not needed anymore
                    let evalText = trim(item.text || item.innerText || item.innerHTML);
                    let go = true;
                    while (go) {
                        go = false;
                        if (evalText.substring(0, 4) == "<!--") {
                            evalText = evalText.substring(4);
                            go = true;
                        }
                        if (evalText.substring(0, 4) == "//<!--") {
                            evalText = evalText.substring(6);
                            go = true;
                        }
                        if (evalText.substring(0, 11) == "//<![CDATA[") {
                            evalText = evalText.substring(11);
                            go = true;
                        }
                    }
                    let nonce = (_d = (_c = item === null || item === void 0 ? void 0 : item.nonce) !== null && _c !== void 0 ? _c : item.getAttribute('nonce').value) !== null && _d !== void 0 ? _d : '';
                    // we have to run the script under a global context
                    // we store the script for fewer calls to eval
                    finalScripts.push({
                        nonce,
                        evalText
                    });
                }
            }
        };
        try {
            let scriptElements = new DomQuery(this.filterSelector("script"), this.querySelectorAll("script"));
            // script execution order by relative pos in their dom tree
            scriptElements.asArray
                .flatMap(item => [...item.values])
                .sort((node1, node2) => node1.compareDocumentPosition(node2) - 3) // preceding 2, following == 4)
                .forEach(item => execScript(item));
            evalCollectedScripts(finalScripts);
        }
        catch (e) {
            if (console && console.error) {
                // not sure if we
                // should use our standard
                // error mechanisms here
                // because in the head appendix
                // method only a console
                // error would be raised as well
                console.error(e.message || e.description);
            }
        }
        finally {
            // the usual ie6 fix code
            // the IE6 garbage collector is broken
            // nulling closures helps somewhat to reduce
            // mem leaks, which are impossible to avoid
            // at this browser
            execScript = null;
        }
        return this;
    }
    runCss() {
        const execCss = (toReplace) => {
            const _toReplace = DomQuery.byId(toReplace);
            const tagName = _toReplace.tagName.orElse("").value;
            let newElement = DomQuery.fromMarkup(`<${tagName.toLowerCase()} />`);
            newElement = newElement.copyAttrs(_toReplace);
            newElement.innerHTML = toReplace.innerHTML;
            // css suffices a simple replace to get it eval-ed, no need
            // for a full head replace
            _toReplace.replace(newElement);
        };
        const cssElems = new DomQuery(this.filterSelector("link, style"), this.querySelectorAll("link, style"));
        cssElems.asArray
            .flatMap(item => [...item.values])
            // sort to make sure the execution order is correct
            // this is needed because we mix 2 queries together
            // -3 is needed due to the compareDocumentPosition return value
            .sort((node1, node2) => node1.compareDocumentPosition(node2) - 3)
            .forEach(item => execCss(item));
        return this;
    }
    /**
     * fires a click event on the underlying dom elements
     */
    click() {
        this.fireEvent("click");
        return this;
    }
    addEventListener(type, listener, options) {
        this.eachElem((node) => node.addEventListener(type, listener, options));
        return this;
    }
    removeEventListener(type, listener, options) {
        this.eachElem((node) => node.removeEventListener(type, listener, options));
        return this;
    }
    /**
     * fires an event
     */
    fireEvent(eventName, options = {}) {
        // merge with last one having the highest priority
        let finalOptions = {
            bubbles: true, cancelable: true
        };
        finalOptions = simpleShallowMerge(finalOptions, options);
        this.eachElem((node) => {
            let doc;
            if (node.ownerDocument) {
                doc = node.ownerDocument;
            }
            else if (node.nodeType == 9) {
                // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
                doc = node;
            }
            else {
                throw new Error("Invalid node passed to fireEvent: " + node.id);
            }
            if (node.dispatchEvent) {
                // Gecko-style approach (now the standard) takes more work
                let EventClass = Event;
                // Different events have different event classes.
                // If this switch statement can't map an eventName to an EventClass,
                // the event firing is going to fail.
                // extend this list on demand
                switch (eventName) {
                    case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
                    case "mousedown":
                    case "mouseup":
                    case "mousemove":
                        EventClass = this.global().MouseEvent;
                        break;
                    case "keyup":
                    case "keydown":
                    case "keypress":
                        EventClass = this.global().KeyboardEvent;
                        break;
                    case "focus":
                    case "change":
                    case "blur":
                    case "select":
                        break;
                    default:
                        throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                }
                let event = new EventClass(eventName, finalOptions);
                // this is added as an extra to allow internally the detection of synthetic events
                // not used atm, but it does not hurt to have the extra info
                event.synthetic = true; // allow detection of synthetic events
                // The second parameter says go ahead with the default action
                node.dispatchEvent(event);
            }
            else if (node.fireEvent) {
                // IE-old school style, you can drop this if you don't need to support IE8 and lower
                let event = doc.createEventObject();
                event.synthetic = true; // allow detection of synthetic events
                Object.keys(finalOptions).forEach(key => event[key] = finalOptions[key]);
                node.fireEvent("on" + eventName, event);
            }
        });
    }
    textContent(joinString = "") {
        return this.asArray
            .map((value) => {
            let item = value.getAsElem(0).orElseLazy(() => {
                return {
                    textContent: ""
                };
            }).value;
            return item.textContent || "";
        })
            .reduce((text1, text2) => [text1, joinString, text2].join(""), "");
    }
    innerText(joinString = "") {
        return this.asArray
            .map((value) => {
            let item = value.getAsElem(0).orElseLazy(() => {
                return {
                    innerText: ""
                };
            }).value;
            return item.innerText || "";
        })
            .reduce((text1, text2) => {
            return [text1, text2].join(joinString);
        }, "");
    }
    /**
     * encodes all input elements properly into respective
     * config entries, this can be used
     * for legacy systems, for newer use-cases, use the
     * HTML5 Form class which all newer browsers provide
     *
     * @param toMerge optional config which can be merged in
     * @return a copy pf
     */
    encodeFormElement(toMerge = {}) {
        // browser behavior no element name no encoding (normal submit fails in that case)
        // https:// issues.apache.org/jira/browse/MYFACES-2847
        if (this.name.isAbsent()) {
            return;
        }
        // let´s keep it side-effects free
        let target = simpleShallowMerge(toMerge);
        this.each((element) => {
            var _a, _b;
            if (element.name.isAbsent()) { // no name, no encoding
                return;
            }
            let name = element.name.value;
            let tagName = element.tagName.orElse("__none__").value.toLowerCase();
            let elemType = element.type.orElse("__none__").value.toLowerCase();
            elemType = elemType.toLowerCase();
            // routine for all elements
            // rules:
            // - process only input, textarea and select elements
            // - elements must have attribute "name"
            // - elements must not be disabled
            if (((tagName == "input" || tagName == "textarea" || tagName == "select") &&
                (name != null && name != "")) && !element.disabled) {
                // routine for select elements
                // rules:
                // - if select-one and value-Attribute exist => "name=value"
                // (also if value empty => "name=")
                // - if select-one and value-Attribute don't exist =>
                // "name=DisplayValue"
                // - if select multi and multiple selected => "name=value1&name=value2"
                // - if select and selectedIndex=-1 don't submit
                if (tagName == "select") {
                    // selectedIndex must be >= 0 to be submitted
                    let selectElem = element.getAsElem(0).value;
                    if (selectElem.selectedIndex >= 0) {
                        let uLen = selectElem.options.length;
                        for (let u = 0; u < uLen; u++) {
                            // find all selected options
                            // let subBuf = [];
                            if (selectElem.options[u].selected) {
                                let elementOption = selectElem.options[u];
                                append(target, name).value = (elementOption.getAttribute("value") != null) ?
                                    elementOption.value : elementOption.text;
                            }
                        }
                    }
                }
                // routine for remaining elements
                // rules:
                // - don't submit no selects (processed above), buttons, reset buttons, submit buttons,
                // - submit checkboxes and radio inputs only if checked
                if ((tagName != ALLOWED_SUBMITTABLE_ELEMENTS.SELECT &&
                    elemType != ALLOWED_SUBMITTABLE_ELEMENTS.BUTTON &&
                    elemType != ALLOWED_SUBMITTABLE_ELEMENTS.RESET &&
                    elemType != ALLOWED_SUBMITTABLE_ELEMENTS.SUBMIT &&
                    elemType != ALLOWED_SUBMITTABLE_ELEMENTS.IMAGE) && ((elemType != ALLOWED_SUBMITTABLE_ELEMENTS.CHECKBOX && elemType != ALLOWED_SUBMITTABLE_ELEMENTS.RADIO) ||
                    element.checked)) {
                    let uploadedFiles = (_b = (_a = element.value) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.files;
                    let filesArr = uploadedFiles !== null && uploadedFiles !== void 0 ? uploadedFiles : [];
                    if (filesArr === null || filesArr === void 0 ? void 0 : filesArr.length) { //files can be empty but set
                        // xhr level2, single multiple must be passes as they are
                        assign(target, name).value = Array.from(filesArr);
                    }
                    else {
                        if (!!uploadedFiles) { //we skip empty file elements i
                            return;
                        }
                        //checkboxes etc.. need to be appended
                        append(target, name).value = element.inputValue.value;
                    }
                }
            }
        });
        return target;
    }
    get cDATAAsString() {
        let TYPE_CDATA_BLOCK = 4;
        let res = this.asArray
            .flatMap(item => {
            return item.childNodes.asArray;
        })
            .filter(item => {
            var _a, _b;
            return ((_b = (_a = item === null || item === void 0 ? void 0 : item.value) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.nodeType) == TYPE_CDATA_BLOCK;
        })
            .reduce((reduced, item) => {
            var _a, _b, _c;
            reduced.push((_c = (_b = (_a = item === null || item === void 0 ? void 0 : item.value) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : "");
            return reduced;
        }, []);
        /*let res: any = this.lazyStream.flatMap(item => {
            return item.childNodes.stream
        }).filter(item => {
            return item?.value?.value?.nodeType == TYPE_CDATA_BLOCK;
        }).reduce((reduced: Array<any>, item: DomQuery) => {
            reduced.push((<any>item?.value?.value)?.data ?? "");
            return reduced;
        }, []).value;*/
        // response may contain several blocks
        return res.join("");
    }
    subNodes(from, to) {
        if (Optional.fromNullable(to).isAbsent()) {
            to = this.length;
        }
        return new DomQuery(...this.rootNode.slice(from, Math.min(to, this.length)));
    }
    limits(end) {
        this._limits = end;
        return this;
    }
    //-- internally exposed methods needed for the interconnectivity
    hasNext() {
        let isLimitsReached = this._limits != -1 && this.pos >= this._limits - 1;
        let isEndOfArray = this.pos >= this.values.length - 1;
        return !(isLimitsReached ||
            isEndOfArray);
    }
    next() {
        if (!this.hasNext()) {
            return null;
        }
        this.pos++;
        return new DomQuery(this.values[this.pos]);
    }
    lookAhead(cnt = 1) {
        if ((this.values.length - 1) < (this.pos + cnt)) {
            return ITERATION_STATUS.EO_STRM;
        }
        return new DomQuery(this.values[this.pos + cnt]);
    }
    current() {
        if (this.pos == -1) {
            return ITERATION_STATUS.BEF_STRM;
        }
        return new DomQuery(this.values[this.pos]);
    }
    reset() {
        this.pos = -1;
    }
    attachShadow(params = { mode: "open" }) {
        let shadowRoots = [];
        this.eachElem((item) => {
            let shadowElement;
            if (item === null || item === void 0 ? void 0 : item.attachShadow) {
                shadowElement = DomQuery.byId(item.attachShadow(params));
                shadowRoots.push(shadowElement);
            }
            else {
                throw new Error("Shadow dom creation not supported by the browser, please use a shim, to gain this functionality");
            }
        });
        return new DomQuery(...shadowRoots);
    }
    /**
     * helper to fix a common dom problem
     * we have to wait until a certain condition is met, in most of the cases we just want to know whether an element is present in the sub dom-tree before being able to proceed
     * @param condition
     * @param options
     */
    async waitUntilDom(condition, options = {
        attributes: true,
        childList: true,
        subtree: true,
        timeout: 500,
        interval: 100
    }) {
        return waitUntilDom(this, condition, options);
    }
    /**
     * returns the embedded shadow elements
     */
    get shadowElements() {
        let shadowElements = this.querySelectorAll("*")
            .filter(item => item.hasShadow);
        let mapped = (shadowElements.allElems() || []).map(element => element.shadowRoot);
        return new DomQuery(...mapped);
    }
    get shadowRoot() {
        let shadowRoots = [];
        for (let cnt = 0; cnt < this.rootNode.length; cnt++) {
            if (this.rootNode[cnt].shadowRoot) {
                shadowRoots.push(this.rootNode[cnt].shadowRoot);
            }
        }
        return new DomQuery(...shadowRoots);
    }
    get hasShadow() {
        for (let cnt = 0; cnt < this.rootNode.length; cnt++) {
            if (this.rootNode[cnt].shadowRoot) {
                return true;
            }
        }
        return false;
    }
    // from
    // http:// blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
    static getCaretPosition(ctrl) {
        let caretPos = 0;
        try {
            if (document === null || document === void 0 ? void 0 : document.selection) {
                ctrl.focus();
                let selection = document.selection.createRange();
                // the selection now is start zero
                selection.moveStart('character', -ctrl.value.length);
                // the caret-position is the selection start
                caretPos = selection.text.length;
            }
        }
        catch (e) {
            // now this is ugly, but not supported input types throw errors for selectionStart
            // just in case someone dumps this code onto unsupported browsers
        }
        return caretPos;
    }
    /**
     * sets the caret position
     *
     * @param ctrl the control to set the caret position to
     * @param pos the position to set
     *
     * note if the control does not have any selectable and focusable behavior
     * calling this method does nothing (silent fail)
     *
     */
    static setCaretPosition(ctrl, pos) {
        (ctrl === null || ctrl === void 0 ? void 0 : ctrl.focus) ? ctrl === null || ctrl === void 0 ? void 0 : ctrl.focus() : null;
        // the selection range is our caret position
        (ctrl === null || ctrl === void 0 ? void 0 : ctrl.setSelectiongRange) ? ctrl === null || ctrl === void 0 ? void 0 : ctrl.setSelectiongRange(pos, pos) : null;
    }
    /**
     * Implementation of an iterator
     * to allow loops over dom query collections
     */
    [Symbol.iterator]() {
        return {
            next: () => {
                let done = !this.hasNext();
                let val = this.next();
                return {
                    done: done,
                    value: val
                };
            }
        };
    }
    /**
     * Concatenates the elements of two Dom Queries into a single one
     * @param toAttach the elements to attach
     * @param filterDoubles filter out possible double elements (aka same markup)
     */
    concat(toAttach, filterDoubles = true) {
        let domQueries = this.asArray;
        const ret = new DomQuery(...domQueries.concat(toAttach.asArray));
        // we now filter the doubles out
        if (!filterDoubles) {
            return ret;
        }
        let idx = {}; // ie11 does not support sets, we have to fake it
        return new DomQuery(...ret.asArray.filter(node => {
            const notFound = !(idx === null || idx === void 0 ? void 0 : idx[node.value.value.outerHTML]);
            idx[node.value.value.outerHTML] = true;
            return notFound;
        }));
    }
    append(elem) {
        this.each(item => elem.appendTo(item));
        return this;
    }
    prependTo(elem) {
        elem.eachElem(item => {
            item.prepend(...this.allElems());
        });
        return this;
    }
    prepend(elem) {
        this.eachElem(item => {
            item.prepend(...elem.allElems());
        });
        return this;
    }
    /**
     * query selector all on the existing dom queryX object
     *
     * @param selector the standard selector
     * @return a DomQuery with the results
     */
    _querySelectorAll(selector) {
        var _a, _b;
        if (!((_a = this === null || this === void 0 ? void 0 : this.rootNode) === null || _a === void 0 ? void 0 : _a.length)) {
            return this;
        }
        let nodes = [];
        for (let cnt = 0; cnt < this.rootNode.length; cnt++) {
            if (!((_b = this.rootNode[cnt]) === null || _b === void 0 ? void 0 : _b.querySelectorAll)) {
                continue;
            }
            let res = this.rootNode[cnt].querySelectorAll(selector);
            nodes = nodes.concat(...objToArray(res));
        }
        return new DomQuery(...nodes);
    }
    /*deep with a selector and a pseudo /shadow/ marker to break into the next level*/
    _querySelectorAllDeep(selector) {
        var _a;
        if (!((_a = this === null || this === void 0 ? void 0 : this.rootNode) === null || _a === void 0 ? void 0 : _a.length)) {
            return this;
        }
        let foundNodes = new DomQuery(...this.rootNode);
        let selectors = selector.split(/\/shadow\//);
        for (let cnt2 = 0; cnt2 < selectors.length; cnt2++) {
            if (selectors[cnt2] == "") {
                continue;
            }
            let levelSelector = selectors[cnt2];
            foundNodes = foundNodes.querySelectorAll(levelSelector);
            if (cnt2 < selectors.length - 1) {
                foundNodes = foundNodes.shadowRoot;
            }
        }
        return foundNodes;
    }
    /**
     * query selector all on the existing dom queryX object
     *
     * @param selector the standard selector
     * @return a DomQuery with the results
     */
    _closest(selector) {
        var _a, _b;
        if (!((_a = this === null || this === void 0 ? void 0 : this.rootNode) === null || _a === void 0 ? void 0 : _a.length)) {
            return this;
        }
        let nodes = [];
        for (let cnt = 0; cnt < this.rootNode.length; cnt++) {
            if (!((_b = this.rootNode[cnt]) === null || _b === void 0 ? void 0 : _b.closest)) {
                continue;
            }
            let res = [this.rootNode[cnt].closest(selector)];
            nodes = nodes.concat(...res);
        }
        return new DomQuery(...nodes);
    }
    /*deep with a selector and a pseudo /shadow/ marker to break into the next level*/
    _closestDeep(selector) {
        var _a;
        if (!((_a = this === null || this === void 0 ? void 0 : this.rootNode) === null || _a === void 0 ? void 0 : _a.length)) {
            return this;
        }
        let foundNodes = new DomQuery(...this.rootNode);
        let selectors = selector.split(/\/shadow\//);
        for (let cnt2 = 0; cnt2 < selectors.length; cnt2++) {
            if (selectors[cnt2] == "") {
                continue;
            }
            let levelSelector = selectors[cnt2];
            foundNodes = foundNodes.closest(levelSelector);
            if (cnt2 < selectors.length - 1) {
                foundNodes = foundNodes.shadowRoot;
            }
        }
        return foundNodes;
    }
    // source: https:// developer.mozilla.org/en-US/docs/Web/API/Element/matches
    // code snippet license: https:// creativecommons.org/licenses/by-sa/2.5/
    /**
     * matches selector call in a browser independent manner
     *
     * @param toMatch
     * @param selector
     * @private
     */
    _mozMatchesSelector(toMatch, selector) {
        let prototypeOwner = toMatch;
        let matchesSelector = prototypeOwner.matches ||
            prototypeOwner.matchesSelector ||
            prototypeOwner.mozMatchesSelector ||
            prototypeOwner.msMatchesSelector ||
            prototypeOwner.oMatchesSelector ||
            prototypeOwner.webkitMatchesSelector ||
            function (s) {
                let matches = (document || ownerDocument).querySelectorAll(s), i = matches.length;
                while (--i >= 0 && matches.item(i) !== toMatch) {
                }
                return i > -1;
            };
        return matchesSelector.call(toMatch, selector);
    }
    /**
     * sticky non-sticky unified code of the load script eval
     * implementation if programmatic &gt;script src="... loading
     *
     * @param sticky if set to true a head element is left in the dom tree after the script has loaded
     *
     * @param src the sec to load
     * @param delay delay the script loading x ms (default immediately === 0)
     * @param nonce optional nonce token to be passed into the script tag
     * @private
     */
    _loadScriptEval(sticky, src, delay = 0, nonce) {
        let srcNode = this.createSourceNode(src, nonce);
        let nonceCheck = this.createSourceNode(null, nonce);
        let marker = `nonce_${Date.now()}_${Math.random()}`;
        nonceCheck.innerHTML = `document.head["${marker}"] = true`; // noop
        let head = document.head;
        //  upfront nonce check, needed mostly for testing
        //  but cannot hurt to block src calls which have invalid nonce on localhost
        // the reason for doing this up until now we have a similar construct automatically
        // by loading the scripts via xhr and then embedding them.
        // this is not needed anymore but the nonce is more relaxed with script src
        // we now enforce it the old way
        head.appendChild(nonceCheck);
        head.removeChild(nonceCheck);
        if (!head[marker]) {
            return;
        }
        try {
            if (!delay) {
                head.appendChild(srcNode);
                if (!sticky) {
                    head.removeChild(srcNode);
                }
            }
            else {
                setTimeout(() => {
                    head.appendChild(srcNode);
                    if (!sticky) {
                        head.removeChild(srcNode);
                    }
                }, delay);
            }
        }
        finally {
            delete head[marker];
        }
        return this;
    }
    /**
     * resolves an attribute holder compared
     * @param attrName the attribute name
     */
    resolveAttributeHolder(attrName = "value") {
        let ret = [];
        ret[attrName] = null;
        return (attrName in this.getAsElem(0).value) ?
            this.getAsElem(0).value :
            ret;
    }
    createSourceNode(src, nonce) {
        let srcNode = document.createElement("script");
        srcNode.type = "text/javascript";
        if (!!nonce) {
            if ('undefined' != typeof (srcNode === null || srcNode === void 0 ? void 0 : srcNode.nonce)) {
                srcNode.nonce = nonce;
            }
            else {
                srcNode.setAttribute("nonce", nonce);
            }
        }
        if (!!src) {
            srcNode.src = src;
        }
        return srcNode;
    }
    applyNonce(nonce, script) {
        if (nonce) {
            if ('undefined' != typeof (script === null || script === void 0 ? void 0 : script.nonce)) {
                script.nonce = nonce;
            }
            else {
                script.setAttribute("nonce", nonce);
            }
        }
    }
}
DomQuery.absent = new DomQuery();
/**
 * reference to the environmental global object
 */
DomQuery.global = _global$;
/**
 * Various collectors
 * which can be used in conjunction with Streams
 */
/**
 * A collector which bundles a full dom query stream into a single dom query element
 *
 * This connects basically our stream back into DomQuery
 */
export class DomQueryCollector {
    constructor() {
        this.data = [];
    }
    collect(element) {
        this.data.push(element);
    }
    get finalValue() {
        return new DomQuery(...this.data);
    }
}
/**
 * abbreviation for DomQuery
 */
export const DQ = DomQuery;
// noinspection JSUnusedGlobalSymbols
/**
 * replacement for the jquery $
 */
export const DQ$ = DomQuery.querySelectorAll;
//# sourceMappingURL=DomQuery.js.map