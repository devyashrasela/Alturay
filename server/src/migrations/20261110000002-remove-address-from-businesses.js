module.exports = {
  async up(qi, Sequelize) {
    const cols = await qi.describeTable('businesses');

    if (cols.address) {
      // Migrate legacy string address into structured address fields where missing
      const [rows] = await qi.sequelize.query(
        "SELECT id, address, address_line1, address_line2, city, state, pincode FROM businesses WHERE address IS NOT NULL AND TRIM(address) != ''"
      );

      for (const row of rows) {
        if (!row.address_line1 && row.address) {
          const raw = String(row.address).trim();
          let line1 = '';
          let line2 = '';
          let city = row.city || '';
          let state = row.state || '';
          let pincode = row.pincode || '';

          // Check if pincode exists at the end
          const pinMatch = raw.match(/(?:-\s*|\s+)(\d{6})$/);
          if (pinMatch && !pincode) {
            pincode = pinMatch[1];
          }

          // Split parts by comma
          const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);

          if (parts.length >= 4) {
            line1 = parts[0];
            line2 = parts[1];
            if (!city) city = parts[2];
            if (!state) {
              const statePart = parts[3].replace(/-\s*\d{6}$/, '').trim();
              if (statePart) state = statePart;
            }
          } else if (parts.length === 3) {
            line1 = parts[0];
            line2 = parts[1];
            if (!city) {
              city = parts[2].replace(/-\s*\d{6}$/, '').trim();
            }
          } else if (parts.length === 2) {
            line1 = parts[0];
            line2 = parts[1];
          } else {
            line1 = raw;
          }

          if (!city && raw.toLowerCase().includes('gwalior')) {
            city = 'Gwalior';
            if (!state) state = 'Madhya Pradesh';
          }

          await qi.sequelize.query(
            `UPDATE businesses 
             SET address_line1 = :line1,
                 address_line2 = :line2,
                 city = :city,
                 state = :state,
                 pincode = :pincode
             WHERE id = :id`,
            {
              replacements: {
                id: row.id,
                line1: line1 || row.address_line1 || raw,
                line2: line2 || row.address_line2 || null,
                city: city || row.city || null,
                state: state || row.state || null,
                pincode: pincode || row.pincode || null,
              },
            }
          );
        }
      }

      // Remove the obsolete address column
      await qi.removeColumn('businesses', 'address');
    }
  },

  async down(qi, Sequelize) {
    const cols = await qi.describeTable('businesses');
    if (!cols.address) {
      await qi.addColumn('businesses', 'address', {
        type: Sequelize.TEXT,
        allowNull: true,
      });

      // Populate composite address from structured fields
      await qi.sequelize.query(`
        UPDATE businesses 
        SET address = CONCAT_WS(
          ', ',
          NULLIF(address_line1, ''),
          NULLIF(address_line2, ''),
          NULLIF(CONCAT_WS(', ', NULLIF(city, ''), NULLIF(CONCAT_WS(' - ', NULLIF(state, ''), NULLIF(pincode, '')), '')), '')
        )
      `);
    }
  },
};
