/*!
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
/**
 * a standardized message to be sent over the message bus
 */
import { Subject } from "rxjs";
import { Stream } from "./Stream";
import { _global$ } from "./Global";
/**
 * Default implementation = no encryption
 */
export class NoCrypto {
    decode(data) {
        return data;
    }
    encode(data) {
        return data;
    }
}
//TODO dynamic encryptor which flushes the messages before changing the keys
//that way we can rotate and change internal crypto keys on the fly
let noEncryption = new NoCrypto();
export class Message {
    constructor(message = {}, targetOrigin = "*") {
        this.message = message;
        this.encoded = false;
        this.targetOrigin = targetOrigin;
        this.creationDate = new Date().getMilliseconds();
        this.identifier = new Date().getMilliseconds() + "_" + Math.random() + "_" + Math.random();
    }
}
/**
 * custom dom event wrapping our messages
 */
class MessageWrapper {
    constructor(channel, message) {
        this.detail = message;
        this.bubbles = true;
        this.cancelable = true;
        this.composed = true;
        this.channel = channel;
    }
}
/**
 * abstract broker class
 * (The broker is the central distribution unit of messages)
 */
class BaseBroker {
    constructor() {
        /**
         * we can split the listeners with the system
         * namespace... and type (aka identifier criteria)
         */
        this.messageListeners = {};
        this.subjects = {};
        this.processedMessages = {};
        this.cleanupCnt = 0;
        this.TIMEOUT_IN_MS = 1000;
        this.MSG_EVENT = "message";
        //must be public because we also must have the option
        //to set it outside of the constructor
        this.crypto = noEncryption;
    }
    /**
     * registers a listener on a channel
     * @param channel the channel to register the listeners for
     * @param listener the listener to register
     */
    registerListener(channel, listener) {
        this.reserveListenerNS(channel);
        //we skip the processed messages, because they originated here
        //and already are processed
        this.messageListeners[channel].push((msg) => {
            var _a;
            if (msg.identifier in this.processedMessages) {
                return;
            }
            if ((msg === null || msg === void 0 ? void 0 : msg.encoded) || ((_a = msg === null || msg === void 0 ? void 0 : msg["detail"]) === null || _a === void 0 ? void 0 : _a.encoded)) {
                if (msg === null || msg === void 0 ? void 0 : msg["detail"]) {
                    msg["detail"].message = this.crypto.decode(msg["detail"].message);
                    msg["detail"].encoded = false;
                }
                else {
                    msg.message = this.crypto.decode(msg.message);
                    msg.encoded = false;
                }
            }
            listener(msg);
        });
        return this;
    }
    /**
     * binding into rxjs
     * produces a subject which can be used via next calls to send messages
     * on the other hand we
     * @param channel
     */
    asSubject(channel) {
        this.reserveSubjectNS(channel);
        let subject = this.subjects[channel];
        let oldNext = subject.next;
        subject.next = (msg) => {
            //We use a recursive call to let the broadcaster handle
            //The wrapper conversion and then again call us here
            //that way both directions are handled.. next calls the broker
            //and a broadcast calls next
            if (msg === null || msg === void 0 ? void 0 : msg.detail) {
                oldNext.call(subject, msg === null || msg === void 0 ? void 0 : msg.detail);
            }
            else {
                this.broadcast(channel, msg);
            }
        };
        return subject;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * returns an observable on the baseBroker
     * @param channel
     */
    asObservable(channel) {
        return this.asSubject(channel).asObservable();
    }
    /**
     * reserves the listener namespace and wildcard namespace for the given identifier
     * @param identifier
     * @private
     */
    reserveListenerNS(identifier) {
        if (!this.messageListeners[identifier]) {
            this.messageListeners[identifier] = [];
        }
        if (!this.messageListeners["*"]) {
            this.messageListeners["*"] = [];
        }
    }
    reserveSubjectNS(identifier) {
        if (!this.subjects[identifier]) {
            this.subjects[identifier] = new Subject();
        }
        if (!this.subjects["*"]) {
            this.subjects["*"] = new Subject();
        }
    }
    /**
     * unregisters a listener from this channel
     *
     * @param channel the channel to unregister from
     * @param listener the listener to unregister the channel from
     */
    unregisterListener(channel, listener) {
        this.messageListeners[channel] = (this.messageListeners[channel] || []).filter((item) => item !== listener);
        return this;
    }
    /**
     * answers a bidirectional message received
     * usage, the client can use this method, to answer an incoming message in a precise manner
     * so that the caller sending the bidirectional message knows how to deal with it
     * this mechanism can be used for global storages where we have one answering entity per channel delivering the
     * requested data, the request can be done asynchronously via promises waiting for answers
     *
     * @param channel the channel the originating message
     * @param request the requesting message
     * @param answer the answer to the request
     */
    answer(channel, request, answer) {
        if ('string' == typeof request) {
            request = new Message(request);
        }
        if (BaseBroker.isAnswer(request)) {
            return;
        }
        answer.identifier = BaseBroker.getAnswerId(request);
        this.broadcast(channel, answer);
        return this;
    }
    static getAnswerId(request) {
        return "_r_" + request.identifier;
    }
    static isAnswer(request) {
        return request.identifier.indexOf("_r_") == 0;
    }
    /**
     * idea... a bidirectional broadcast
     * sends a message and waits for the first answer coming in from one of the receivers
     * sending the message back with a messageIdentifier_broadCastId answer
     *
     * @param channel
     * @param message
     */
    request(channel, message) {
        if ('string' == typeof message) {
            message = new Message(message);
        }
        let messageId = message.identifier;
        let ret = new Promise((resolve, reject) => {
            let timeout = null;
            let listener = (message2) => {
                if (message2.identifier == messageId) {
                    //broadcast from same source, we do not want
                    //to deal with it now
                    return;
                }
                if (message2.identifier == "_r_" + messageId) {
                    clearTimeout(timeout);
                    this.unregisterListener(channel, listener);
                    resolve(message2);
                }
            };
            timeout = setTimeout(() => {
                this.unregisterListener(channel, listener);
                reject("request message performed, timeout, no return value");
            }, 3000);
            this.registerListener(channel, listener);
        });
        this.broadcast(channel, message);
        return ret;
    }
    /**
     * garbage collects the processed messages queue
     * usually after one second
     */
    gcProcessedMessages() {
        if ((++this.cleanupCnt) % 10 != 0) {
            return;
        }
        let newProcessedMessages = {};
        Object.keys(this.processedMessages).forEach(key => {
            if (this.messageStillActive(key))
                return;
            newProcessedMessages[key] = this.processedMessages[key];
        });
        this.processedMessages = newProcessedMessages;
    }
    messageStillActive(key) {
        return this.processedMessages[key] > ((new Date()).getMilliseconds() - this.TIMEOUT_IN_MS);
    }
    markMessageAsProcessed(message) {
        this.processedMessages[message.identifier] = message.creationDate;
    }
}
BaseBroker.EVENT_TYPE = "brokerEvent";
let broadCastChannelBrokerGenerator = (name) => {
    var _a;
    if ((_a = _global$()) === null || _a === void 0 ? void 0 : _a.BroadcastChannel) {
        return new (_global$()).BroadcastChannel(name);
    }
    throw Error("No Broadcast channel in the system, use a shim or provide a factory function" +
        "in the constructor");
};
const DEFAULT_CHANNEL_GROUP = "brokr";
/**
 * a broker which hooks into the Broadcast Channel
 * either via shim or substitute lib
 *
 * The broadcast channels are a standardized messaging library
 * The broker mechanism sets a layer on top to make it more manageable!
 *
 */
export class BroadcastChannelBroker extends BaseBroker {
    /**
     * @param brokerFactory a factory generating a broker
     * @param channelGroup a group to combine a set of channels
     * @param crypto a crypto class
     */
    constructor(brokerFactory = broadCastChannelBrokerGenerator, channelGroup = DEFAULT_CHANNEL_GROUP, crypto = noEncryption) {
        super();
        this.brokerFactory = brokerFactory;
        this.channelGroup = channelGroup;
        this.crypto = crypto;
        this.openChannels = {};
        this.msgListener = (messageData) => {
            var _a, _b;
            if (messageData.detail.encoded) {
                messageData.detail.message = this.crypto.decode(messageData.detail.message);
                messageData.detail.encoded = false;
            }
            let coreMessage = messageData.detail;
            let channel = messageData.channel;
            if ((_a = this.messageListeners) === null || _a === void 0 ? void 0 : _a[channel]) {
                (_b = this.messageListeners) === null || _b === void 0 ? void 0 : _b[channel].forEach(listener => {
                    listener(coreMessage);
                });
            }
            this.markMessageAsProcessed(coreMessage);
            return true;
        };
        this.crypto = crypto;
        this.register();
    }
    broadcast(channel, message, includeOrigin = true) {
        try {
            if ('string' == typeof message) {
                message = new Message(message);
            }
            //we now run a quick remapping to avoid
            //serialisation errors
            let msgString = JSON.stringify(message);
            message = JSON.parse(msgString);
            let messageWrapper = new MessageWrapper(channel, message);
            messageWrapper.detail.message = this.crypto.encode(messageWrapper.detail.message);
            messageWrapper.detail.encoded = true;
            if (this === null || this === void 0 ? void 0 : this.subjects[channel]) {
                this.subjects[channel].next(messageWrapper);
            }
            this.openChannels[this.channelGroup].postMessage(messageWrapper);
            if (includeOrigin) {
                this.msgListener(messageWrapper);
            }
        }
        finally {
            this.gcProcessedMessages();
        }
        return this;
    }
    registerListener(channel, listener) {
        super.registerListener(channel, listener);
        return this;
    }
    register() {
        if (!this.openChannels[this.channelGroup]) {
            this.openChannels[this.channelGroup] = this.brokerFactory(this.channelGroup);
        }
        this.openChannels[this.channelGroup].addEventListener("message", this.msgListener);
        return this;
    }
    unregister() {
        this.openChannels[this.channelGroup].close();
        return this;
    }
}
// noinspection JSUnusedGlobalSymbols
/**
 * Helper factory to create a broadcast channel broker
 */
export class BroadcastChannelBrokerBuilder {
    constructor() {
        this.broadCastChannelGenerator = broadCastChannelBrokerGenerator;
        this.channelGroup = DEFAULT_CHANNEL_GROUP;
        this.crypto = noEncryption;
        this.listeners = [];
    }
    withGeneratorFunc(generatorFunc) {
        this.broadCastChannelGenerator = generatorFunc;
        return this;
    }
    withListener(channel, ...listeners) {
        Stream.of(...listeners).each(listener => {
            this.listeners.push({
                channel: channel,
                listener: listener
            });
        });
        return this;
    }
    withChannelGroup(channelGroup) {
        this.channelGroup = channelGroup;
        return this;
    }
    withCrypto(crypto) {
        this.crypto = crypto;
        return this;
    }
    build() {
        let broker = new BroadcastChannelBroker(this.broadCastChannelGenerator, this.channelGroup, this.crypto);
        Stream.of(...this.listeners).each(listenerItem => {
            broker.registerListener(listenerItem.channel, listenerItem.listener);
        });
        return broker;
    }
}
/**
 * implementation of a messaging based transport
 */
/**
 * central message broker which uses various dom constructs
 * to broadcast messages into subelements
 *
 * we use the dom event system as transport and iframe and shadow dom mechanisms in a transparent way to
 * pull this off
 *
 * usage
 *
 * broker = new Broker(optional rootElement)
 *
 * defines a message broker within a scope of rootElement (without it is window aka the current isolation level)
 *
 * broker.registerListener(channel, listener) registers a new listener to the current broker and channel
 * broker.unregisterListener(channel, listener) unregisters the given listener
 *
 * broker.broadcast(message, optional direction, optional callBrokerListeners)
 * sends a message (channel included in the message object) in a direction (up, down, both)
 * and also optionally calls the listeners on the same broker (default off)
 *
 * the flow is like
 * up messages are propagated upwards only until it reaches the outer top of the dom
 * downwards, the messages are propagated downwards only
 * both the message is propagated into both directions
 *
 * Usually messages sent from the same broker are not processed within... however by setting
 * callBrokerListeners to true the listeners on the same broker also are called
 * brokers on the same level will get the message and process it automatically no matter what.
 * That way you can exclude the source from message processing (and it is done that way automatically)
 *
 * Isolation levels. Usually every isolation level needs its own broker object registering
 * on the outer bounds
 *
 * aka documents will register on window
 * iframes on the iframe windowObject
 * isolated shadow doms... document
 *
 *
 *
 */
export class Broker extends BaseBroker {
    /**
     * constructor has an optional root element
     * and an internal name
     *
     * @param scopeElement
     * @param brokerGroup
     * @param crypto
     */
    constructor(scopeElement = window, brokerGroup = "brokr", crypto = noEncryption) {
        super();
        this.brokerGroup = brokerGroup;
        /**
         * message relay.. identifies message events and relays them to the listeners
         * @param event
         */
        let evtHandler = (event) => {
            var _a, _b, _c, _d;
            let details = (_a = event === null || event === void 0 ? void 0 : event.detail) !== null && _a !== void 0 ? _a : (_b = event === null || event === void 0 ? void 0 : event.data) === null || _b === void 0 ? void 0 : _b.detail;
            //TODO possible crypto hook, needs unit testing
            let channel = (_d = ((_c = event === null || event === void 0 ? void 0 : event.data) === null || _c === void 0 ? void 0 : _c.channel)) !== null && _d !== void 0 ? _d : (event === null || event === void 0 ? void 0 : event.channel);
            //javascript loses the type info in certain module types
            if ((details === null || details === void 0 ? void 0 : details.identifier) && (details === null || details === void 0 ? void 0 : details.message)) {
                let msg = details;
                if (msg.identifier in this.processedMessages) {
                    return;
                }
                //coming in from up... we need to send it down
                //a relayed message always has to trigger the listeners as well
                if (event === null || event === void 0 ? void 0 : event.detail) {
                    this.broadcast(channel, msg);
                }
                else {
                    this.broadcast(channel, msg);
                }
            }
        };
        this.msgHandler = (evt) => evtHandler(evt);
        this.crypto = crypto;
        this.register(scopeElement);
    }
    /**
     * register the current broker into a scope defined by wnd
     * @param scopeElement
     */
    register(scopeElement) {
        this.rootElem = scopeElement.host ? scopeElement.host : scopeElement;
        if (scopeElement.host) {
            let host = scopeElement.host;
            host.setAttribute("data-broker", "1");
        }
        else {
            if (scopeElement === null || scopeElement === void 0 ? void 0 : scopeElement["setAttribute"])
                scopeElement.setAttribute("data-broker", "1");
        }
        this.rootElem.addEventListener(this.brokerGroup + "__||__" + Broker.EVENT_TYPE, this.msgHandler, { capture: true });
        /*dom message usable by iframes*/
        this.rootElem.addEventListener(this.brokerGroup + "__||__" + Broker.EVENT_TYPE + this.MSG_EVENT, this.msgHandler, { capture: true });
        return this;
    }
    /**
     * manual unregister function, to unregister as broker from the current
     * scope
     */
    unregister() {
        this.rootElem.removeEventListener(this.brokerGroup + "__||__" + Broker.EVENT_TYPE, this.msgHandler);
        this.rootElem.removeEventListener(this.brokerGroup + "__||__" + this.MSG_EVENT, this.msgHandler);
        return this;
    }
    /**
     * broadcast a message
     * the message contains the channel and the data and some internal bookkeeping data
     *
     * @param channel the channel to broadcast to
     * @param message the message dot send
     * (for instance 2 iframes within the same parent broker)
     */
    broadcast(channel, message) {
        if ('string' == typeof message) {
            message = new Message(message);
        }
        //message.message = this.crypto.encode(message);
        //message.encoded = true;
        if (this === null || this === void 0 ? void 0 : this.subjects[channel]) {
            let messageWrapper = new MessageWrapper(channel, message);
            if (!messageWrapper.detail.encoded) {
                messageWrapper.detail.message = this.crypto.encode(messageWrapper.detail.message);
                messageWrapper.detail.encoded = true;
            }
            this.subjects[channel].next(messageWrapper);
        }
        try {
            this.dispatchUp(channel, message, false, true);
            //listeners already called
            this.dispatchDown(channel, message, true, false);
        }
        finally {
            this.gcProcessedMessages();
        }
        return this;
    }
    dispatchUp(channel, message, ignoreListeners = true, callBrokerListeners = true) {
        if (!ignoreListeners) {
            this.msgCallListeners(channel, message);
        }
        this.markMessageAsProcessed(message);
        if (_global$().parent != null) {
            let messageWrapper = new MessageWrapper(channel, message);
            _global$().parent.postMessage(JSON.parse(JSON.stringify(messageWrapper)), message.targetOrigin);
        }
        if (callBrokerListeners) {
            this.dispatchSameLevel(channel, message);
        }
    }
    dispatchSameLevel(channel, message) {
        let event = this.transformToEvent(channel, message, true);
        //we also dispatch sideways
        _global$().dispatchEvent(event);
    }
    //a dispatch of our own should never trigger the listeners hence the default true
    dispatchDown(channel, message, ignoreListeners = true, callBrokerListeners = true) {
        if (!ignoreListeners) {
            this.msgCallListeners(channel, message);
        }
        this.processedMessages[message.identifier] = message.creationDate;
        let evt = this.transformToEvent(channel, message);
        /*we now notify all iframes lying underneath */
        Array.prototype.slice.call(document.querySelectorAll("iframe")).forEach((element) => {
            let messageWrapper = new MessageWrapper(channel, message);
            element.contentWindow.postMessage(JSON.parse(JSON.stringify(messageWrapper)), message.targetOrigin);
        });
        Array.prototype.slice.call(document.querySelectorAll("[data-broker='1']")).forEach((element) => element.dispatchEvent(evt));
        if (callBrokerListeners) {
            this.dispatchSameLevel(channel, message);
        }
    }
    msgCallListeners(channel, message) {
        let listeners = this.messageListeners[channel];
        if (listeners === null || listeners === void 0 ? void 0 : listeners.length) {
            let callElement = (element) => {
                element(message);
            };
            listeners.forEach(callElement);
        }
    }
    transformToEvent(channel, message, bubbles = false) {
        let messageWrapper = new MessageWrapper(channel, message);
        messageWrapper.bubbles = bubbles;
        return Broker.createCustomEvent(this.brokerGroup + "__||__" + Broker.EVENT_TYPE, messageWrapper);
    }
    static createCustomEvent(name, wrapper) {
        if ('function' != typeof _global$().CustomEvent) {
            let e = document.createEvent('HTMLEvents');
            e.detail = wrapper.detail;
            e.channel = wrapper.channel;
            e.initEvent(name, wrapper.bubbles, wrapper.cancelable);
            return e;
        }
        else {
            let customEvent = new (_global$()).CustomEvent(name, wrapper);
            customEvent.channel = wrapper.channel;
            return customEvent;
        }
    }
}
// noinspection JSUnusedGlobalSymbols
/**
 * Helper factory to create a dom broker
 */
export class BrokerBuilder {
    constructor() {
        this.scopeElement = window;
        this.channelGroup = DEFAULT_CHANNEL_GROUP;
        this.crypto = noEncryption;
        this.listeners = [];
    }
    withScopeElement(scopeElement) {
        this.scopeElement = scopeElement;
        return this;
    }
    withListener(channel, ...listeners) {
        Stream.of(...listeners).each(listener => {
            this.listeners.push({
                channel: channel,
                listener: listener
            });
        });
        return this;
    }
    withChannelGroup(channelGroup) {
        this.channelGroup = channelGroup;
        return this;
    }
    withCrypto(crypto) {
        this.crypto = crypto;
        return this;
    }
    build() {
        let broker = new Broker(this.scopeElement, this.channelGroup, this.crypto);
        Stream.of(...this.listeners).each(listenerItem => {
            broker.registerListener(listenerItem.channel, listenerItem.listener);
        });
        return broker;
    }
}
//# sourceMappingURL=Messaging.js.map