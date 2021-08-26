const mysql = require('knex');

const {DB_URL, DB_USERNAME, DB_PASSWORD} = require('../config');

class TraceModel {
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

  async createTraceability(trace) {
    try {
      const {partner_id, product_no, amount, create_date} = trace;
      const result = await this.db('traceability').insert({
        partner_id: partner_id,
        product_no: product_no,
        amount: amount,
        create_date: create_date,
        print_amount: 0
      });
      return result[0];
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getTraceabilities(partner_id) {
    try {
      const result = await this.db('traceability')
        .where('partner_id', partner_id);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getTraceabilityById(trace_id) {
    try {
      const result = await this.db('traceability')
        .where('id', trace_id)
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async deleteTraceability(trace_id) {
    try {
      const result = await this.db('traceability')
        .where('id', trace_id)
        .del();
      if (result) {
        const result2 = await this.db('trace_commodity')
          .where('trace_id', trace_id)
          .del();
        return result2;
      }
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async addCommodity(data) {
    try {
      const {trace_id, commodity_id, amount, type} = data;
      const result = await this.db('trace_commodity')
        .insert({
          trace_id: trace_id,
          commodity_id: commodity_id,
          amount: amount,
          type: type
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getTraceCommodities(trace_id) {
    try {
      const result = await this.db('trace_commodity')
        .where('trace_id', trace_id)
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async updatePrintAmount(data) {
    try {
      const {trace_id, amount, operation} = data;
      let result;
      if (operation === 1) {
        result = await this.db('traceability')  // 加印
          .where('id', trace_id)
          .increment({
            amount: amount,
            print_amount: amount
          });
      } else if (operation === -1) {            // 作廢
        result = await this.db('traceability')
          .where('id', trace_id)
          .decrement({
            amount: amount,
          });
      } else if (operation === 0) {              // 補印
        result = await this.db('traceability')
          .where('id', trace_id)
          .increment({
            print_amount: amount
          });
      } else {
        console.log("Unknown operation");
        return null;
      }
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

module.exports = TraceModel;