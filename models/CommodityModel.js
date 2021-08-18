const mysql = require('knex');
const moment = require('moment-timezone');

const {DB_URL, DB_USERNAME, DB_PASSWORD} = require('../config');

class CommodityModel {
  constructor() {
    this.db = mysql({
      client: 'mysql',
      connection: {
        host: DB_URL,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: 'chester',
        timezone: '+08:00',
      },
      pool: {min: 0, max: 7}
    });
  }

  async createCommodity(commodity) {
    try {
      const {vendor_id, name, trace_no, batch_no, origin, brand, amount, unit, MFG, EXP, unit_price, gross_price, note} = commodity;
      const result = await this.db('commodity').insert({
        vendor_id: vendor_id,
        name: name,
        trace_no: trace_no,
        batch_no: batch_no,
        origin: origin,
        brand: brand,
        amount: amount,
        unit: unit,
        MFG: MFG,
        EXP: EXP,
        unit_price: unit_price,
        gross_price: gross_price,        
        note: note,
        activate: 1
      });
      return result[0];
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async updateCommodity(commodity) {
    try {
      const {commodity_id, vendor_id, name, trace_no, batch_no, origin, brand, amount, unit, MFG, EXP, unit_price, gross_price, note, update_at} = commodity;
      const result = await this.db('commodity')
        .where('id', commodity_id)
        .update({
          name: name,
          trace_no: trace_no,
          batch_no: batch_no,
          origin: origin,
          brand: brand,
          amount: amount,
          unit: unit,
          MFG: moment(MFG).tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss"),
          EXP: moment(EXP).tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss"),
          unit_price: unit_price,
          gross_price: gross_price,        
          note: note,
          activate: 1
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getCommodityById(commodity_id) {
    try {
      const result = await this.db('commodity')
        .where('id', commodity_id)
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getCommodities(vendor_id) {
    try {
      const result = await this.db('commodity')
        .where('vendor_id', vendor_id);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async returnCommodity(data) {
    try {
      const {commodity_id, amount, unit, reason} = data;
      const commodity = await this.getCommodityById(commodity_id);
      const update_amount = (commodity.amount - amount).toFixed(2);
      if (update_amount < 0) {
        return -1;
      }
      const success = await this.updateAmount(commodity_id, update_amount);
      if (success) {
        const result = await this.db('commodity_return').insert({
          commodity_id: commodity_id,
          amount: amount,
          unit: unit,
          reason: reason
        });
        if (result) {
          return update_amount;
        } else {
          await this.updateAmount(commodity_id, commodity.amount);
          return null;
        }
      } else {
        return null;
      }
    } catch (err) {
      console.log(err);
      return null;
    }
  }
    
  async discardCommodity(data) {
    try {
      const {commodity_id, amount, unit, reason} = data;
      const commodity = await this.getCommodityById(commodity_id);
      const update_amount = (commodity.amount - amount).toFixed(2);
      if (update_amount < 0) {
        return -1;
      }
      const success = await this.updateAmount(commodity_id, update_amount);
      if (success) {
        const result = await this.db('commodity_discard').insert({
          commodity_id: commodity_id,
          amount: amount,
          unit: unit,
          reason: reason
        });
        if (result) {
          return update_amount;
        } else {
          await this.updateAmount(commodity_id, commodity.amount);
          return null;
        }
      } else {
        return null;
      }
    } catch (err) {
      console.log(err);
      return null;
    }
  } 

  async updateAmount(commodity_id, amount) {
    try {
      const result = await this.db('commodity')
        .where('id', commodity_id)
        .update({
          amount: amount
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

module.exports = CommodityModel;