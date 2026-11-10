module.exports = {
  async up(qi, Sequelize) {
    // 1. Invoices table
    const invoiceCols = await qi.describeTable('invoices');

    if (!invoiceCols.description) {
      await qi.addColumn('invoices', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!invoiceCols.po_number) {
      await qi.addColumn('invoices', 'po_number', {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }

    if (!invoiceCols.payment_terms) {
      await qi.addColumn('invoices', 'payment_terms', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!invoiceCols.accepted_payment_methods) {
      await qi.addColumn('invoices', 'accepted_payment_methods', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!invoiceCols.terms_and_conditions) {
      await qi.addColumn('invoices', 'terms_and_conditions', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!invoiceCols.shipping_address) {
      await qi.addColumn('invoices', 'shipping_address', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!invoiceCols.customer_email) {
      await qi.addColumn('invoices', 'customer_email', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    // 2. Invoice items table
    const itemCols = await qi.describeTable('invoice_items');

    if (!itemCols.description) {
      await qi.addColumn('invoice_items', 'description', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    // 3. Businesses table
    const bizCols = await qi.describeTable('businesses');

    if (!bizCols.default_payment_methods) {
      await qi.addColumn('businesses', 'default_payment_methods', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: ['cash'],
      });
    }

    if (!bizCols.default_payment_terms) {
      await qi.addColumn('businesses', 'default_payment_terms', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!bizCols.default_terms_and_conditions) {
      await qi.addColumn('businesses', 'default_terms_and_conditions', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!bizCols.default_due_days) {
      await qi.addColumn('businesses', 'default_due_days', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(qi) {
    const invoiceCols = await qi.describeTable('invoices');
    const colsToRemoveFromInvoices = [
      'description',
      'po_number',
      'payment_terms',
      'accepted_payment_methods',
      'terms_and_conditions',
      'shipping_address',
      'customer_email',
    ];
    for (const col of colsToRemoveFromInvoices) {
      if (invoiceCols[col]) {
        await qi.removeColumn('invoices', col);
      }
    }

    const itemCols = await qi.describeTable('invoice_items');
    if (itemCols.description) {
      await qi.removeColumn('invoice_items', 'description');
    }

    const bizCols = await qi.describeTable('businesses');
    const colsToRemoveFromBiz = [
      'default_payment_methods',
      'default_payment_terms',
      'default_terms_and_conditions',
      'default_due_days',
    ];
    for (const col of colsToRemoveFromBiz) {
      if (bizCols[col]) {
        await qi.removeColumn('businesses', col);
      }
    }
  },
};
