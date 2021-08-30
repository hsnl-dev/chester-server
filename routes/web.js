const express = require('express');

const PartnerModel = require('../models/PartnerModel');
const ProductModel = require('../models/ProductModel');
const CommodityModel = require('../models/CommodityModel');
const TraceModel = require('../models/TraceModel');
const auth = require('../middlewares/auth');

const router = express.Router();
const partnerModel = new PartnerModel();
const productModel = new ProductModel();
const commodityModel = new CommodityModel();
const traceModel = new TraceModel();

router.get('/', async(req, res) => {
  // const partner = await partnerModel.getPartnerByUserId(req.user_id);
  // const traceability =  await traceModel.getTraceabilities(partner.partner_id);
  // res.status(200).send(traceability);
});

router.post('/product/:product_no', async (req, res) => {
  const {trace_id, product_id, machine_id} = req.body;
  const traceability = traceModel.getTraceabilityById(trace_id);
  const partner_id = traceability.partner_id;
  const product = productModel.getProductById(product_id);

  const trace_commodity = traceModel.getTraceCommodities(trace_id);
  // for

  const partner = partnerModel.getPartnerData(partner_id);

  //const machine = 
  

});