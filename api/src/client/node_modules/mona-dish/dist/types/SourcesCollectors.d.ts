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
import { Config } from "./Config";
/**
 * special status of the datasource location pointer
 * if an access, outside - of the possible data boundaries is happening
 * (example for instance current without a first next call, or next
 * which goes over the last possible dataset), an iteration status return
 * value is returned marking this boundary instead of a classical element
 *
 * Note this is only internally used but must be implemented to fulfill
 * internal contracts, the end user will never see those values if he uses
 * streams!
 */
export declare enum ITERATION_STATUS {
    EO_STRM = "__EO_STRM__",
    BEF_STRM = "___BEF_STRM__"
}
export declare function calculateSkips(next_strm: IStreamDataSource<any>): number;
/**
 * Every data source wich feeds data into the lazy stream
 * or stream generally must implement this interface
 *
 * It is basically an iteratable to the core
 */
export interface IStreamDataSource<T> {
    /**
     * @returns true if additional data is present false if not
     */
    hasNext(): boolean;
    /**
     * returns the next element in the stream
     */
    next(): T | ITERATION_STATUS;
    /**
     * looks ahead cnt without changing the internal data "pointers" of the data source
     * (this is mostly needed by possibly infinite constructs like lazy streams,
     * because they do not know by definition their
     * boundaries)
     *
     * @param cnt the elements to look ahead
     * @return either the element or ITERATION_STATUS.EO_STRM if we hit the end of the stream before
     * finding the "cnt" element
     */
    lookAhead(cnt?: number): T | ITERATION_STATUS;
    /**
     * returns the current element, returns the same element as the previous next call
     * if there is no next before current called then we will call next as initial element
     */
    current(): T | ITERATION_STATUS;
    /**
     * resets the position to the beginning
     */
    reset(): void;
}
/**
 * A collector, needs to be implemented
 */
export interface ICollector<T, S> {
    /**
     * this method basically takes a single stream element
     * and does something with it (collecting it one way or the other
     * in most cases)
     *
     * @param element
     */
    collect(element: T): any;
    /**
     * the final result after all the collecting is done
     */
    finalValue: S;
}
/**
 * A data source which combines multiple streams sequentially into one
 * (this is used internally by  flatmap, but also can be used externally)
 */
export declare class MultiStreamDatasource<T> implements IStreamDataSource<T> {
    private first;
    private activeStrm;
    private selectedPos;
    private strms;
    constructor(first: any, ...strms: Array<IStreamDataSource<T>>);
    current(): any;
    hasNext(): boolean;
    private findNextStrm;
    lookAhead(cnt?: number): T | ITERATION_STATUS;
    next(): any;
    reset(): void;
}
/**
 * defines a sequence of numbers for our stream input
 */
export declare class SequenceDataSource implements IStreamDataSource<number> {
    start: number;
    total: number;
    value: number;
    constructor(start: number, total: number);
    hasNext(): boolean;
    next(): number | ITERATION_STATUS;
    lookAhead(cnt?: number): number | ITERATION_STATUS;
    reset(): void;
    current(): number | ITERATION_STATUS;
}
/**
 * implementation of a datasource on top of a standard array
 */
export declare class ArrayStreamDataSource<T> implements IStreamDataSource<T> {
    value: Array<T>;
    dataPos: number;
    constructor(...value: Array<T>);
    lookAhead(cnt?: number): T | ITERATION_STATUS;
    hasNext(): boolean;
    next(): T | ITERATION_STATUS;
    reset(): void;
    current(): T;
}
/**
 * an intermediate data source which prefilters
 * incoming stream data
 * and lets only the data out which
 * passes the filter function check
 */
export declare class FilteredStreamDatasource<T> implements IStreamDataSource<T> {
    filterFunc: (T: any) => boolean;
    inputDataSource: IStreamDataSource<T>;
    _current: T | ITERATION_STATUS;
    _filterIdx: {};
    _unfilteredPos: number;
    constructor(filterFunc: (T: any) => boolean, parent: IStreamDataSource<T>);
    /**
     * in order to filter we have to make a look ahead until the
     * first next allowed element
     * hence we prefetch the element and then
     * serve it via next
     */
    hasNext(): boolean;
    /**
     * serve the next element
     */
    next(): T | ITERATION_STATUS;
    /**
     * looks ahead cnt without changing the internal data "pointers" of the data source
     * (this is mostly needed by LazyStreams, because they do not know by definition their
     * boundaries)
     *
     * @param cnt the elements to look ahead
     * @return either the element or ITERATION_STATUS.EO_STRM if we hit the end of the stream before
     * finding the "cnt" element
     */
    lookAhead(cnt?: number): ITERATION_STATUS | T;
    current(): T | ITERATION_STATUS;
    reset(): void;
}
/**
 * an intermediate datasource which maps the items from
 * one into another
 */
export declare class MappedStreamDataSource<T, S> implements IStreamDataSource<S> {
    mapFunc: (T: any) => S;
    inputDataSource: IStreamDataSource<T>;
    constructor(mapFunc: (T: any) => S, parent: IStreamDataSource<T>);
    hasNext(): boolean;
    next(): S;
    reset(): void;
    current(): S;
    lookAhead(cnt?: number): ITERATION_STATUS | S;
}
/**
 * For the time being we only need one collector
 * a collector which collects a stream back into arrays
 */
export declare class ShimArrayCollector<S> implements ICollector<S, Array<S>> {
    private data;
    collect(element: S): void;
    get finalValue(): Array<S>;
}
/**
 * collects the values as inverse array
 */
export declare class InverseArrayCollector<S> implements ICollector<S, Array<S>> {
    private data;
    collect(element: S): void;
    get finalValue(): Array<S>;
}
/**
 * collects an tuple array stream into an assoc array with elements being collected into arrays
 *
 */
export declare class ArrayAssocArrayCollector<S> implements ICollector<[string, S] | string, {
    [key: string]: S;
}> {
    finalValue: {
        [key: string]: any;
    };
    collect(element: [string, S] | string): void;
}
/**
 * dummy collector which just triggers a run
 * on lazy streams without collecting anything
 */
export declare class Run<S> implements ICollector<S, any> {
    collect(element: S): void;
    get finalValue(): any;
}
/**
 * collects an assoc stream back to an assoc array
 */
export declare class AssocArrayCollector<S> implements ICollector<[string, S] | string, {
    [key: string]: S;
}> {
    finalValue: {
        [key: string]: any;
    };
    collect(element: [string, S] | string): void;
}
/**
 * A Config collector similar to the FormDFata Collector
 */
export declare class ConfigCollector implements ICollector<{
    key: string;
    value: any;
}, Config> {
    finalValue: Config;
    collect(element: {
        key: string;
        value: any;
    }): void;
}
/**
 * Form data collector for key value pair streams
 */
export declare class FormDataCollector implements ICollector<{
    key: string;
    value: any;
}, FormData> {
    finalValue: FormData;
    collect(element: {
        key: string;
        value: any;
    }): void;
}
/**
 * Form data collector for DomQuery streams
 */
export declare class QueryFormDataCollector implements ICollector<DomQuery, FormData> {
    finalValue: FormData;
    collect(element: DomQuery): void;
}
/**
 * Encoded String collector from dom query streams
 */
export declare class QueryFormStringCollector implements ICollector<DomQuery, string> {
    formData: [[string, string]];
    collect(element: DomQuery): void;
    get finalValue(): string;
}
/**
 * For the time being we only need one collector
 * a collector which collects a stream back into arrays
 */
export declare class ArrayCollector<S> implements ICollector<S, Array<S>> {
    private data;
    collect(element: S): void;
    get finalValue(): Array<S>;
}
