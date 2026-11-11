const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BusinessMember = sequelize.define('BusinessMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'manager', 'staff'),
      allowNull: false,
      defaultValue: 'staff',
    },
  }, {
    tableName: 'business_members',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'business_id'],
      },
    ],
  });

  return BusinessMember;
};
