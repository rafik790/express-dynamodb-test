const config = require('config');
const express = require('express');
const dynamodbRouter = require('./routers/dynamodb');

const app = express();
app.use(express.json());

app.get('/',function (req, res) {
    res.send('Hello World!');
});

app.get('/hello',function (req, res) {
    console.log("Hello World");
    res.send('Hello World!');
});
app.use('/api/dboperation',dynamodbRouter);

const port = process.env.PORT || 3000;
app.listen(port,()=>{console.log(`Listening on port ${port}`);});
