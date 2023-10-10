/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {expect} from 'chai';
import {describe, it} from 'mocha';
import * as CryptoJS from "crypto-js";
import {
    BroadcastChannelBroker,
    BroadcastChannelBrokerBuilder,
    Broker,
    Message
} from "../../main/typescript/Messaging";
import {BroadcastChannel as BC, enforceOptions} from 'broadcast-channel';
import {ExpiringCrypto, Hash, JSONCrypto} from "../../main/typescript";

const jsdom = require("jsdom");
const {JSDOM} = jsdom;


async function delay(milliseconds: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

let iframe = `
            <div id="received">false</div>
        `;

const CHANNEL = "booga";

let applyMessageReceiver = function (contentWindow: any, msg: Message, brokr = new Broker(contentWindow)) {
    contentWindow["passMessage"] = function (message: Message) {
        msg = message;
        brokr.registerListener("channel", message => {
            contentWindow.document.getElementById("received").innerHTML = message.message;
            console.log("iframe message", message.message);
        });
    }
    return msg;
};
describe('Broker tests', function () {

    beforeEach(function () {


        // noinspection HtmlUnknownAttribute
        let dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<div id="id_1"></div>
<div id="id_2" booga="blarg" class="blarg2"></div>
<div id="id_3" class="blarg1 blarg2"></div>
<div id="id_4"></div>
<iframe id="iframe1"></iframe>
<div id="shadow1"></div>
</body>
</html>
    `, {
            contentType: "text/html",
            runScripts: "dangerously"
        });


        let window = dom.window;

        (<any>global).window = window;
        (<any>global).body = window.document.body;
        (<any>global).document = window.document;
        (<any>global).navigator = {
            language: "en-En"
        };


        (<any>window)["BroadcastChannel"] = BC;
        /*this.xhr = sinon.useFakeXMLHttpRequest();
        this.requests = [];
        this.xhr.onCreate = (xhr) => {
            this.requests.push(xhr);
        };
        (<any>global).XMLHttpRequest = this.xhr;
        (<any>window).XMLHttpRequest = this.xhr;*/
        // enforce this config for all channels
        enforceOptions({
            type: 'simulate'
        });

    });

    /*relays a message from an iframe up into the global context*/
    it('from iframe to global', function () {

        let contentWindow = ((<any>global).document.getElementById('iframe1')).contentWindow;
        let iframeDoc = contentWindow.document;
        iframeDoc.write(iframe);
        expect(iframeDoc.querySelectorAll("#received").length > 0).to.be.true;

        let msg = new Message("booga");
        let iframeBroker = new Broker(contentWindow);
        let origBroker = new Broker();
        msg = applyMessageReceiver(contentWindow, msg, iframeBroker);

        //contentWindow.passMessage(msg);
        origBroker.broadcast("channel", msg);
        let messageReceived = false;

        origBroker.registerListener(CHANNEL, (msg: Message) => {
            messageReceived = msg.message == "booga";
        });

        msg = new Message("booga2");
        iframeBroker.broadcast("channel2", msg);

        async function analyzeDelayed() {
            await delay(1000);
            expect(messageReceived).to.eq(true);
        }

        analyzeDelayed();
    });

    /**
     * pass a global message into an attached brokered iframe
     */
    it('from global to iframe', function () {

        let contentWindow = ((<any>global).document.getElementById('iframe1')).contentWindow;
        let iframeDoc = contentWindow.document;
        iframeDoc.write(iframe);
        expect(iframeDoc.querySelectorAll("#received").length > 0).to.be.true;

        let msg = applyMessageReceiver(contentWindow, new Message("booga"));
        let broker = new Broker();
        contentWindow.passMessage(msg);
        broker.broadcast("channel", msg);

        msg = new Message("booga2");
        broker.broadcast("channel2", msg);

        async function analyzeDelayed() {
            await delay(400);
            expect(iframeDoc.querySelectorAll("#received")[0].innerHTML).to.eq("booga");
        }

        analyzeDelayed();
    });

    it('basic message', function () {
        let broker = new Broker();
        let messageReceived = false;
        broker.registerListener("channel", (message: Message): void => {
            messageReceived = message.message === "booga";
        })

        broker.broadcast("channel", new Message("booga"));
        expect(messageReceived).to.be.true;
    });

    it('basic message different broker groups', function () {
        let broker = new Broker(window, "aaa");
        let broker2 = new Broker(window, "bbb")
        let messageReceived = false;
        let messageReceived2 = false;
        broker.registerListener("channel", (message: Message): void => {
            messageReceived = message.message === "booga";
        });
        broker2.registerListener("channel", (message: Message): void => {
            messageReceived2 = message.message === "booga";
        });

        broker.broadcast("channel", new Message("booga"));
        expect(messageReceived).to.be.true;
        expect(messageReceived2).to.be.false;
    });

    it('bidirectional message', function () {
        // noinspection DuplicatedCode
        let broker = new Broker();
        let answerReceived = false;
        broker.registerListener("channel", (message: Message): void => {
            setTimeout(() => broker.answer("channel", message, new Message("answer of booga")), 0);
        })

        return broker.request("channel", new Message("booga"))
            .then((message2: Message) => {
                answerReceived = message2.message === "answer of booga";
                expect(answerReceived).to.be.true;
                return true;
            });

    });

    it('bidirectional message with two brokers', function () {
        let broker = new Broker();
        // noinspection DuplicatedCode
        let broker2 = new Broker();
        let answerReceived = false;
        broker2.registerListener("channel", (message: Message): void => {
            setTimeout(() => broker.answer("channel", message, new Message("answer of booga")), 0);
        })

        return broker.request("channel", new Message("booga"))
            .then((message2: Message) => {
                answerReceived = message2.message === "answer of booga";
                expect(answerReceived).to.be.true;
                return true;
            });
    });

    it('basic init', function () {
        expect(window?.document?.body).not.eq(null);
    });

    it('dual brokers in different systems', function () {

        let broker1 = new Broker();
        let broker2 = new Broker();


        let broker1CallCnt = 0;
        let broker2CallCnt = 0;


        broker1.registerListener(CHANNEL, () => {
            broker1CallCnt++;
        });
        broker2.registerListener(CHANNEL, () => {
            broker2CallCnt++;
        });

        broker1.broadcast(CHANNEL, new Message("booga"));


        expect(broker1CallCnt == 1).to.eq(true);
        expect(broker2CallCnt == 1).to.eq(true);

        broker2.broadcast(CHANNEL, new Message("booga"));

        expect(broker1CallCnt == 2).to.eq(true);
        expect(broker2CallCnt == 2).to.eq(true);

    });

    it('dual brokers in different systems sequence calls', function () {

        let chn1 = new BC("ddd");
        let chn2 = new BC("ddd");

        let chn1CallCnt = 0;
        let chn2CallCnt = 0;

        chn1.addEventListener("message", () => {
            chn1CallCnt++;
        });
        chn2.addEventListener("message", () => chn2CallCnt++);

        let broker1 = new BroadcastChannelBroker();
        let broker2 = new BroadcastChannelBroker();

        console.log("channels created");

        let broker1CallCnt = 0;
        let broker2CallCnt = 0;


        broker1.registerListener(CHANNEL, () => {
            broker1CallCnt++;
        });
        broker2.registerListener(CHANNEL, () => {
            broker2CallCnt++;
        });


        return (async () => {
            await broker1.broadcast(CHANNEL, new Message("booga"));
            await broker1.broadcast(CHANNEL, new Message("booga"));
            await broker1.broadcast(CHANNEL, new Message("booga"));
            await chn1.postMessage({
                foo: 'bar'
            });
            await chn1.postMessage({
                foo: 'bar'
            });
            await delay(200);
            expect(chn1CallCnt == 0).to.be.true;
            expect(chn2CallCnt == 2).to.be.true;

            expect(broker1CallCnt == 3).to.eq(true);
            expect(broker2CallCnt == 3).to.eq(true);
            broker1.unregister();
            broker2.unregister();

        })();

    });

    it('shadow dom handling', function () {
        //closed not possible this seals the element off entirely, this is a no go
        //also a closed shadow root is not recommended, there are other ways of achieving partial
        //isolation
        let shadowRoot: ShadowRoot = (<any>document.getElementById('shadow1')).attachShadow({mode: 'closed'});
        expect(shadowRoot != null).to.be.true;
        shadowRoot.innerHTML = "<div class='received'>false</div>";

        //we now attach the brokers
        let origBroker = new Broker(window, "orig");
        let shadowBroker = new Broker(shadowRoot, "orig");


        let shadowBrokerReceived = 0;
        shadowBroker.registerListener(CHANNEL, () => {
            shadowBrokerReceived++;
        });

        let brokerReceived = 0;
        origBroker.registerListener(CHANNEL, () => {
            brokerReceived++;
        });

        //from root broker into shadow dom
        origBroker.broadcast(CHANNEL, new Message("booga"));
        expect(shadowBrokerReceived).to.be.eq(1);
        expect(brokerReceived).to.eq(1);

        //now from shadow dom into broker
        shadowBroker.broadcast(CHANNEL, new Message("booga2"));
        expect(brokerReceived).to.eq(2);

        //not closed shadow dom works in a way, that you basically bind the broker as external
        //to the external element and then use the message handler to pass the data back into
        //your shadow Root ... the shadow root is basically an internal isolation you can pass
        //That way, but you have to do it yourself by defining a broker in your component

    });

    it("must handle sub-elements correctly", function () {
        let broker1 = new Broker();
        let broker2 = new Broker(document.getElementById("id_1"));
        let brokerReceived = 0;
        broker2.registerListener(CHANNEL, () => {
            brokerReceived++;
        });
        broker1.broadcast(CHANNEL, new Message("booga"));
        expect(brokerReceived).to.eq(1);
    });


    it("must work with Broadcast channel", function (done) {
        let broker1 = new BroadcastChannelBroker((group: string) => new BC(group));
        let broker2 = new BroadcastChannelBroker((group: string) => new BC(group));

        let brokerReceived = 0;
        new Promise((apply) => {
            broker2.registerListener(CHANNEL, () => {
                brokerReceived++;
                apply(brokerReceived);
            })
            broker1.broadcast(CHANNEL, new Message("booga"));
        }).finally(() => {
            broker1.unregister();
            broker2.unregister();
            expect(brokerReceived).to.eq(1);
            done();
        })
    });


    it('shadow dom handling with Broadcast channel', async function () {
        //closed not possible this seals the element off entirely, this is a no go
        //also a closed shadow root is not recommended, there are other ways of achieving partial
        //isolation
        let shadowRoot: ShadowRoot = (<any>document.getElementById('shadow1')).attachShadow({mode: 'closed'});
        expect(shadowRoot != null).to.be.true;
        shadowRoot.innerHTML = "<div class='received'>false</div>";

        //we now attach the brokers

        let origBroker = new BroadcastChannelBroker();
        let shadowBroker = new BroadcastChannelBroker();


        let shadowBrokerReceived = 0;

        shadowBroker.registerListener(CHANNEL, () => {
            shadowBrokerReceived++;
        });


        let brokerReceived = 0;

        origBroker.registerListener(CHANNEL, () => {
            brokerReceived++;
        });


        //from root broker into shadow dom
        origBroker.broadcast(CHANNEL, new Message("booga"));

        await delay(100);

        expect(shadowBrokerReceived).to.be.eq(1);
        expect(brokerReceived).to.eq(1);

        //now from shadow dom into broker

        shadowBroker.broadcast(CHANNEL, new Message("booga2"));
        await delay(100);
        expect(brokerReceived).to.eq(2);
        origBroker.unregister();
        shadowBroker.unregister();

        //not closed shadow dom works in a way, that you basically bind the broker as external
        //to the external element and then use the message handler to pass the data back into
        //your shadow Root ... the shadow root is basically an internal isolation you can pass
        //That way, but you have to do it yourself by defining a broker in your component

    });


    it('basic message with broadcast', async function () {
        let broker = new BroadcastChannelBroker();
        let messageReceived = false;
        broker.registerListener("channel", (message: Message): void => {
            messageReceived = message.message === "booga";
        })

        broker.broadcast("channel", new Message("booga"));
        await delay(100);
        expect(messageReceived).to.be.true;
        broker.unregister();
    });


    it('basic message with subjects and rxjs', async function () {
        let broker = new BroadcastChannelBroker();
        let messageReceived = false;
        broker.registerListener("channel", (message: Message): void => {
            messageReceived = message.message === "booga";
        })

        let messageSubject = broker.asSubject("channel");
        messageSubject.next(new Message("booga"));
        await delay(100);
        expect(messageReceived).to.be.true;
        broker.unregister();
    });

    it('basic message with subjects and rxjs second test', async function () {
        let broker = new BroadcastChannelBroker();
        let messageReceived = false;

        let messageSubject = broker.asSubject("channel");
        messageSubject.subscribe(message => {
            messageReceived = message.message === "booga";
        })

        broker.broadcast("channel", new Message("booga"));

        await delay(100);
        expect(messageReceived).to.be.true;
        broker.unregister();
    });


    it('basic message with subjects and rxjs third test', async function () {
        let broker = new BroadcastChannelBroker();
        let messageReceived = false;

        let messageSubject = broker.asSubject("channel");
        messageSubject.subscribe(message => {
            messageReceived = message.message === "booga";
        })

        messageSubject.next(new Message("booga"));

        await delay(100);
        expect(messageReceived).to.be.true;
        broker.unregister();
    });

    it('basic message with broadcast ans string', async function () {
        let broker = new BroadcastChannelBroker();
        let messageReceived = false;
        broker.registerListener("channel", (message: Message): void => {
            messageReceived = message.message === "booga";
        })

        broker.broadcast("channel", "booga");
        await delay(100);
        expect(messageReceived).to.be.true;
        broker.unregister();
    });

    it('bidirectional message with Broadcast Channel', async function () {
        let broker = new BroadcastChannelBroker();
        let broker2 = new BroadcastChannelBroker();
        // noinspection DuplicatedCode
        let answerReceived = false;
        broker2.registerListener("channel", (message: Message): void => {
            setTimeout(() => broker2.answer("channel", message, new Message("answer of booga")), 0);
        })

        return broker.request("channel", new Message("booga"))
            .then((message2: Message) => {
                answerReceived = message2.message === "answer of booga";
                expect(answerReceived).to.be.true;
                return true;
            }).finally(() => {
                broker.unregister();
                broker2.unregister();
            });
    });

    it('crypto test 1', async function () {
        let crypto = new JSONCrypto();
        let broker = new BroadcastChannelBrokerBuilder().withCrypto(crypto).build();
        let broker2 = new BroadcastChannelBrokerBuilder().withCrypto(crypto).build();
        // noinspection DuplicatedCode
        let answerReceived = false;

        broker2.registerListener("channel", (message: Message): void => {
            setTimeout(() => broker2.answer("channel", message, new Message("answer of booga")), 0);
        })

        return broker.request("channel", new Message("booga"))
            .then((message2: Message) => {
                answerReceived = message2.message === "answer of booga";
                expect(answerReceived).to.be.true;
                return true;
            }).finally(() => {
                broker.unregister();
                broker2.unregister();
            });
    });

    it('Crypto Timer Extension test 1', async function() {
        let encodeCalled = false;
        //we use a small dynamically generated implementation for the hash
        let hashSum: Hash =  {
            encode: (encodedData: string): string => {
                encodeCalled = true;
                return CryptoJS.SHA256 (encodedData);
            }
        };

        let expiringCrypto = new ExpiringCrypto(20 /*ms*/, new JSONCrypto(), hashSum);

        let toEncrypt = "hello world";
        let encrypted = expiringCrypto.encode(toEncrypt);
        expect(encrypted).not.to.eq(toEncrypt);
        let decrypted = expiringCrypto.decode(encrypted);
        expect(decrypted).to.eq(toEncrypt);
        decrypted = expiringCrypto.decode(encrypted);
        expect(decrypted).to.eq(toEncrypt);
        expect(encodeCalled).to.be.true;
        await delay(50);
        try {
            expiringCrypto.decode(encrypted);
        } catch (e) {
            //expected
            return true;
        }
        expect(true).to.be .false;
    });
})
