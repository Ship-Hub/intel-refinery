const db =
  require("../../config/db");

const getPrimaryAccountForUser =
  async (
    userId
  ) => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            a.id,
            a.name,
            a.slug,
            a.status,
            am.role
          FROM account_members am
          JOIN accounts a
            ON a.id = am.account_id
          WHERE am.user_id = ?
          ORDER BY
            FIELD(am.role, 'owner', 'admin', 'member'),
            am.created_at ASC
          LIMIT 1
          `,
          [
            userId
          ]
        );

    return rows[0] ||
      null;
  };

module.exports = {
  getPrimaryAccountForUser
};
