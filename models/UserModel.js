const mysql = require('knex');
const crypto = require('crypto');

const {DB_URL, DB_USERNAME, DB_PASSWORD} = require('../config');
const DEFAULT_ROLE_ID = 1;

class UserModel {
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
      pool: {min: 0, max: 20}
    });
  }

  /**
   * roles: admin = 0, vendor = 1, clerk = 2
   * @param {*} data 
   * @returns 
   */
  async createUser(data) {
    const {username, role, name, email, phone, password} = data;
    const md5 = crypto.createHash('md5');
    try {
      const result = await this.db('users').insert({
        role: role,
        username: username,
        password: md5.update(password).digest('hex'),
        name: name.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, ''),
        phone: phone,
        email: email,
        activate: 1
      });
      return result[0];
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async updateUser(data) {
    const {user_id, username, role, name, phone, email} = data;
    try {
      const result = await this.db('users')
        .where('id', user_id)
        .update({
          username: username,
          role: role,
          name: name,
          phone: phone,
          email: email
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async activateUser(user_id) {
    try {
      const result = await this.db('users')
        .where('id', user_id)
        .update({
          activate: 1
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async deactivateUser(user_id) {
    try {
      const result = await this.db('users')
        .where('id', user_id)
        .update({
          activate: 0
        });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async hasRole(userID, roleName) {
    try {
      const results = await this.db('user_role').where('user_id', userID);
      for (const row of results) {
        const role = await this.db('roles').where('id', row.role_id);
        if (role.name === roleName) {
          return true;
        }
      }
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async existEmail(email) {
    try {
      const result = await this.db('users')
        .where('email', email)
        .first()
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async validAccount(username, password) {
    const md5 = crypto.createHash('md5');
    try {
      const result = await this.db('users')
        .where('username', username)
        .where('password', md5.update(password).digest('hex'))
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async isActivate(user_id) {
    try {
      const result = await this.db('users')
        .where('id', user_id)
        .first()
      return result.activate;
    } catch (err) {
      console.log(err);
      return null;
    } 
  }

  async addAccessToken(data) {
    const {user_id, token, expireAt} = data;
    try {
      const result = await this.db('access_token').insert({
        user_id: user_id,
        token: token,
        expire_at: expireAt,
      });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async verifyAccessToken(token) {
    try {
      const result = await this.db('access_token')
        .where('token', token)
        .where('expire_at', '>', this.db.raw('now()'))
        .first()
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getUserById(id) {
    try {
      const result = await this.db('users')
        .where('id', id)
        .first()
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getUserByUsername(username) {
    try {
      const result = await this.db('users')
        .where('username', username)
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async addResetPasswordToken(data) {
    const {user_id, token, expireAt} = data;
    try {  
      const result = await this.db('reset_password_token').insert({
        user_id: user_id,
        token: token,
        expire_at: expireAt,
      });
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async verifyResetPasswordToken(userID, token) {
    try {
      const result = await this.db('reset_password_token')
        .where('user_id', userID)
        .where('token', token)
        .first();
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async resetPassword(id, password) {
    try {
      const md5 = crypto.createHash('md5');
      await this.db('users')
        .where('id', id)
        .update({
          password: md5.update(password).digest('hex')
        });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async removePasswordToken(id, token) {
    try {
      await this.db('reset_password_token')
        .where('user_id', id)
        .where('token', token)
        .del();
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

}

module.exports = UserModel;