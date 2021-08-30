const express = require('express');

const PartnerModel = require('../models/PartnerModel');
const VendorModel = require('../models/VendorModel');
const ProductModel = require('../models/ProductModel');
const CommodityModel = require('../models/CommodityModel');
const TraceModel = require('../models/TraceModel');
const auth = require('../middlewares/auth');

const router = express.Router();
const partnerModel = new PartnerModel();
const vendorModel = new VendorModel();
const productModel = new ProductModel();
const commodityModel = new CommodityModel();
const traceModel = new TraceModel();

router.get('/', auth, async(req, res) => {
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const traceability = await traceModel.getTraceabilities(partner.partner_id);
  let return_arr = [];
  try {
    for (element of traceability) {
      const product = await productModel.getProductById(element.product_id);
      const data = {
        ...element,
        product_no: product.product_no,
        product_name: product.name
      }
      return_arr.push(data);
    };
  } catch (err) {
    res.status(403).send("Get traceability failed: internal server error");
  }
  res.status(200).send(return_arr);
});

router.post('/create', auth, async (req, res) => {
  const {product_id, amount, create_date} = req.body;
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  console.log(product_id);
  const success = await traceModel.createTraceability({
    partner_id: partner.partner_id,
    product_id: product_id,
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

router.get("/commodity", auth, async (req, res) => {
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const vendors = await vendorModel.getAllVendors(partner.partner_id);
  console.log(vendors.length);
  const commodity_arr = [];
  const commodity_name = new Set();
  for (let i = 0; i < vendors.length; i++) {
    const commodities = await commodityModel.getCommodities(vendors[i].id);
    if (commodities) {
      commodities.forEach(element => {
        if (element.activate === 1) {
          commodity_arr.push({
            commodity_id: element.id,
            name: element.name,
            trace_no: element.trace_no,
            remain_amount: element.amount - element.used,
            unit: element.unit,
            create_at: element.create_at,
          });
          commodity_name.add(element.name);
        }
      });
    }
  }
  const commodity_name_arr = [...commodity_name];
  const result = {
    commodities: commodity_arr,
    commodity_name: commodity_name_arr
  };
  console.log(result);
  res.status(200).send(result);
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
  console.log(req.params.trace_id);
  const traceability = await traceModel.getTraceabilityById(req.params.trace_id);
  if (traceability.print_amount !== 0) {
    return res.status(403).send("Operation forbidden: cannot delete traceability which had already been printed");
  }

  const trace_commodities = await traceModel.getTraceCommodities(req.params.trace_id);
  console.log(trace_commodities);
  if (trace_commodities) {
    if (trace_commodities.length !== 0) {
      for (element of trace_commodities) {
        const success = await commodityModel.updateUsed(element.commodity_id, element.amount, -1);
        if (!success) return res.status(403).send("Delete traceability failed: update commodity amount error");
      };
    } 
  }
  const success2 = await traceModel.deleteTraceability(req.params.trace_id);
  if (success2) {
    return res.status(200).send("Delete traceability successful");
  } else {
    return res.status(403).send("Delete traceability failed");
  }
});

router.post("/:trace_id/print", auth, async (req, res) => {
  const {operation, total_amount, print_array} = req.body;
  for (element of print_array) {
    const success = await traceModel.setAmountPerMachine({
      operation: operation,
      trace_id: req.params.trace_id,
      machine_id: element.machine_id,
      amount: element.amount
    });
    if (!success) {
      return res.status(403).send("Print traceability failed");
    } 
  }

  const success = await traceModel.updateTotalAmount({
    trace_id: req.params.trace_id,
    amount: total_amount,
    operation: operation
  });
  if (success) {
    return res.status(200).send("Print traceability successful");
  } else {
    return res.status(403).send("Print traceability failed");
  }
});

module.exports = router;