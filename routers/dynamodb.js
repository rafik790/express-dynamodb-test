const Joi = require('joi');
const AWS = require('aws-sdk');
const configDB = require('../db/dbconfig');
const express = require('express');
const router = express.Router();
let uniqid = require('uniqid');
AWS.config.update(configDB.aws_remote_config);
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName='products-table-dev';
router.get('/', async (req, res) => {
    const params = {
        TableName: tableName,
        Limit:5,
        ScanIndexForward: true
    };

    docClient.scan(params, function (err, data) {

        if (err) {
            console.log(err);
            res.send({
                success: false,
                message: err
            });
        }
        res.json(data);
    
    });

});

router.post('/',function (req, res) {
    const { error } = validate(req.body); 
    if (error) return res.status(400).json({ error: error.details[0].message });

    const {product_name, product_price } = req.body;
    const id = uniqid();
  
    const params = {
      TableName: tableName,
      Item: {
        id: id,
        product_name: product_name,
        product_price:product_price
      },
    };
  
    docClient.put(params, (error,data) => {
      if (error) {
        console.log(error);
        res.status(400).json({ error: 'Could not create product' });
      }

      res.json({ id, product_name,product_price });
    });
});

function validate(product) {
    const schema = {
      product_name: Joi.string().min(5).max(50).required(),
      product_price: Joi.number().min(5).max(1000).required()
    };
  
    return Joi.validate(product, schema);
}

module.exports = router; 
