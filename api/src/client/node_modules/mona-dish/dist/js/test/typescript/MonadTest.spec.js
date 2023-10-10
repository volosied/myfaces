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
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Config, CONFIG_ANY, CONFIG_VALUE, Optional, Stream } from "../../main/typescript/index";
//TODO saveResolveTest
describe('optional tests', () => {
    it('fromnullable null', () => {
        expect(Optional.fromNullable(null).isPresent()).to.be.false;
        expect(Optional.fromNullable(null).isAbsent()).to.be.true;
    });
    it('fromnullable absent', () => {
        expect(Optional.fromNullable(Optional.absent).isPresent()).to.be.false;
    });
    it('fromnullable value', () => {
        expect(Optional.fromNullable(1).isPresent()).to.be.true;
        expect(Optional.fromNullable(1).isAbsent()).to.be.false;
    });
    it('flatmap/map test', () => {
        expect(Optional.fromNullable(Optional.fromNullable(1)).value).to.be.eq(1);
        expect(Optional.fromNullable(Optional.fromNullable(1)).value).to.be.eq(1);
    });
    it('flatmap2/map test', () => {
        expect(Optional.fromNullable(Optional.fromNullable(null)).isAbsent()).to.be.true;
        expect(Optional.fromNullable(Optional.fromNullable()).isAbsent()).to.be.true;
    });
    it('elvis test', () => {
        let myStruct = {
            data: {
                value: 1,
                value2: Optional.absent,
                value4: Optional.fromNullable(1)
            },
            data2: [
                { booga: "hello" },
                "hello2"
            ]
        };
        expect(Optional.fromNullable(myStruct).getIf("data", "value").value).to.be.eq(1);
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data", "value2").isAbsent()).to.be.true;
        expect(Optional.fromNullable(myStruct).getIf("data", "value3").isAbsent()).to.be.true;
        expect(Optional.fromNullable(myStruct).getIf("data", "value4").value).to.be.eq(1);
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data2[0]", "booga").isPresent()).to.be.true;
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data2[1]").isPresent()).to.be.true;
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data2").isPresent()).to.be.true;
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data2", "hello2").isPresent()).false;
        expect(Optional.fromNullable(Optional.fromNullable(Optional.fromNullable(myStruct))).getIf("data2[0]", "booga").value).to.be.eq("hello");
    });
});
describe('Config tests', () => {
    let setup = function () {
        return new Config({
            data: {
                value: 1,
                value2: Optional.absent,
                value3: null
            },
            data2: [
                { booga: "hello" },
                "hello2"
            ]
        });
    };
    function structure(myStruct) {
        expect(Optional.fromNullable(myStruct).getIf("data", "value").value).to.be.eq(1);
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data", "value2").isAbsent()).to.be.true;
        expect(Optional.fromNullable(myStruct).getIf("data", "value3").isAbsent()).to.be.true;
        expect(Optional.fromNullable(myStruct).getIf("data", "value4").isAbsent()).to.be.true;
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data2[0]", "booga").isPresent()).to.be.true;
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data2[1]").isPresent()).to.be.true;
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data2").isPresent()).to.be.true;
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data2", "hello2").isPresent()).false;
        expect(Optional.fromNullable(Optional.fromNullable(myStruct)).getIf("data2[0]", "booga").value).to.be.eq("hello");
    }
    function structureBroken(myStruct) {
        let valx = Optional.fromNullable(myStruct).getIf("data", "value").value;
        expect(!!Optional.fromNullable(myStruct).getIf("data", "value").value).to.be.false;
    }
    it('simple config', () => {
        let config = setup();
        config.assign("hello", "world", "from").value = "me";
        expect(Config.fromNullable(config.getIf("hello", "world", "from")).value).to.be.eq("me");
        expect(config.getIf("hello", "booga", "from").isAbsent()).to.be.eq(true);
        structure(config.value);
    });
    it('simple config2', () => {
        let config = setup();
        config.assign("hello", "world", "from").value = "me";
        expect(config.value.hello.world.from).to.be.eq("me");
        structure(config.value);
    });
    it('array config', () => {
        let config = setup();
        config.assign("hello[5]", "world[3]", "from[5]").value = "me";
        console.debug(JSON.stringify(config.toJson()));
        expect(config.getIf("hello[5]", "world[3]", "from[5]").value).to.be.eq("me");
        expect(config.value.hello[5].world[3].from[5]).to.be.eq("me");
        structure(config.value);
    });
    it('array config2', () => {
        let config = new Config([]);
        config.assign("[5]", "world[3]", "from").value = "me";
        expect(config.getIf("[5]", "world[3]", "from").value).to.be.eq("me");
        console.debug(JSON.stringify(config.toJson()));
        expect(config.value[5].world[3].from).to.be.eq("me");
        structureBroken(config.value);
    });
    it('array config3', () => {
        let config = new Config([]);
        config.assign("[5]", "[3]", "from").value = "me";
        expect(config.getIf("[5]", "[3]", "from").value).to.be.eq("me");
        console.debug(JSON.stringify(config.toJson()));
        expect(config.value[5][3].from).to.be.eq("me");
        structureBroken(config.value);
    });
    it('array config4', () => {
        let config = new Config([]);
        config.assign("[5]", "[3]", "[2]").value = "me";
        expect(config.getIf("[5]", "[3]", "[2]").value).to.be.eq("me");
        console.debug(JSON.stringify(config.toJson()));
        expect(config.value[5][3][2]).to.be.eq("me");
        structureBroken(config.value);
    });
    it('array config5', () => {
        let config = new Config([]);
        config.assign("[5]", "world[3]", "from[2]").value = "me";
        expect(config.getIf("[5]", "world[3]", "from[2]").value).to.be.eq("me");
        console.debug(JSON.stringify(config.toJson()));
        expect(config.value[5].world[3].from[2]).to.be.eq("me");
        structureBroken(config.value);
    });
    it('resolve test', () => {
        let probe = new Config({});
        probe.assign("test1", "test2", "test3").value = "hello";
        expect(probe.resolve((root) => root.test1.test2.test3).value).to.eq("hello");
        expect(probe.resolve((root) => root.test1.test2.testborked).isAbsent()).to.be.true;
        expect(probe.resolve((root) => root.test1.testborked.test3).isAbsent()).to.be.true;
    });
    it("must handle gitIf as mutable", () => {
        let probe = new Config({
            "myfaces.request.passThrough": {
                "message": "Hello World"
            }
        });
        probe.getIf("myfaces.request.passThrough").shallowMerge(new Config({
            "param1": "param1_val",
            "param2": "param2_val"
        }));
        expect(probe.value["myfaces.request.passThrough"].param1).to.eq("param1_val");
        expect(probe.value["myfaces.request.passThrough"].param2).to.eq("param2_val");
        expect(probe.value["myfaces.request.passThrough"].message).to.eq("Hello World");
    });
    it("must handle corner cases of assign", () => {
        let probe = new Config({
            "data": []
        });
        probe.assign("data").value.push("value1");
        expect(probe.value.data.length).to.eq(1);
    });
    it('Config append must work from single/zero element to multiple elements', () => {
        let probe = new Config({});
        probe.append("test1", "test2", "test3").value = "hello";
        expect(probe.getIf("test1", "test2", "test3").value.length).to.eq(1);
        expect(probe.getIf("test1", "test2", "test3").value[0]).to.eq("hello");
        probe.append("test1", "test2", "test3").value = "hello2";
        expect(probe.getIf("test1", "test2", "test3").value.length).to.eq(2);
        expect(probe.getIf("test1", "test2", "test3").value[0]).to.eq("hello");
        expect(probe.getIf("test1", "test2", "test3").value[1]).to.eq("hello2");
        probe.assign("test1", "test2", "test3[0]").value = "altered";
        //altered assignment
        expect(probe.getIf("test1", "test2", "test3").value[0]).to.eq("altered");
        expect(probe.getIf("test1", "test2", "test3").value[1]).to.eq("hello2");
        try {
            probe.append("test1", "test2", "test3[0]").value = "hello2";
            expect(true).to.be.false;
        }
        catch (ex) {
        }
    });
});
describe('Typed Config tests', () => {
    var _a, _b, _c, _d, _e;
    /**
     * a really complicated config def, which we never will have
     */
    let configDef = (_a = class {
        },
        _a.data = (_b = class {
            },
            _b.value = CONFIG_VALUE,
            _b.value2 = CONFIG_VALUE,
            _b.value3 = CONFIG_VALUE,
            _b),
        _a.data2 = [(_c = class {
                },
                _c.booga = CONFIG_VALUE,
                _c.data3 = [
                    (_d = class {
                        },
                        _d.booga2 = CONFIG_VALUE,
                        _d),
                    CONFIG_VALUE
                ],
                _c), CONFIG_VALUE, [{ data4: CONFIG_VALUE }, CONFIG_VALUE]],
        _a.data3 = [(_e = class {
                },
                _e.data4 = CONFIG_ANY //whatever comes below does not have a clear structure anymore
            ,
                _e)],
        _a);
    let config = new Config({
        data: {
            value: 1,
            value2: Optional.absent,
            value3: null
        },
        data2: [
            {
                booga: "hello",
                data3: [{ booga2: "hellobooga2" }]
            },
            "hello2",
            [{
                    data4: "hello4"
                }, "hello4_1"]
        ],
        data3: [
            {
                data4: {
                    data5: "hello"
                }
            }
        ]
    }, configDef);
    let setup = function () {
        return { config, configDef };
    };
    it("must resolve base static data", function () {
        let { config, configDef } = setup();
        let val1 = config.getIf("data", "value").value;
        expect(val1).eq(1);
        let val2 = config.getIf("data2[0]", "booga").value;
        expect(val2).eq("hello");
        let val3 = config.getIf("data2[1]").value;
        expect(val3).eq("hello2");
        val3 = config.getIf("data2[1]").value;
        expect(val3).eq("hello2");
        val3 = config.getIf("data2[0]", "data3[0]", "booga2").value;
        expect(val3).eq("hellobooga2");
        val3 = config.getIf("data2[2]", "[0]", "data4").value;
        expect(val3).eq("hello4");
        val3 = config.getIf("data2[2][0]", "data4").value;
        expect(val3).eq("hello4");
        val3 = config.getIf("data2[2]", "[1]").value;
        expect(val3).eq("hello4_1");
        val3 = config.getIf("data2[2][1]").value;
        expect(val3).eq("hello4_1");
        global["debug_arr"] = true;
        val3 = config.getIf("data3[0]", "data4", "data5").value;
        expect(val3).eq("hello");
        try {
            config.getIf("data2[2][1]", "orga").value;
            expect(true).to.be.false;
        }
        catch (err) {
            expect(true).to.be.true;
        }
        expect(config.getIf("data3[0]", "data4", "arr").isAbsent()).eq(true);
        try {
            config.getIf("data2[2][0]", "data5").value;
            expect(true).to.be.false;
        }
        catch (err) {
            expect(true).to.be.true;
        }
        try {
            config.getIf("data2[2][0]", "data5").value;
            expect(true).to.be.false;
        }
        catch (err) {
            expect(true).to.be.true;
        }
    });
    it("must resolve properly into a stream", function () {
        let { config, configDef } = setup();
        let data1 = false;
        let data2 = false;
        Stream.ofConfig(config).each(([key, data]) => {
            if (key == "data") {
                data1 = true;
                expect(data.value).to.eq(1);
                expect(data.value2).to.eq(Optional.absent);
            }
            if (key == "data2") {
                data2 = true;
            }
        });
        expect(data1).to.be.true;
        expect(data2).to.be.true;
    });
});
//# sourceMappingURL=MonadTest.spec.js.map