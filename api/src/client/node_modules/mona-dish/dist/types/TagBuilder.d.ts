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
export declare class TagBuilder {
    tagName: string;
    connectedCallback?: Function;
    clazz?: CustomElementConstructor;
    extendsType: CustomElementConstructor;
    theOptions: ElementDefinitionOptions | null;
    markup: string;
    disconnectedCallback?: Function;
    adoptedCallback?: Function;
    attributeChangedCallback?: Function;
    observedAttrs: string[];
    static withTagName(tagName: any): TagBuilder;
    constructor(tagName: string);
    withObservedAttributes(...oAttrs: any[]): void;
    withConnectedCallback(callback: Function): this;
    withDisconnectedCallback(callback: Function): this;
    withAdoptedCallback(callback: Function): this;
    withAttributeChangedCallback(callback: Function): this;
    withExtendsType(extendsType: CustomElementConstructor): this;
    withOptions(theOptions: any): this;
    withClass(clazz: any): this;
    withMarkup(markup: any): this;
    register(): void;
}
