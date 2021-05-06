const AWS = require('aws-sdk');
const config = require('config');
const accessKeyId = config.get("accessKeyId");
const secretAccessKey = config.get("secretAccessKey");
const region = config.get("region");
const IS_OFFLINE = config.get("IS_OFFLINE");
if (!accessKeyId || !secretAccessKey || !region) {
    throw new Error('Environment varibales are missing');
}

AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: accessKeyId,
    region: region
 }
);



let docClient;
if (IS_OFFLINE) {
    docClient = new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
    })
}else{
    docClient = new AWS.DynamoDB.DocumentClient();
}

module.exports.docClient=docClient