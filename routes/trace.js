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

router.get('/', auth, async(req, res) => {
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const traceability =  await traceModel.getTraceabilities(partner.partner_id);
  res.status(200).send(traceability);
});

router.post('/create', auth, async (req, res) => {
  const {product_no, amount, create_date} = req.body;
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const success = await traceModel.createTraceability({
    partner_id: partner.partner_id,
    product_no: product_no,
    amount: amount,
    create_date: create_date
  });
  if (success) {
    return res.status(200).send("Create traceability successful");
  } else {
    return res.status(403).send("Create traceability failed");
  }
});

router.get("/:trace_id/view", auth, async (req, res) => {
  const traceability = await traceModel.getTraceabilityById(req.params.trace_id);
  if (traceability) {
    return res.status(200).send(traceability);
  } else {
    return res.status(403).send("Traceability not found");
  }
});

router.post('/:trace_id/add-commodity', auth, async (req, res) => {
  const {commodities_arr} = req.body;
  console.log(commodities_arr);
  for (element of commodities_arr) {
    const commodity = await commodityModel.getCommodityById(element.commodity_id);
    if (element.amount > (commodity.amount - commodity.used)) {
      return res.status(403).send("Failed to add commodity: amount cannot be larger than remain");
    }
    const success = await traceModel.addCommodity({
      trace_id: req.params.trace_id,
      commodity_id: element.commodity_id,
      amount: element.amount,
      type: element.type
    });
    if (!success) {
      return res.status(403).send("Failed to add commodity: insert error");
    }
    const success2 = await commodityModel.updateUsed(element.commodity_id, element.amount, 1);
    if (!success2) {
      return res.status(403).send("Failed to add commodity: update amount error");
    }
  };
  return res.status(200).send("Add commodity successful");
});

router.post("/:trace_id/delete", auth, async (req, res) => {
  const traceability = await traceModel.getTraceabilityById(req.params.trace_id);
  if (traceability.print_amount !== 0) {
    return res.status(403).send("Operation forbidden: cannot delete traceability which had already been printed");
  }

  const trace_commodities = await traceModel.getTraceCommodities(req.params.trace_id);
  if (trace_commodities) {
    for (element of trace_commodities) {
      const success = await commodityModel.updateUsed(element.commodity_id, element.amount, -1);
      if (!success) return res.status(403).send("Delete traceability failed: update commodity amount error");
    };
  }
  const success2 = await traceModel.deleteTraceability(req.params.trace_id);
  if (success2) {
    return res.status(200).send("Delete traceability successful");
  } else {
    return res.status(403).send("Delete traceability failed");
  }
});

router.post("/:trace_id/print", auth, async (req, res) => {
  const {operation, amount} = req.body;
  const success = await traceModel.updatePrintAmount({
    trace_id: req.params.trace_id,
    amount: amount,
    operation: operation
  });
  if (success) {
    return res.status(200).send("Print traceability successful");
  } else {
    return res.status(403).send("Print traceability failed");
  }
});

module.exports = router;