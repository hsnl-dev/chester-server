const mysql = require('knex');

const {DB_URL, DB_USERNAME, DB_PASSWORD} = require('../config');

class PartnerModel {
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

  async createPartner(partner) {
    // owner_id (user_id), name, phone, food_industry_id, address, note, tax_id
    try {
      const {owner_id, name, phone, food_industry_id, address_city, address_district, address_street, note, tax_id} = partner;
      const result = await this.db('partner').insert({
        name: name,
        phone: phone,
        owner_id:  owner_id,
        food_industry_id: food_industry_id,
        address_city: address_city,
        address_district: address_district,
        address_street: address_street,
        note: note,
        tax_id: tax_id
      });
      const linked = await this.addMember(result[0], owner_id, 1);
      return linked && result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getPartnerData(partner_id) {
    try {
      const result = await this.db('partner')
        .where("id", partner_id)
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async addMember(partnerID, userID, user_role) {
    try {
      const result = await this.db('partner_member').insert({
        partner_id: partnerID,
        user_id: userID,
        user_role: user_role
      });
      return result[0];
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async deleteMember(partner_id, user_id) {
    try {
      const result = await this.db('partner_member')
        .where('partner_id', partner_id)
        .where('user_id', user_id)
        .del();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getPartnerByUserId(user_id) {
    try {
      const result = await this.db('partner_member')
        .where("user_id", user_id)
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getPartnerMembers(partner_id) {
    try {
      const result = await this.db('partner_member')
        .where("partner_id", partner_id);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async addMachine(data) {
    try {
      const {partner_id, machine_name, machine_id} = data;
      const result = await this.db('partner_machine').insert({
        partner_id: partner_id,
        machine_name: machine_name,
        machine_id: machine_id
      });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getMachines(partner_id) {
    try {
      const result = await this.db('partner_machine')
        .where('partner_id', partner_id);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getTaxId(partner_id) {
    try {
      const result = await this.db('partner')
        .where('id', partner_id)
        .first();
      return result.tax_id;
    } catch (err) {
      console.log(err);
      return null;
    }
  } 
}

module.exports = PartnerModel;