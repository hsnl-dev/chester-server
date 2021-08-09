const express = require('express');

const PartnerModel = require('../models/PartnerModel');
const ProductModel = require('../models/ProductModel');
const auth = require('../middlewares/auth');

const router = express.Router();
const partnerModel = new PartnerModel();
const productModel = new ProductModel();

router.get('/', auth, async(req, res, next) => {
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const products =  await productModel.getProducts(partner.id);
  console.log(products);
  res.status(200).send(products);
});

router.post('/create', auth, async(req, res, next) => {
  const {product_no, name, spec, product_unit, price, weight, weight_unit, shelf_life, storage, picture, picture_description, note} = req.body;
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const success = await productModel.createProduct({
    partner_id: partner.id,
    product_no: product_no,
    name: name,
    spec: spec,
    product_unit: product_unit,
    price: price,
    weight: weight,
    weight_unit: weight_unit,
    shelf_life: shelf_life,
    storage: storage,
    picture: picture,
    picture_description: picture_description,        
    note: note
  });
  if (success) {
    return res.status(200).send("Create product successful");
  } else {
    return res.status(403).send("Create product failed");
  }
});

router.get("/:product_id/view", auth, async (req, res) => {
  const product = await productModel.getProductById(req.params.product_id);
  if (product) {
    return res.status(200).send(product);
  } else {
    return res.status(403).send("Product not found");
  }
});

router.post("/:product_id/edit", auth, async (req, res) => {
  const {product_no, name, spec, product_unit, price, weight, weight_unit, shelf_life, storage, picture, picture_description, note} = req.body;
  const success = await productModel.updateProduct({
    product_id: req.params.product_id,
    product_no: product_no,
    name: name,
    spec: spec,
    product_unit: product_unit,
    price: price,
    weight: weight,
    weight_unit: weight_unit,
    shelf_life: shelf_life,
    storage: storage,
    picture: picture,
    picture_description: picture_description,        
    note: note
  });
  if (success) {
    return res.status(200).send("Update product successful");
  } else {
    return res.status(403).send("Update product failed");
  }
});

router.post("/:product_id/deactivate", auth, async (req, res) => {
  const success = await productModel.deactivateProduct(req.params.product_id);
  if (success) {
    return res.status(200).send("Deactivate product successful");
  } else {
    return res.status(403).send("Deactivate product failed");
  }
});

module.exports = router;