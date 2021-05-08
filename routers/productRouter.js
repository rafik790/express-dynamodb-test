const Joi = require('joi');
const DB_TABLE = 'products-table-dev';
const express = require('express');
const router = express.Router();
const authorization = require('../middleware/authorization');
const {docClient} = require('../startup/db');
let uniqid = require('uniqid');

const headers= {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

// Get all products endpoint
router.get('/', async (req, res)=> {
  const params = {
    TableName: DB_TABLE
  }
  
  docClient.scan(params, (error, data) => {
    if (error) {
      return res.header(headers).status(error.statusCode).json({ error: error.message });
    }

    return res.header(headers).json(data);
  });


});

// Get all products endpoint
router.post('/filter',authorization, function (req, res) {

  const {pagesize,startKey} = req.body;
  const params = {
    TableName: DB_TABLE,
    Limit:pagesize,
    ScanIndexForward: true // true or fale to sort bt "date" Sort\Range key ascending or descending
  }

  if (startKey) {
    params.ExclusiveStartKey = {"id": startKey}
  }


  docClient.scan(params, (error, data) => {
    if (error) {
      return res.header(headers).status(error.statusCode).json({ error: error.message });
    }

    res.header(headers).json(data);
  });
})

// Get endpoint
router.get('/:id',authorization, function (req, res) {
    const params = {
      TableName: DB_TABLE,
      Key: {
        id: req.params.id,
      },
    }
  
    docClient.get(params, (error, result) => {
      if (error) {
        return res.header(headers).status(error.statusCode).json({ error: error.message });
      }

      if (!result.Item) {
        return res.header(headers).status(404).json({ error: "Product not found" });
      }

      const {id, product_name, product_price} = result.Item;
      return res.header(headers).json({ id, product_name,product_price });
    });

})

// Create endpoint
router.post('/',authorization, function (req, res) {
    const { error } = validate(req.body); 
    if (error) return res.header(headers).status(400).json({ error: error.details[0].message });

    const {product_name, product_price } = req.body;
    const id = uniqid();
  
    const params = {
      TableName: DB_TABLE,
      Item: {
        id: id,
        product_name: product_name,
        product_price:product_price
      },
    };
    
    docClient.put(params, (error,data) => {
      if (error) {
        return res.header(headers).status(error.statusCode).json({ error: error.message });
      }
      res.header(headers).json({ id, product_name,product_price });
    });
    
})


// Update endpoint
router.put('/:id',authorization, async function (req, res) {
  const { error } = validate(req.body); 
  if (error) return res.header(headers).status(400).json({ error: error.details[0].message });

  const { product_name, product_price } = req.body;

  const params = {
    TableName: DB_TABLE,
    Key:{
      id:req.params.id
    },
    UpdateExpression: "set product_name=:product_name,product_price=:product_price",
    ExpressionAttributeValues: {
      ":product_name":product_name,
      ":product_price":product_price
    },
    ReturnValues: "ALL_NEW"
  };

 
  docClient.update(params, (error,data) => {
    if (error) {
      return res.header(headers).status(error.statusCode).json({ error: error.message });
    }

    res.header(headers).json(data.Attributes);
  });
})

// Delete User endpoint
router.delete('/:id',authorization, function (req, res) {
  const params = {
    TableName: DB_TABLE,
    Key:{
      id:req.params.id
    }
  };

  docClient.delete(params, (error,data) => {
    if (error) {
      return res.header(headers).status(error.statusCode).json({ error: error.message });
    }
    res.header(headers).json(data);
    //res.send(data);
  });
})

function validate(product) {
  const schema = {
    product_name: Joi.string().min(5).max(50).required(),
    product_price: Joi.number().min(5).max(1000).required()
  };

  return Joi.validate(product, schema);
}
module.exports = router; 