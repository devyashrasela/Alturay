module.exports = {
  async up(qi, Sequelize) {
    const bizCols = await qi.describeTable('businesses');

    if (!bizCols.default_bill_due_days) {
      await qi.addColumn('businesses', 'default_bill_due_days', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }
  },

  async down(qi) {
    const bizCols = await qi.describeTable('businesses');
    if (bizCols.default_bill_due_days) {
      await qi.removeColumn('businesses', 'default_bill_due_days');
    }
  },
};
