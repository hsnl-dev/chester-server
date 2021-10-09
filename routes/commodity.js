const express = require('express');

const PartnerModel = require('../models/PartnerModel');
const VendorModel = require('../models/VendorModel');
const CommodityModel = require('../models/CommodityModel');
const auth = require('../middlewares/auth');

const router = express.Router();
const partnerModel = new PartnerModel();
const vendorModel = new VendorModel();
const commodityModel = new CommodityModel();

router.get('/', auth, async(req, res, next) => {
  let result = {};
  if (req.admin === false) {
    const partner = await partnerModel.getPartnerByUserId(req.user_id);
    const vendors = await vendorModel.getAllVendors(partner.partner_id);
    console.log(vendors.length);
    const commodity_arr = [];
    for (let i = 0; i < vendors.length; i++) {
      const commodities = await commodityModel.getCommodities(vendors[i].id);
      if (commodities) {
        commodities.forEach(element => {
          if (element.activate === 1) {
            commodity_arr.push(element);
          }
        });
      }
    }
    result = {
      vendors: vendors,
      commodities: commodity_arr
    };
  }
  console.log(result);
  res.status(200).send(result);
});

router.post('/create', auth, async (req, res, next) => {
  const {vendor_id, name, trace_no, batch_no, origin, brand, produce_period, amount, unit, MFG, EXP, unit_price, gross_price, note} = req.body;
  const success = await commodityModel.createCommodity({
    vendor_id: parseInt(vendor_id),
    name: name,
    trace_no: trace_no,
    batch_no: batch_no,
    origin: origin,
    brand: brand,
    produce_period: produce_period,
    amount: amount,
    unit: unit,
    MFG: MFG,
    EXP: EXP,
    unit_price: unit_price,
    gross_price: gross_price,        
    note: note
  });
  if (success) {
    return res.status(200).send("Create commodity successful");
  } else {
    return res.status(403).send("Create commodity failed");
  }
});

router.post('/create-multiple', auth, async (req, res) => {
  const {commodities, vendor_id} = req.body;
  for (const com of commodities) {
    const success = await commodityModel.createCommodity({
      vendor_id: parseInt(vendor_id),
      name: com.name,
      trace_no: com.trace_no,
      batch_no: com.batch_no,
      origin: com.origin,
      brand: com.brand,
      produce_period: com.produce_period,
      amount: com.amount,
      unit: com.unit,
      MFG: com.MFG,
      EXP: com.EXP,
      unit_price: com.unit_price,
      gross_price: com.gross_price,        
      note: com.note
    });
    if (!success) {
      return res.status(403).send("Create commodities failed");
    }
  }
  return res.status(200).send("Create commodities successful");
});

router.get("/:commodity_id/view", auth, async (req, res) => {
  let commodity = await commodityModel.getCommodityById(req.params.commodity_id);
  if (commodity) {
    const vendor = await vendorModel.getVendorById(commodity['vendor_id']);
    commodity['vendor_name'] = vendor.name;
    return res.status(200).send(commodity);
  } else {
    return res.status(403).send("Commodity not found");
  }
});

router.post("/:commodity_id/edit", auth, async (req, res) => {
  const {name, trace_no, batch_no, origin, brand, produce_period, amount, unit, MFG, EXP, unit_price, gross_price, note} = req.body;
  const success = await commodityModel.updateCommodity({
    commodity_id: req.params.commodity_id,
    name: name,
    trace_no: trace_no,
    batch_no: batch_no,
    origin: origin,
    brand: brand,
    produce_period: produce_period,
    amount: amount,
    unit: unit,
    MFG: MFG,
    EXP: EXP,
    unit_price: unit_price,
    gross_price: gross_price,        
    note: note
  });
  if (success) {
    return res.status(200).send("Update commodity successful");
  } else {
    return res.status(403).send("Update commodity failed");
  }
});

router.post("/:commodity_id/return", auth, async (req, res) => {
  const {amount, unit, reason} = req.body;
  const success = await commodityModel.returnCommodity({
    commodity_id: req.params.commodity_id,
    amount: amount,
    unit: unit,
    reason: reason
  });
  if (success === -1) {
    return res.status(403).json({
      status: 0,
      message: "Return amount cannot be larger than stock amount"
    });
  } else if (success) {
    return res.status(200).json({
      status: 1,
      update_amount: success,
      message: "Return commodity successful"
    });
  } else {
    return res.status(403).json({
      status: -1, 
      message: "Return commodity failed"
    });
  }
});

router.post("/:commodity_id/discard", auth, async (req, res) => {
  const {amount, unit, reason} = req.body;
  const success = await commodityModel.discardCommodity({
    commodity_id: req.params.commodity_id,
    amount: amount,
    unit: unit,
    reason: reason
  });
  if (success === -1) {
    return res.status(403).json({
      status: 0,
      message: "Discard amount cannot be larger than stock amount"
    });
  } else if (success) {
    return res.status(200).json({
      status: 1,
      update_amount: success,
      message: "Discard commodity successful"
    });
  } else {
    return res.status(403).json({
      status: -1, 
      message: "Discard commodity failed"
    });
  }
});

router.post("/return-multiple", auth, async (req, res) => {
  const {commodity_arr, reason} = req.body;
  try {
    let update_arr = [];
    console.log(commodity_arr);
    for (e of commodity_arr) {
      const update_amount = await commodityModel.returnCommodity({
        commodity_id: e.commodity_id,
        amount: e.amount,
        unit: e.unit,
        reason: reason
      });
      console.log(update_amount);
      update_arr.push({
        commodity_id: e.commodity_id,
        update_amount: parseFloat(update_amount)
      });
    }
    console.log(update_arr);
    return res.status(200).json({
      update_arr: update_arr
    });
  } catch (err) {
    return res.status(403).send("Return all failed");
  }
});

router.post("/discard-multiple", auth, async (req, res) => {
  const {commodity_arr, reason} = req.body;
  try {
    let update_arr = [];
    for (e of commodity_arr) {
      const update_amount = await commodityModel.discardCommodity({
        commodity_id: e.commodity_id,
        amount: e.amount,
        unit: e.unit,
        reason: reason
      });
      update_arr.push({
        commodity_id: e.commodity_id,
        update_amount: parseFloat(update_amount)
      });
    }
    return res.status(200).json({
      update_arr: update_arr
    });
  } catch (err) {
    return res.status(403).send("Return all failed");
  }
});

router.post("/create-vendor", auth, async (req, res) => {
  const {vendor_name, note} = req.body;
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const result = await vendorModel.createVendor({
    vendor_name: vendor_name,
    note: note,
    partner_id: partner.partner_id
  });
  if (result === -1) {
    res.status(200).json({
      status: 0,
      message: "Vendor already exists"
    });
  } else if (result) {
    res.status(200).json({
      status: 1,
      vendor_id: result,
      message: "Create vendor successful"
    });
  } else {
    res.status(403).json({
      status: -1,
      message: "Create vendor failed"
    });
  }
});

module.exports = router;