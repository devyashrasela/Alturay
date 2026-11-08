'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const tables = await qi.showAllTables();
    if (!tables.includes('customers')) {
      await qi.createTable('customers', {
        id: {
          type: Sequelize.CHAR(36),
          primaryKey: true,
          allowNull: false,
        },
        business_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: {
            model: 'businesses',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        name: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        address_line1: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        address_line2: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        city: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        state: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        pincode: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      });

      await qi.addIndex('customers', ['business_id'], { name: 'idx_customers_business' });
      await qi.addIndex('customers', ['name'], { name: 'idx_customers_name' });
      await qi.addIndex('customers', ['phone'], { name: 'idx_customers_phone' });
    }

    const invoiceCols = await qi.describeTable('invoices');
    if (!invoiceCols.customer_id) {
      await qi.addColumn('invoices', 'customer_id', {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      await qi.addIndex('invoices', ['customer_id'], { name: 'idx_invoices_customer' });
    }
  },

  async down(qi) {
    const invoiceCols = await qi.describeTable('invoices');
    if (invoiceCols.customer_id) {
      await qi.removeColumn('invoices', 'customer_id');
    }
    const tables = await qi.showAllTables();
    if (tables.includes('customers')) {
      await qi.dropTable('customers');
    }
  },
};
