const express = require('express');
const sha256 = require('crypto-js/sha256');
const moment = require('moment-timezone');

const PartnerModel = require('../models/PartnerModel');
const ProductModel = require('../models/ProductModel');
const CommodityModel = require('../models/CommodityModel');
const TraceModel = require('../models/TraceModel');
const auth = require('../middlewares/auth');
const {query, append} = require('../utils/ChesterResume');

const router = express.Router();
const partnerModel = new PartnerModel();
const productModel = new ProductModel();
const commodityModel = new CommodityModel();
const traceModel = new TraceModel();

const hash_data = async function (req, res) {
  const product = await productModel.getProductByUuid(req.body.product_uuid);
  const partner = await partnerModel.getPartnerData(product.partner_id);
  const traceability = await traceModel.getTraceabilityById(req.body.trace_no);
  const commodities = await traceModel.getTraceCommodities(traceability.trace_no);

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
    const url = "https://taft.coa.gov.tw/Resume/resulist.aspx?TraceCode=" + commodity.trace_no.replace('-', '');
    let bc_url = "";
    if (commodity.brand === "三光米" && commodity.produce_period && commodity.produce_period !== "") {
      bc_url = "https://fresh-io.web.app/dapp/1327?onShip=false";
    }
    if (element.type === 'staple_food') {
      staple_food.push({
        name: commodity.name,
        origin: commodity.origin,
        url: url,
        bc_url: bc_url
      });
    } else if (element.type === 'main_dish') {
      main_dish.push({
        name: commodity.name,
        origin: commodity.origin,
        url: url, 
        bc_url: bc_url
      });
    } else if (element.type === 'side_dish') {
      side_dish.push({
        name: commodity.name,
        origin: commodity.origin,
        url: url,
        bc_url: bc_url
      });
    } else if (element.type === 'others') {
      others.push({
        name: commodity.name,
        origin: commodity.origin,
        url: url,
        bc_url: bc_url
      });
    } 
  }
  const trace_id = req.body.trace_no + "-" + req.body.machine_id;
  const result = {
    trace_id: trace_id,
    product_uuid: product.uuid,
    product_name: product.name,
    product_price: product.price,
    product_picture: product.picture,
    partner_name: partner.name,
    partner_address: partner.address_city + partner.address_district + partner.address_street,
    partner_phone: partner.phone,
    partner_fdaId: partner.food_industry_id,
    commodities: {
      staple_food: staple_food,
      main_dish: main_dish,
      side_dish: side_dish,
      others: others
    },
    machine_temperature: req.body.temperature, 
    machine_timestamp: req.body.timestamp, 
    vendor_name: req.body.vendor_name, 
    vendor_address: req.body.vendor_address, 
    vendor_phone: req.body.vendor_phone, 
    vendor_fdaId: req.body.vendor_fdaId
  };
  console.log(JSON.stringify(result));
  const hash = sha256(JSON.stringify(result));
  const return_val = {
    trace_id: trace_id,
    hash: '0x' + hash,
    result: result
  }
  return return_val;
}

router.get('/:trace_id', async(req, res) => {
  // parse trace_id
  const arr = req.params.trace_id.split("-");
  const trace_no = arr[0];
  const machine_id = arr[1];
  const machine_info = await traceModel.getTraceMachineInfo(trace_no);
  if (!machine_info) {
    return res.status(403).send("Failed to get machine info");
  }
  req.body = {
    product_uuid: machine_info.product_uuid,
    trace_no: trace_no,
    machine_id: machine_id,
    temperature: machine_info.temperature,
    timestamp: moment(machine_info.timestamp).tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss"),
    vendor_name: machine_info.vendor_name,
    vendor_address: machine_info.vendor_address,
    vendor_phone: machine_info.vendor_phone,
    vendor_fdaId: machine_info.vendor_fdaId
  };

  // calculate hash
  const result = await hash_data(req, res);
  console.log(result.hash);
  // fetch blockchain
  const block_result = await query(result.trace_id);
  console.log(block_result);
  // compare, if same => return
  if (result.hash === block_result) {
    const return_val = {
      data: result.result,
      block_hash: machine_info.block_hash
    }
    return res.status(200).send(return_val); 
  } else {
    return res.status(403).send("Failed to get trace info: hash value wrong");
  }
});

router.post('/machine-info', async (req, res, next) => {
  const {trace_no, machine_id, temperature, timestamp, product_no, product_uuid, vendor_name, vendor_address, vendor_phone, vendor_fdaId} = req.body;
  const success = await traceModel.setTraceMachineInfo({
    trace_no: trace_no,
    machine_id: machine_id,
    temperature: temperature,
    timestamp: timestamp,
    product_no: product_no,
    product_uuid: product_uuid,
    vendor_name: vendor_name,
    vendor_address: vendor_address,
    vendor_phone: vendor_phone,
    vendor_fdaId: vendor_fdaId
  });
  if (success) {
    res.status(200).send("Succeed");
  } else {
    res.status(403).send("Failed");
  }
  next();
}, async (req, res) => {
  // hash => send to blockchain
  const result = await hash_data(req, res);
  console.log(result.hash);
  // to blockchain
  const block_result = await append(result.trace_id, result.hash);
  console.log(block_result);
  const success = await traceModel.setTraceBlockHash(req.body.trace_no, block_result.transactionHash);
  if (!success) {
    console.log("Failed to update block hash");
  }
});

router.post("/product-info", async (req, res) => {
  const {product_uuid, product_no, tax_id} = req.body;
  const success = await productModel.initProduct({
    uuid: product_uuid, 
    product_no: product_no, 
    partner_taxId: tax_id
  });
  
  if (success) {
    return res.status(200).send("Create product successful");
  } else {
    return res.status(403).send("Create product failed");
  }
});

module.exports = router;