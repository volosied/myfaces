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
import { Lang } from "./Lang";
import { DomQuery } from "./DomQuery";
var isString = Lang.isString;
import { _global$ } from "./Global";
/**
 * xml query as specialized case for DomQuery
 */
export class XMLQuery extends DomQuery {
    constructor(rootNode, docType = "text/xml") {
        let createIe11DomQueryShim = () => {
            //at the time if wroting ie11 is the only relevant browser
            //left withut any DomQuery support
            let parser = new ActiveXObject("Microsoft.XMLDOM");
            parser.async = false;
            //we shim th dom parser from ie in
            return {
                parseFromString: (text, contentType) => {
                    return parser.loadXML(text);
                }
            };
        };
        let parseXML = (xml) => {
            if (xml == null) {
                return null;
            }
            let domParser = Lang.saveResolveLazy(() => new (_global$()).DOMParser(), () => createIe11DomQueryShim()).value;
            return domParser.parseFromString(xml, docType);
        };
        if (isString(rootNode)) {
            super(parseXML(rootNode));
        }
        else {
            super(rootNode);
        }
    }
    isXMLParserError() {
        return this.querySelectorAll("parsererror").isPresent();
    }
    toString() {
        let ret = [];
        this.eachElem((node) => {
            var _a, _b, _c, _d;
            let serialized = (_d = (_c = (_b = (_a = (_global$())) === null || _a === void 0 ? void 0 : _a.XMLSerializer) === null || _b === void 0 ? void 0 : _b.constructor()) === null || _c === void 0 ? void 0 : _c.serializeToString(node)) !== null && _d !== void 0 ? _d : node === null || node === void 0 ? void 0 : node.xml;
            if (!!serialized) {
                ret.push(serialized);
            }
        });
        return ret.join("");
    }
    parserErrorText(joinstr) {
        return this.querySelectorAll("parsererror").textContent(joinstr);
    }
    static parseXML(txt) {
        return new XMLQuery(txt);
    }
    static parseHTML(txt) {
        return new XMLQuery(txt, "text/html");
    }
    static fromString(txt, parseType = "text/xml") {
        return new XMLQuery(txt, parseType);
    }
}
export const XQ = XMLQuery;
//# sourceMappingURL=XmlQuery.js.map