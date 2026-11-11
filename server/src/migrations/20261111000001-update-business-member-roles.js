module.exports = {
  async up(qi, Sequelize) {
    // 1. Temporarily allow all legacy values
    await qi.sequelize.query(
      "ALTER TABLE `business_members` MODIFY COLUMN `role` ENUM('owner','admin','manager','staff','member','viewer') NOT NULL DEFAULT 'staff';"
    );
    // 2. Migrate legacy 'member' and 'viewer' to 'staff'
    await qi.sequelize.query(
      "UPDATE `business_members` SET `role` = 'staff' WHERE `role` IN ('member', 'viewer');"
    );
    // 3. Finalize strict 4 roles: owner, admin, manager, staff
    await qi.sequelize.query(
      "ALTER TABLE `business_members` MODIFY COLUMN `role` ENUM('owner','admin','manager','staff') NOT NULL DEFAULT 'staff';"
    );

    // Data sanity check: businesses with 0 owner rows
    const [missingOwners] = await qi.sequelize.query(
      "SELECT b.id, b.name FROM `businesses` b LEFT JOIN `business_members` bm ON b.id = bm.business_id AND bm.role = 'owner' WHERE bm.id IS NULL;"
    );
    if (missingOwners.length > 0) {
      console.warn('⚠️ Warning: Businesses with 0 owners found:', missingOwners);
    }
  },

  async down(qi, Sequelize) {
    await qi.sequelize.query(
      "ALTER TABLE `business_members` MODIFY COLUMN `role` ENUM('owner','admin','manager','staff','member') NOT NULL DEFAULT 'staff';"
    );
    await qi.sequelize.query(
      "UPDATE `business_members` SET `role` = 'member' WHERE `role` IN ('manager','staff');"
    );
    await qi.sequelize.query(
      "ALTER TABLE `business_members` MODIFY COLUMN `role` ENUM('owner','admin','member') NOT NULL DEFAULT 'member';"
    );
  },
};
