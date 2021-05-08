const config = require('config');
const express = require('express');
//const productRouter = require('./routers/productRouter');
var cors = require('cors')

const app = express();
app.use(express.json());
//app.use(cors());

app.options('*', cors());
app.get('/',function (req, res) {
    res.send('Hello World!');
});

app.get('/hello',function (req, res) {
    console.log("Hello World");
    res.send('Hello World!');
});

//app.use('/api/products',productRouter);


const port = process.env.PORT || 3000;
app.listen(port,()=>{console.log(`Listening on port ${port}`);});
