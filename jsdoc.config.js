'use strict';

var packageJson = require('./package.json');
module.exports = {
    "tags": {
        "allowUnknownTags" : true
    },
    "templates": {
        "applicationName": "Ycc Engine v" + packageJson.version + " API文档",
        "meta": {
            "title": "Ycc Engine API文档",
            "description": "",
            "keyword": ""
        },
        "linenums": false
    }
};