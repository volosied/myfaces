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
import * as webpack from 'webpack';
import * as path from 'path';

const TerserPlugin = require('terser-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin-fixed');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;

export default  (env: any) => {

    let targetType: any = null;


    let setupTargetType = function () {
        targetType = env.TARGET_TYPE.replace(/\s+/gi, "");
    }
    setupTargetType();


    // noinspection JSUnusedGlobalSymbols
    const config: webpack.Configuration = {
        context: __dirname,
        entry: {
            Monad: "./src/main/typescript/Monad.ts",
            Lang: "./src/main/typescript/Lang.ts",
            DomQuery: "./src/main/typescript/DomQuery.ts",
            XmlQuery: "./src/main/typescript/XmlQuery.ts",
            Promise: "./src/main/typescript/Promise.ts",
            Stream: "./src/main/typescript/Stream.ts",
            Es2019Array: "./src/main/typescript/Es2019Array.ts",
            TagBuilder: "./src/main/typescript/TagBuilder.ts",
            Messaging: "./src/main/typescript/Messaging.ts",
            PromiseShim: "./src/main/typescript/PromiseShim.ts",
            index: "./src/main/typescript/index.ts",
            index_core: "./src/main/typescript/index_core.ts"
        },
        output: {
            filename: '[name].js',
            libraryTarget: targetType,
            globalObject: 'this',
            chunkFormat: 'commonjs',
            path: path.resolve(__dirname, './target/js/'+targetType+"/")
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js", ".json"]
        },
        mode: "production",
        target: "es5",
        module: {
            rules: [
                // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
                {test: /\.tsx?$/, use: ["ts-loader"], exclude: /node_modules/}
            ]

        },
        optimization: {
            minimizer: [new TerserPlugin({
                extractComments: false, // prevents TerserPlugin from extracting a [chunkName].js.LICENSE.txt file
                terserOptions: {
                    format: {
                        // Tell terser to remove all comments except for the banner added via LicenseWebpackPlugin.
                        // This can be customized further to allow other types of comments to show up in the final js file as well.
                        // See the terser documentation for format.comments options for more details.
                        comments: (astNode: any, comment: any) => (comment.value.startsWith('! licenses are at '))
                    }
                }
            })],
        },
        externals: {
            "rxjs": "rxjs",
            "crypto-js": "crypto-js"
        },
        plugins: [

            new webpack.SourceMapDevToolPlugin({
                filename: "[name].js.map"
            }),
            new FileManagerPlugin({
                onStart: {
                    delete: [
                        path.resolve(__dirname,'./dist/js/'+targetType+"/"),
                        path.resolve(__dirname,'./dist/typescript'),
                        path.resolve(__dirname,'./dist/types')
                    ]
                },
                onEnd: {
                    copy: [
                        {source: path.resolve(__dirname,'./target/types/main/typescript'), destination: path.resolve(__dirname,'./dist/types')},
                        {source: path.resolve(__dirname,'./src/main/typescript'), destination: path.resolve(__dirname,'./dist/typescript')},
                        {source: path.resolve(__dirname,'./target/js'), destination: path.resolve(__dirname,'./dist/js')}
                    ],
                    delete: [
                        path.resolve(__dirname,'./target/js'),
                        path.resolve(__dirname,'./target/types')
                    ]
                }
            }),
            new LicenseWebpackPlugin({
                addBanner: true,
                renderBanner: () => {
                    return `
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
 */`;
                },
                outputFilename: 'licenses.json',
                unacceptableLicenseTest: (licenseIdentifier: string) => {
                    return ['GPL', 'AGPL', 'LGPL', 'NGPL'].includes(licenseIdentifier)
                },

                stats: {
                    warnings: true,
                    errors: true
                }
            })
        ]
    }

    return config;
}

