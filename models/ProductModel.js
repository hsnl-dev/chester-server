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

  async getOptions() {
    try {
      const result = await this.db('product_options');
      const product_unit = result.filter(e => e.type === 'product_unit').map(e => e.value);
      const weight_unit = result.filter(e => e.type === 'weight_unit').map(e => e.value);
      const storage = result.filter(e => e.type === 'storage').map(e => e.value);
      return {
        product_unit: product_unit,
        weight_unit: weight_unit,
        storage: storage
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async initProduct(data) {
    try {
      const {uuid, product_no, partner_taxId} = data;
      const result = await this.db('product_uuid').insert({
        uuid: uuid,
        product_no: product_no,
        partner_taxId: partner_taxId
      });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

module.exports = ProductModel;