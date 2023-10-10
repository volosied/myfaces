/*! Licensed to the Apache Software Foundation (ASF) under one or more
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
import {expect} from 'chai';
import {describe, it} from 'mocha';
import {assign, buildPath, shallowMerge} from "../../main/typescript/AssocArray";

describe('Assoc Array Helpers test', () => {
    it('must have a properly working buildPath', () => {
        const target = {};
        const res = buildPath(target, "hello", "world", "from");
        expect(res.key).to.eq("from");
        expect(res.target?.from).eq(null);
    })

    it('must have a properly working buildPath with arrays', () => {
        let config: { [key: string]: any } = {};
        const res = buildPath(config,"hello[5]", "world[3]", "from[5]")
        expect(res.key).eq(5);
        expect(res.target[5]).equals(null);
        expect(config.hello[5].world[3].from[5]).to.eq(null);
    });
    it('must have a properly working buildPath with arrays 2', () => {
        let config: { [key: string]: any } = {};
        const res = buildPath(config,"hello[5][3]", "from[5]")
        expect(res.key).eq(5);
        expect(res.target[5]).equals(null);
        expect(config.hello[5][3].from[5]).to.eq(null);
    });


    it('must have a properly working buildPath with arrays 3', () => {
        let config: { [key: string]: any } = {
            value: []
        };
        const res = buildPath(config.value,"[5][3]", "from[5]")
        expect(res.key).eq(5);
        expect(res.target[5]).equals(null);
        expect(config.value[5][3].from[5]).to.eq(null);
    });

    it('simple assoc array', () => {
        const target = {};
        assign(target, "hello", "world", "from").value = "me";
        expect(target?.["hello"]?.["world"]?.["from"]).to.be.eq("me");
        expect(!target?.["hello"]?.["booga"]?.["from"]).to.be.eq(true);
    });

    it('assoc array - array config', () => {
        let config: { [key: string]: any } = {};
        assign(config,"hello[5]", "world[3]", "from[5]").value = "me";
        console.debug(JSON.stringify(config));
        expect(config?.["hello"]?.[5]?.["world"]?.[3]["from"]?.[5]).to.be.eq("me");
        expect(config?.hello[5].world[3].from[5]).to.be.eq("me");
    });

    it('assoc array - array config double arr', () => {
        let config: { [key: string]: any } = {};
        assign(config,"hello[5][3]", "from[5]").value = "me";
        console.debug(JSON.stringify(config));
        expect(config?.["hello"]?.[5]?.[3]["from"]?.[5]).to.be.eq("me");
        expect(config?.hello[5][3].from[5]).to.be.eq("me");
    });

    it('must do shallow merge', (done) => {
        let res = shallowMerge(true, true, {
            a: "one",
            b: "two"
        }, {
            a: "one_1",
            b: "two_1",
            c: "three"
        });

        expect(res?.a?.[0]).to.eq("one");
        expect(res?.a?.[1]).to.eq("one_1");
        expect(res?.b?.[1]).to.eq("two_1");
        expect(res?.c[0]).to.eq("three");
        done();
    });

    it('must do shallow merge 2', (done) => {
        let res = shallowMerge(false, true, {
            a: "one",
            b: "two"
        }, {
            a: "one_1",
            b: "two_1",
            c: "three"
        });

        expect(res?.a[0]).to.eq("one");
        expect(res?.b[0]).to.eq("two");
        expect(res?.c[0]).to.eq("three");
        done();
    });


    it('must do shallow merge 3', (done) => {
        let res = shallowMerge(true, false, {
            a: "one",
            b: "two"
        }, {
            a: "one_1",
            b: "two_1",
            c: "three"
        });

        expect(res?.a).to.eq("one_1");
        expect(res?.b).to.eq("two_1");
        expect(res?.c).to.eq("three");
        done();
    });

});
