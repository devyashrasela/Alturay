module.exports = {
  async up(qi, Sequelize) {
    const cols = await qi.describeTable('businesses');
    const add = (name, def) => (cols[name] ? null : qi.addColumn('businesses', name, def));

    await add('invoice_template_id', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'classic',
    });
    await add('bill_template_id', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'classic',
    });
    await add('receipt_paper_width', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 80,
    });
  },

  async down(qi) {
    const cols = await qi.describeTable('businesses');
    for (const name of ['receipt_paper_width', 'bill_template_id', 'invoice_template_id']) {
      if (cols[name]) {
        await qi.removeColumn('businesses', name);
      }
    }
  },
};
