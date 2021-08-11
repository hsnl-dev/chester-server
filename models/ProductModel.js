const mysql = require('knex');

const {DB_URL, DB_USERNAME, DB_PASSWORD} = require('../config');

class ProductModel {
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

  async createProduct(product) {
    try {
      const {partner_id, product_no, name, spec, product_unit, price, weight, weight_unit, shelflife, shelflife_unit, storage, picture, picture_description, note} = product;
      const result = await this.db('product').insert({
        partner_id: partner_id,
        product_no: product_no,
        name: name,
        spec: spec,
        product_unit: product_unit,
        price: price,
        weight: weight,
        weight_unit: weight_unit,
        shelflife: shelflife,
        shelflife_unit: shelflife_unit,
        storage: storage,
        picture: picture,
        picture_description: picture_description,        
        note: note,
        activate: 1
      });
      return result[0];
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async updateProduct(product) {
    try {
      const {product_id, product_no, name, spec, product_unit, price, weight, weight_unit, shelflife, shelflife_unit, storage, picture, picture_description, note} = product;
      const result = await this.db('product')
        .where('id', product_id)
        .update({
          product_no: product_no,
          name: name,
          spec: spec,
          product_unit: product_unit,
          price: price,
          weight: weight,
          weight_unit: weight_unit,
          shelflife: shelflife,
          shelflife_unit: shelflife_unit,
          storage: storage,
          picture: picture,
          picture_description: picture_description,        
          note: note,
          activate: 1
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getProductById(product_id) {
    try {
      const result = await this.db('product')
        .where('id', product_id)
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getProducts(partner_id) {
    try {
      const result = await this.db('product')
        .where('partner_id', partner_id);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async deactivateProduct(product_id) {
    try {
      const result = await this.db('product')
        .where('id', product_id)
        .update({
          activate: 0
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async activateProduct(product_id) {
    try {
      const result = await this.db('product')
        .where('id', product_id)
        .update({
          activate: 1
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async createSpec(data) {
    const {partner_id, spec} = data;
    try {
      const specExist = await this.db('product_spec')
        .where('partner_id', partner_id)
        .where('spec', spec)
        .first();
      if (specExist) {
        console.log("Spec already exist");
        return specExist;
      } else {
        const result = await this.db('product_spec').insert({
          partner_id: partner_id,
          spec: spec
        });
        return result;
      }
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getSpecs(partner_id) {
    try {
      const result = await this.db('product_spec')
        .where('partner_id', partner_id);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async createProductUnit(data) {
    const {partner_id, unit} = data;
    try {
      const unitExist = await this.db('product_unit')
        .where('partner_id', partner_id)
        .where('unit', unit)
        .first();
      if (unitExist) {
        console.log("Unit already exist");
        return unitExist;
      } else {
        const result = await this.db('product_unit').insert({
          partner_id: partner_id,
          unit: unit
        });
        return result;
      }
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getProductUnits(partner_id) {
    try {
      const result = await this.db('product_unit')
        .where('partner_id', partner_id);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

module.exports = ProductModel;