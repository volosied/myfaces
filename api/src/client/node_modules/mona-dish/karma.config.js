module.exports = function(config) {
    config.set({
        frameworks: ['jasmine-jquery',"jasmine", "karma-typescript"],
        files: [
            {
                pattern: 'html/**/*.html',
                watched: true,
                served: true,
                included: false
            },
            "src/main/**/*.ts",
            "src/test/**/*.ts"
            // *.tsx for React Jsx
        ],

        preprocessors: {
            "**/*.ts": ["karma-typescript"]
            // *.tsx for React Jsx
        },
        reporters: ["progress", "karma-typescript"],
        browsers: ["Chrome"],
        plugins: [
            'karma-chrome-launcher',
            'karma-jasmine-jquery',
            'karma-jasmine',
            'karma-typescript'
        ]
    });
};