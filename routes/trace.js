const express = require('express');
const moment = require('moment');

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
  const {product_id, amount, create_date, time_period, batch} = req.body;
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const product = await productModel.getProductById(product_id);
  const trace_no = moment(create_date).format('YYYYMMDD') + time_period[0].value + batch + product.product_uuid;
  console.log(trace_no);
  const success = await traceModel.createTraceability({
    trace_no: trace_no,
    partner_id: partner.partner_id,
    product_id: product_id,
    amount: amount,
    create_date: create_date,
    time_period: time_period[0].value,
    batch: batch
  });

  if (success) {
    const result = {
      trace_id: trace_no
    }
    return res.status(200).send(result);
  } else {
    return res.status(403).send("Create traceability failed");
  }
});

router.get("/:trace_id/view", auth, async (req, res) => {
  const traceability = await traceModel.getTraceabilityById(req.params.trace_id);
  console.log(traceability);
  const product = await productModel.getProductById(traceability.product_id);
  const commodities = await traceModel.getTraceCommodities(req.params.trace_id);
  
  let staple_food = []; 
  let main_dish = [];
  let side_dish = [];
  let others = [];
  for (element of commodities) {
    let commodity;
    if (element.tmp === 0) {    // 選擇進貨
      commodity = await commodityModel.getCommodityById(element.commodity_id);
    } else {                    // 填寫進貨
      commodity = await commodityModel.getTmpCommodityById(element.commodity_id); 
    }
    
    if (element.type === 'staple_food') {
      staple_food.push({
        commodity_id: element.commodity_id,
        commodity_name: commodity.name,
        create_at: commodity.create_at,
        amount: element.amount,
        unit: commodity.unit
      });
    } else if (element.type === 'main_dish') {
      main_dish.push({
        commodity_id: element.commodity_id,
        commodity_name: commodity.name,
        create_at: commodity.create_at,
        amount: element.amount,
        unit: commodity.unit
      });
    } else if (element.type === 'side_dish') {
      side_dish.push({
        commodity_id: element.commodity_id,
        commodity_name: commodity.name,
        create_at: commodity.create_at,
        amount: element.amount,
        unit: commodity.unit
      });
    } else if (element.type === 'others') {
      others.push({
        commodity_id: element.commodity_id,
        commodity_name: commodity.name,
        create_at: commodity.create_at,
        amount: element.amount,
        unit: commodity.unit
      });
    } 
  }

  const result = {
    trace_id: req.params.trace_id,
    create_date: traceability.create_date,
    product_name: product.name,
    amount: traceability.amount,
    time_period: traceability.time_period,
    batch: traceability.batch,
    commodities: {
      staple_food: staple_food,
      main_dish: main_dish,
      side_dish: side_dish,
      others: others
    }
  }

  if (traceability) {
    return res.status(200).send(result);
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
    console.log(element.amount);
    console.log(commodity);
    console.log(commodity.amount);
    console.log(commodity.used);
    if (element.amount > (commodity.amount - commodity.used)) {
      return res.status(403).send("Failed to add commodity: amount cannot be larger than remain");
    }
    const success = await traceModel.addCommodity({
      trace_id: req.params.trace_id,
      commodity_id: element.commodity_id,
      amount: element.amount,
      type: element.type,
      tmp: 0
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

router.post('/:trace_id/add-tmp-commodity', auth, async (req, res) => {
  const {commodities_arr} = req.body;
  console.log(commodities_arr);
  const produce_period = "test";
  for (element of commodities_arr) {
    // insert to tmp_commodity (return id)
    const tmp_id = await commodityModel.createTmpCommodity({
      name: element.name,
      trace_no: element.trace_no,
      batch_no: element.batch_no,
      origin: element.origin,
      brand: element.brand,
      produce_period: produce_period,
      amount: element.amount,
      unit: element.unit,
      note: element.note
    });
    if (!tmp_id) {
      return res.status(403).send("Failed to add tmp commodity: insert error");
    }

    const success = await traceModel.addCommodity({
      trace_id: req.params.trace_id,
      commodity_id: tmp_id,
      amount: element.amount,
      type: element.type,
      tmp: 1
    });
    if (!success) {
      return res.status(403).send("Failed to add tmp commodity to trace: insert error");
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