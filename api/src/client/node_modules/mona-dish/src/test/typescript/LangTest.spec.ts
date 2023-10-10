/* Licensed to the Apache Software Foundation (ASF) under one or more
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
import {Lang} from "../../main/typescript/Lang";
import equalsIgnoreCase = Lang.equalsIgnoreCase;
import assertType = Lang.assertType;
import isFunc = Lang.isFunc;
import isString = Lang.isString;
import trim = Lang.trim;
import strToArray = Lang.strToArray;
import objToArray = Lang.objToArray;


const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    </head>
    <body>
        <div />
        <div />
        <div />
        <div />
    </body>
    </html>
    
    `)




export const window = dom.window;

class Probe {

    constructor() {
    }

    val1 = 1;
    val2 = 2;
    val3 = 3;
}

describe('Lang tests', () => {


    it('initializable', () => {
        const lang = Lang;
        expect(lang).to.exist;
    });

    it('strToArray working', () => {
        const lang = Lang;

        let arr = strToArray("hello.world.from.me", /\./gi);

        expect(arr).to.exist;
        expect(arr.length).to.eq(4);
        expect(arr[3]).to.eq("me");

    });



    it('trim working', () => {
        const lang = Lang;
        let origStr = " hello world from me    ";
        let trimmed = trim(origStr);
        expect(trimmed).to.exist;
        expect(trimmed).to.eq("hello world from me");

    });

    it('isString working', () => {
        const lang = Lang;
        expect(isString(" ")).to.be.true;
        expect(isString('')).to.be.true;
        expect(isString(null)).to.be.false;
        expect(isString(undefined)).to.be.false;
        expect(isString(function() {return true;})).to.be.false;
        expect(isString(new Probe())).to.be.false;
    });

    it('isFunc working', () => {
        const lang = Lang;
        expect(isFunc(() => {})).to.be.true;
        expect(isFunc(function() {return true;})).to.be.true;
        expect(isFunc("blarg")).to.be.false;
        expect(isFunc(new Probe())).to.be.false;
    });

    it('objToArray working', () => {
        const lang = Lang;
        let obj_probe = new Probe();
        let resultArr = objToArray(obj_probe);
        expect(assertType(resultArr, Array)).to.be.true;
        expect(resultArr.length).to.eq(0);
        obj_probe = window.document.body.querySelectorAll("div");
        resultArr = objToArray(obj_probe);
        expect(resultArr.length).to.eq(4);
        expect(assertType(resultArr, Array)).to.be.true;
    });



    it('equals ignore case test', () => {
        const lang = Lang;
        expect(equalsIgnoreCase(null, null)).to.be.true;
        expect(equalsIgnoreCase("", "")).to.be.true;
        expect(equalsIgnoreCase("null", "NuLL")).to.be.true;
        expect(equalsIgnoreCase("null ", "NuLL")).to.be.false;
        expect(equalsIgnoreCase("null", "NuLL2")).to.be.false;

    });

});

