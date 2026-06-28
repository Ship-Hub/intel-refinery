const db =
  require("../../config/db");

const createAccount =
  async ({
    name,
    slug
  }) => {
    const [result] =
      await db.promise()
        .query(
          `
          INSERT INTO accounts (
            name,
            slug
          )
          VALUES (?, ?)
          `,
          [
            name,
            slug
          ]
        );

    return getAccountById(
      result.insertId
    );
  };

const getAccountById =
  async (
    accountId
  ) => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            id,
            name,
            slug,
            status,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM accounts
          WHERE id = ?
          LIMIT 1
          `,
          [
            accountId
          ]
        );

    return rows[0] ||
      null;
  };

const listAccounts =
  async () => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            a.id,
            a.name,
            a.slug,
            a.status,
            a.created_at AS createdAt,
            COALESCE(SUM(p.amount_cents), 0) AS totalPaidCents,
            COALESCE((
              SELECT cl.balance_after
              FROM credit_ledger cl
              WHERE cl.account_id = a.id
              ORDER BY cl.id DESC
              LIMIT 1
            ), 0) AS creditBalance
          FROM accounts a
          LEFT JOIN payments p
            ON p.account_id = a.id
            AND p.status = 'paid'
          GROUP BY a.id
          ORDER BY a.created_at DESC
          `
        );

    return rows;
  };

const getAccountOverviewById =
  async (
    accountId
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
            a.created_at AS createdAt,
            a.updated_at AS updatedAt,
            COALESCE(SUM(p.amount_cents), 0) AS totalPaidCents,
            COALESCE((
              SELECT cl.balance_after
              FROM credit_ledger cl
              WHERE cl.account_id = a.id
              ORDER BY cl.id DESC
              LIMIT 1
            ), 0) AS creditBalance
          FROM accounts a
          LEFT JOIN payments p
            ON p.account_id = a.id
            AND p.status = 'paid'
          WHERE a.id = ?
          GROUP BY a.id
          LIMIT 1
          `,
          [
            accountId
          ]
        );

    return rows[0] ||
      null;
  };

module.exports = {
  createAccount,
  getAccountById,
  getAccountOverviewById,
  listAccounts
};
