const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');
const config = require('../config');

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    dialectModule: mysql2,
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Import models
const User = require('./User')(sequelize);
const Business = require('./Business')(sequelize);
const BusinessMember = require('./BusinessMember')(sequelize);
const Product = require('./Product')(sequelize);
const Invoice = require('./Invoice')(sequelize);
const InvoiceItem = require('./InvoiceItem')(sequelize);

// Define associations
// User <-> Business (many-to-many through BusinessMember)
User.belongsToMany(Business, { through: BusinessMember, foreignKey: 'user_id', otherKey: 'business_id', as: 'businesses' });
Business.belongsToMany(User, { through: BusinessMember, foreignKey: 'business_id', otherKey: 'user_id', as: 'users' });

User.hasMany(BusinessMember, { foreignKey: 'user_id', as: 'memberships' });
BusinessMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Business.hasMany(BusinessMember, { foreignKey: 'business_id', as: 'members' });
BusinessMember.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });

// Business -> Products
Business.hasMany(Product, { foreignKey: 'business_id', as: 'products' });
Product.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });

// Business -> Invoices
Business.hasMany(Invoice, { foreignKey: 'business_id', as: 'invoices' });
Invoice.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });

// Invoice -> InvoiceItems
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

// Product -> InvoiceItems (optional reference)
Product.hasMany(InvoiceItem, { foreignKey: 'product_id', as: 'invoiceItems' });
InvoiceItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Business,
  BusinessMember,
  Product,
  Invoice,
  InvoiceItem,
};
