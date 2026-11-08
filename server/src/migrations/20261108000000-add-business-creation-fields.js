module.exports = {
  async up(qi, Sequelize) {
    const cols = await qi.describeTable('businesses');

    if (!cols.qr_prefix) {
      await qi.addColumn('businesses', 'qr_prefix', {
        type: Sequelize.STRING(50),
        allowNull: true, // Allow null initially to populate existing records safely
        unique: true,
      });

      // Populate existing business with a default QR prefix if needed
      await qi.sequelize.query(
        "UPDATE businesses SET qr_prefix = CONCAT('biz-', SUBSTRING(id, 1, 8)) WHERE qr_prefix IS NULL"
      );
    }

    if (!cols.contact_details) {
      await qi.addColumn('businesses', 'contact_details', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: 'Owner',
      });
    }

    if (!cols.address_line1) {
      await qi.addColumn('businesses', 'address_line1', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!cols.address_line2) {
      await qi.addColumn('businesses', 'address_line2', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!cols.city) {
      await qi.addColumn('businesses', 'city', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!cols.state) {
      await qi.addColumn('businesses', 'state', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!cols.pincode) {
      await qi.addColumn('businesses', 'pincode', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }
  },

  async down(qi) {
    const cols = await qi.describeTable('businesses');
    const toRemove = [
      'pincode',
      'state',
      'city',
      'address_line2',
      'address_line1',
      'contact_details',
      'qr_prefix',
    ];

    for (const name of toRemove) {
      if (cols[name]) {
        await qi.removeColumn('businesses', name);
      }
    }
  },
};
