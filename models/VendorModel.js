const mysql = require('knex');

const {DB_URL, DB_USERNAME, DB_PASSWORD} = require('../config');

class VendorModel {
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

  async createVendor(vendor_name, partner_id) {
    try {
      const vendorExist = await this.db('vendor')
        .where('name', vendor_name)
        .where('partner_id', partner_id)
        .first();
      if (vendorExist) {
        console.log("Vendor already exist");
        return vendorExist[0];
      } else {
        const result = await this.db('vendor').insert({
          name: vendor_name,
          partner_id: partner_id
        });
        return result[0];
      }
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getVendorByName(vendor_name, partner_id) {
    try {
      const result = await this.db('vendor')
        .where('name', vendor_name)
        .where('partner_id', partner_id)
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getVendorById(vendor_id) {
    try {
      const result = await this.db('vendor')
        .where('id', vendor_id)
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getAllVendors(partner_id) {
    try {
      const result = await this.db('vendor')
        .where('partner_id', partner_id);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

module.exports = VendorModel;