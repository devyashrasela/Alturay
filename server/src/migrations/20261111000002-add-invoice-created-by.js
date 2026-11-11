module.exports = {
  async up(qi, Sequelize) {
    const cols = await qi.describeTable('invoices');

    if (!cols.created_by) {
      await qi.sequelize.query(
        "ALTER TABLE `invoices` ADD COLUMN `created_by` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL;"
      );
      await qi.sequelize.query(
        "ALTER TABLE `invoices` ADD CONSTRAINT `fk_invoices_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;"
      );
      await qi.sequelize.query(
        "CREATE INDEX `idx_invoices_created_by` ON `invoices` (`created_by`);"
      );
    }
  },

  async down(qi) {
    const cols = await qi.describeTable('invoices');
    if (cols.created_by) {
      try {
        await qi.sequelize.query("ALTER TABLE `invoices` DROP FOREIGN KEY `fk_invoices_created_by`;");
      } catch {
        /* foreign key drop ignore */
      }
      try {
        await qi.sequelize.query("DROP INDEX `idx_invoices_created_by` ON `invoices`;");
      } catch {
        /* index drop ignore */
      }
      await qi.sequelize.query("ALTER TABLE `invoices` DROP COLUMN `created_by`;");
    }
  },
};
