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
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const vendors =  await vendorModel.getAllVendors(partner.id);
  console.log(vendors.length);
  const commodity_arr = [];
  for (let i = 0; i < vendors.length; i++) {
    const commodities = await commodityModel.getCommodities(vendors[i].id);
    if (commodities) {
      commodities.forEach(element => commodity_arr.push(element));
    }
  }
  console.log(commodity_arr);
  res.status(200).send(commodity_arr);
});

router.post('/create', auth, async(req, res, next) => {
  const {vendor_name, name, batch_no, origin, brand, amount, unit, MFG, EXP, unit_price, gross_price, note} = req.body;
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const vendor =  await vendorModel.getVendorByName(vendor_name, partner.id);
  const success = await commodityModel.createCommodity({
    vendor_id: vendor.id,
    name: name,
    batch_no: batch_no,
    origin: origin,
    brand: brand,
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
  const {vendor_name, name, batch_no, origin, brand, amount, unit, MFG, EXP, unit_price, gross_price, note} = req.body;
  const partner = await partnerModel.getPartnerByUserId(req.user_id);
  const vendor =  await vendorModel.getVendorByName(vendor_name, partner.id);
  const success = await commodityModel.updateCommodity({
    commodity_id: req.params.commodity_id,
    vendor_id: vendor.id,
    name: name,
    batch_no: batch_no,
    origin: origin,
    brand: brand,
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

module.exports = router;