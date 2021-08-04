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
      const {partner_id, product_no, name, spec, product_unit, price, weight, weight_unit, shelf_life, storage, picture, picture_description, note} = product;
      const result = await this.db('product').insert({
        partner_id: partner_id,
        product_no: product_no,
        name: name,
        spec: spec,
        product_unit: product_unit,
        price: price,
        weight: weight,
        weight_unit: weight_unit,
        shelf_life: shelf_life,
        storage: storage,
        picture: picture,
        picture_description: picture_description,        
        note: note
      });
      return result[0];
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async updateProduct(product) {
    try {
      const {product_id, product_no, name, spec, product_unit, price, weight, weight_unit, shelf_life, storage, picture, picture_description, note} = product;
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
          shelf_life: shelf_life,
          storage: storage,
          picture: picture,
          picture_description: picture_description,        
          note: note
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
}

module.exports = ProductModel;