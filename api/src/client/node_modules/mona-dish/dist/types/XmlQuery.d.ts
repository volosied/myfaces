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
import { DomQuery } from "./DomQuery";
/**
 * xml query as specialized case for DomQuery
 */
export declare class XMLQuery extends DomQuery {
    constructor(rootNode: Document | string | DomQuery, docType?: string);
    isXMLParserError(): boolean;
    toString(): string;
    parserErrorText(joinstr: string): string;
    static parseXML(txt: string): XMLQuery;
    static parseHTML(txt: string): XMLQuery;
    static fromString(txt: string, parseType?: string): XMLQuery;
}
export declare const XQ: typeof XMLQuery;
export type XQ = XMLQuery;
