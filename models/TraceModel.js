const mysql = require('knex');
const moment = require('moment-timezone');

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
      const {trace_no, partner_id, product_id, amount, create_date, time_period, batch} = trace;
      const result = await this.db('traceability').insert({
        trace_no: trace_no,
        partner_id: partner_id,
        product_id: product_id,
        amount: amount,
        create_date: moment(create_date).tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss"),
        time_period: time_period,
        batch: batch,
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
        .where('trace_no', trace_id)
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
        .where('trace_no', trace_id)
        .del();
      if (result) {
        const result2 = await this.db('trace_commodity')
          .where('id', trace_id)
          .del();
        return true;
      }
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async addCommodity(data) {
    try {
      const {trace_id, commodity_id, amount, type, tmp} = data;
      const result = await this.db('trace_commodity')
        .insert({
          trace_id: trace_id,
          commodity_id: commodity_id,
          amount: amount,
          type: type,
          tmp: tmp
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
        .where('trace_id', trace_id);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async setAmountPerMachine(data) {
    try {
      const {operation, trace_id, machine_id, amount} = data;
      let print_amount = 0;
      let op = "";
      if (operation === 0) {
        print_amount = amount;
        op = "reprint";
      } else if (operation === 1) {
        print_amount = amount;
        op = "add";
      } else if (operation === -1) {
        print_amount = -amount;
        op = "discard";
      } else {
        console.log("Unknown operation");
        return null;
      }
      const result = await this.db('trace_print')
        .insert({
          trace_id: trace_id,
          machine_id: machine_id,
          amount: print_amount,
          operation: op
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async updateTotalAmount(data) {
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

  async setTraceMachineInfo (data) {
    try {
      const {trace_no, machine_id, temperature, timestamp, product_no, product_uuid, vendor_name, vendor_address, vendor_phone, vendor_fdaId} = data;
      const result = await this.db('trace_machine_info').insert({
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
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

module.exports = TraceModel;