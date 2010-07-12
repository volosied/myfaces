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

/**
 *
 * Abstract base request encapuslating all methods and variables
 * shared over all different request objects
 *
 * Author: Werner Punz (latest modification by $Author: ganeshpuri $)
 * Version: $Revision: 1.4 $ $Date: 2009/05/31 09:16:44 $
 */
/** @namespace myfaces._impl.xhrCore._AjaxRequest */
myfaces._impl.core._Runtime.extendClass("myfaces._impl.xhrCore._BaseRequest", Object, {

    _Dom: myfaces._impl._util._Dom,
    _Lang: myfaces._impl._util._Lang,
    
    _contentType: "application/x-www-form-urlencoded",
    _source: null,
    _xhr: null,
    _encoding:null ,

    _context:null,
    _ajaxUtil: null,
    _sourceForm: null,
    _passThrough: null,
    _requestParameters: null,
    _exception: null,
    _timeout: null,
    _delay:null,
    _queueSize:-1,

    _partialIdsArray : null,
    //callbacks for onDone... done issues
    //onSuccess everything has passed through
    //onError server side error

    //onException exception thrown by the client
    //onWarning warning issued by the client
    _onDone : null,
    _onSuccess: null,
    _onError: null,
    _onException: null,
    _onWarning: null,
    _onTimeout:null,

    /*response object which is exposed to the queue*/
    _response: null,

    _timeoutId: null,

    /*all instance vars can be set from the outside
     * via a parameter map*/
    _ajaxType: "POST",

    /*
     * constants used internally
     */
    _CONTENT_TYPE:"Content-Type",
    _HEAD_FACES_REQ:"Faces-Request",

    _READY_STATE_DONE: 4,
    _STATUS_OK_MINOR: 200,
    _STATUS_OK_MAJOR: 300,

    _VAL_AJAX: "partial/ajax",

    //abstract methods which have to be implemented
    //since we do not have abstract methods we simulate them
    //by using empty ones
    constructor_: function() {
    },

    /**
     * send the request
     */
    send: function() {
    },

    /**
     * the callback function after the request is done
     */
    callback: function() {

    },

    //non abstract ones
    /**
     * Spec. 13.3.1
     * Collect and encode input elements.
     * Additionally the hidden element javax.faces.ViewState
     * @return {String} - Concatenated String of the encoded input elements
     *             and javax.faces.ViewState element
     */
    getViewState : function() {
        return this._ajaxUtil.encodeSubmittableFields(this._xhr, this._context, this._source,
                this._sourceForm, this._partialIdsArray);
    }
});