const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Business = sequelize.define('Business', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    qr_prefix: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    contact_details: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    tax_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address_line1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address_line2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'INR',
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    next_invoice_seq: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    next_bill_seq: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    invoice_template_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'classic',
    },
    bill_template_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'receipt',
    },
    receipt_paper_width: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 80,
    },
  }, {
    tableName: 'businesses',
    timestamps: true,
    underscored: true,
  });

  return Business;
};
