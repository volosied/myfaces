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
/*
 * A small stream implementation
 */
import { Optional } from "./Monad";
import { ArrayCollector, ArrayStreamDataSource, calculateSkips, FilteredStreamDatasource, ITERATION_STATUS, MappedStreamDataSource, MultiStreamDatasource } from "./SourcesCollectors";
import { DomQuery } from "./DomQuery";
/**
 * Same for flatmap to deal with element -> stream mappings
 */
export class FlatMapStreamDataSource {
    constructor(func, parent) {
        this.walkedDataSources = [];
        this._currPos = 0;
        this.mapFunc = func;
        this.inputDataSource = parent;
    }
    hasNext() {
        return this.resolveActiveHasNext() || this.resolveNextHasNext();
    }
    resolveActiveHasNext() {
        let next = false;
        if (this.activeDataSource) {
            next = this.activeDataSource.hasNext();
        }
        return next;
    }
    lookAhead(cnt = 1) {
        var _a;
        let lookAhead = (_a = this === null || this === void 0 ? void 0 : this.activeDataSource) === null || _a === void 0 ? void 0 : _a.lookAhead(cnt);
        if ((this === null || this === void 0 ? void 0 : this.activeDataSource) && lookAhead != ITERATION_STATUS.EO_STRM) {
            //this should cover 95% of all cases
            return lookAhead;
        }
        if (this.activeDataSource) {
            cnt -= calculateSkips(this.activeDataSource);
        }
        //the idea is basically to look into the streams sub-sequentially for a match
        //after each stream we have to take into consideration that the skipCnt is
        //reduced by the number of datasets we already have looked into in the previous stream/datasource
        //unfortunately for now we have to loop into them, so we introduce a small o2 here
        for (let dsLoop = 1; true; dsLoop++) {
            let datasourceData = this.inputDataSource.lookAhead(dsLoop);
            //we have looped out
            //no embedded data anymore? we are done, data
            //can either be a scalar an array or another datasource
            if (datasourceData === ITERATION_STATUS.EO_STRM) {
                return ITERATION_STATUS.EO_STRM;
            }
            let mappedData = this.mapFunc(datasourceData);
            //it either comes in as datasource or as array
            //both cases must be unified into a datasource
            let currentDataSource = this.toDatasource(mappedData);
            //we now run again  a lookahead
            let ret = currentDataSource.lookAhead(cnt);
            //if the value is found then we are set
            if (ret != ITERATION_STATUS.EO_STRM) {
                return ret;
            }
            //reduce the next lookahead by the number of elements
            //we are now skipping in the current data source
            cnt -= calculateSkips(currentDataSource);
        }
    }
    toDatasource(mapped) {
        let ds = Array.isArray(mapped) ? new ArrayStreamDataSource(...mapped) : mapped;
        this.walkedDataSources.push(ds);
        return ds;
    }
    resolveNextHasNext() {
        let next = false;
        while (!next && this.inputDataSource.hasNext()) {
            let mapped = this.mapFunc(this.inputDataSource.next());
            this.activeDataSource = this.toDatasource(mapped);
            next = this.activeDataSource.hasNext();
        }
        return next;
    }
    next() {
        if (this.hasNext()) {
            this._currPos++;
            return this.activeDataSource.next();
        }
    }
    reset() {
        this.inputDataSource.reset();
        this.walkedDataSources.forEach(ds => ds.reset());
        this.walkedDataSources = [];
        this._currPos = 0;
        this.activeDataSource = null;
    }
    current() {
        if (!this.activeDataSource) {
            this.hasNext();
        }
        return this.activeDataSource.current();
    }
}
/**
 * A simple typescript based reimplementation of streams
 *
 * This is the early eval version
 * for a lazy eval version check, LazyStream, which is api compatible
 * to this implementation, however with the benefit of being able
 * to provide infinite data sources and generic data providers, the downside
 * is, it might be a tad slower in some situations
 */
export class Stream {
    constructor(...value) {
        this._limits = -1;
        this.pos = -1;
        this.value = value;
    }
    static of(...data) {
        return new Stream(...data);
    }
    static ofAssoc(data) {
        return this.of(...Object.keys(data)).map(key => [key, data[key]]);
    }
    static ofDataSource(dataSource) {
        let value = [];
        while (dataSource.hasNext()) {
            value.push(dataSource.next());
        }
        return new Stream(...value);
    }
    static ofDomQuery(value) {
        return Stream.of(...value.asArray);
    }
    static ofConfig(value) {
        return Stream.of(...Object.keys(value.value)).map(key => [key, value.value[key]]);
    }
    current() {
        if (this.pos == -1) {
            return ITERATION_STATUS.BEF_STRM;
        }
        if (this.pos >= this.value.length) {
            return ITERATION_STATUS.EO_STRM;
        }
        return this.value[this.pos];
    }
    limits(end) {
        this._limits = end;
        return this;
    }
    /**
     * concat for streams, so that you can concat two streams together
     * @param toAppend
     */
    concat(...toAppend) {
        let toConcat = [this].concat(toAppend);
        return Stream.of(...toConcat).flatMap(item => item);
    }
    onElem(fn) {
        for (let cnt = 0; cnt < this.value.length && (this._limits == -1 || cnt < this._limits); cnt++) {
            if (fn(this.value[cnt], cnt) === false) {
                break;
            }
        }
        return this;
    }
    each(fn) {
        this.onElem(fn);
        this.reset();
    }
    map(fn) {
        if (!fn) {
            fn = (inval) => inval;
        }
        let res = [];
        this.each((item) => {
            res.push(fn(item));
        });
        return new Stream(...res);
    }
    /*
     * we need to implement it to fullfill the contract, although it is used only internally
     * all values are flattened when accessed anyway, so there is no need to call this methiod
     */
    flatMap(fn) {
        let ret = [];
        this.each(item => {
            let strmR = fn(item);
            ret = Array.isArray(strmR) ? ret.concat(strmR) : ret.concat(strmR.value);
        });
        return Stream.of(...ret);
    }
    filter(fn) {
        let res = [];
        this.each((data) => {
            if (fn(data)) {
                res.push(data);
            }
        });
        return new Stream(...res);
    }
    reduce(fn, startVal = null) {
        let offset = startVal != null ? 0 : 1;
        let val1 = startVal != null ? startVal : this.value.length ? this.value[0] : null;
        for (let cnt = offset; cnt < this.value.length && (this._limits == -1 || cnt < this._limits); cnt++) {
            val1 = fn(val1, this.value[cnt]);
        }
        this.reset();
        return Optional.fromNullable(val1);
    }
    first() {
        this.reset();
        return this.value && this.value.length ? Optional.fromNullable(this.value[0]) : Optional.absent;
    }
    last() {
        //could be done via reduce, but is faster this way
        let length = this._limits > 0 ? Math.min(this._limits, this.value.length) : this.value.length;
        this.reset();
        return Optional.fromNullable(length ? this.value[length - 1] : null);
    }
    anyMatch(fn) {
        for (let cnt = 0; cnt < this.value.length && (this._limits == -1 || cnt < this._limits); cnt++) {
            if (fn(this.value[cnt])) {
                return true;
            }
        }
        this.reset();
        return false;
    }
    allMatch(fn) {
        if (!this.value.length) {
            return false;
        }
        let matches = 0;
        for (let cnt = 0; cnt < this.value.length; cnt++) {
            if (fn(this.value[cnt])) {
                matches++;
            }
        }
        this.reset();
        return matches == this.value.length;
    }
    noneMatch(fn) {
        let matches = 0;
        for (let cnt = 0; cnt < this.value.length; cnt++) {
            if (!fn(this.value[cnt])) {
                matches++;
            }
        }
        this.reset();
        return matches == this.value.length;
    }
    sort(comparator) {
        let newArr = this.value.slice().sort(comparator);
        return Stream.of(...newArr);
    }
    collect(collector) {
        this.each(data => collector.collect(data));
        this.reset();
        return collector.finalValue;
    }
    //-- internally exposed methods needed for the interconnectivity
    hasNext() {
        let isLimitsReached = this._limits != -1 && this.pos >= this._limits - 1;
        let isEndOfArray = this.pos >= this.value.length - 1;
        return !(isLimitsReached || isEndOfArray);
    }
    next() {
        if (!this.hasNext()) {
            return null;
        }
        this.pos++;
        return this.value[this.pos];
    }
    lookAhead(cnt = 1) {
        if ((this.pos + cnt) >= this.value.length) {
            return ITERATION_STATUS.EO_STRM;
        }
        return this.value[this.pos + cnt];
    }
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
    /*get observable(): Observable<T> {
        return from(this);
    }*/
    reset() {
        this.pos = -1;
    }
}
/**
 * Lazy implementation of a Stream
 * The idea is to connect the intermediate
 * streams as datasources like a linked list
 * with reverse referencing and for special
 * operations like filtering flatmapping
 * have intermediate datasources in the list
 * with specialized functions.
 *
 * Sort of a modified pipe valve pattern
 * the streams are the pipes the intermediate
 * data sources are the valves
 *
 * We then can use passed in functions to control
 * the flow in the valves
 *
 * That way we can have a lazy evaluating stream
 *
 * So if an endpoint requests data
 * a callback trace goes back the stream list
 * which triggers an operation upwards
 * which sends data down the drain which then is processed
 * and filtered until one element hits the endpoint.
 *
 * That is repeated, until all elements are processed
 * or an internal limit is hit.
 *
 */
export class LazyStream {
    static of(...values) {
        return new LazyStream(new ArrayStreamDataSource(...values));
    }
    static ofAssoc(data) {
        return this.of(...Object.keys(data)).map(key => [key, data[key]]);
    }
    static ofStreamDataSource(value) {
        return new LazyStream(value);
    }
    static ofDomQuery(value) {
        return LazyStream.of(...value.asArray);
    }
    static ofConfig(value) {
        return LazyStream.of(...Object.keys(value.value)).map(key => [key, value.value[key]]);
    }
    constructor(parent) {
        this._limits = -1;
        /*
         * needed to have the limits check working
         * we need to keep track of the current position
         * in the stream
         */
        this.pos = -1;
        this.dataSource = parent;
    }
    hasNext() {
        if (this.isOverLimits()) {
            return false;
        }
        return this.dataSource.hasNext();
    }
    next() {
        let next = this.dataSource.next();
        // @ts-ignore
        this.pos++;
        return next;
    }
    lookAhead(cnt = 1) {
        return this.dataSource.lookAhead(cnt);
    }
    current() {
        return this.dataSource.current();
    }
    reset() {
        this.dataSource.reset();
        this.pos = -1;
        this._limits = -1;
    }
    /**
     * concat for streams, so that you can concat two streams together
     * @param toAppend
     */
    concat(...toAppend) {
        //this.dataSource =  new MultiStreamDatasource<T>(this, ... toAppend);
        //return this;
        return LazyStream.ofStreamDataSource(new MultiStreamDatasource(this, toAppend));
        //return LazyStream.of(<IStream<T>>this, ...toAppend).flatMap(item => item);
    }
    nextFilter(fn) {
        if (this.hasNext()) {
            let newVal = this.next();
            if (!fn(newVal)) {
                return this.nextFilter(fn);
            }
            return newVal;
        }
        return null;
    }
    limits(max) {
        this._limits = max;
        return this;
    }
    //main stream methods
    collect(collector) {
        while (this.hasNext()) {
            let t = this.next();
            collector.collect(t);
        }
        this.reset();
        return collector.finalValue;
    }
    onElem(fn) {
        return new LazyStream(new MappedStreamDataSource((el) => {
            if (fn(el, this.pos) === false) {
                this.stop();
            }
            return el;
        }, this));
    }
    filter(fn) {
        return new LazyStream(new FilteredStreamDatasource(fn, this));
    }
    map(fn) {
        return new LazyStream(new MappedStreamDataSource(fn, this));
    }
    flatMap(fn) {
        return new LazyStream(new FlatMapStreamDataSource(fn, this));
    }
    //endpoint
    each(fn) {
        while (this.hasNext()) {
            if (fn(this.next()) === false) {
                this.stop();
            }
        }
        this.reset();
    }
    reduce(fn, startVal = null) {
        if (!this.hasNext()) {
            return Optional.absent;
        }
        let value1;
        let value2 = null;
        if (startVal != null) {
            value1 = startVal;
            value2 = this.next();
        }
        else {
            value1 = this.next();
            if (!this.hasNext()) {
                return Optional.fromNullable(value1);
            }
            value2 = this.next();
        }
        value1 = fn(value1, value2);
        while (this.hasNext()) {
            value2 = this.next();
            value1 = fn(value1, value2);
        }
        this.reset();
        return Optional.fromNullable(value1);
    }
    last() {
        if (!this.hasNext()) {
            return Optional.absent;
        }
        return this.reduce((el1, el2) => el2);
    }
    first() {
        this.reset();
        if (!this.hasNext()) {
            return Optional.absent;
        }
        return Optional.fromNullable(this.next());
    }
    anyMatch(fn) {
        while (this.hasNext()) {
            if (fn(this.next())) {
                return true;
            }
        }
        return false;
    }
    allMatch(fn) {
        while (this.hasNext()) {
            if (!fn(this.next())) {
                return false;
            }
        }
        return true;
    }
    noneMatch(fn) {
        while (this.hasNext()) {
            if (fn(this.next())) {
                return false;
            }
        }
        return true;
    }
    sort(comparator) {
        let arr = this.collect(new ArrayCollector());
        arr = arr.sort(comparator);
        return LazyStream.of(...arr);
    }
    get value() {
        return this.collect(new ArrayCollector());
    }
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
    /*get observable(): Observable<T> {
        return from(this);
    }*/
    stop() {
        this.pos = this._limits + 1000000000;
        this._limits = 0;
    }
    isOverLimits() {
        return this._limits != -1 && this.pos >= this._limits - 1;
    }
}
/**
 * 1.0 backwards compatibility functions
 *
 * this restores the stream and lazy stream
 * property on DomQuery on prototype level
 *
 */
Object.defineProperty(DomQuery.prototype, "stream", {
    get: function stream() {
        return Stream.ofDomQuery(this);
    }
});
Object.defineProperty(DomQuery.prototype, "lazyStream", {
    get: function lazyStream() {
        return LazyStream.ofDomQuery(this);
    }
});
//# sourceMappingURL=Stream.js.map