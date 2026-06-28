const db =
  require("../../config/db");

const getCurrentBalance =
  async (
    accountId,
    connection =
      db.promise()
  ) => {
    const [rows] =
      await connection.query(
        `
        SELECT balance_after
        FROM credit_ledger
        WHERE account_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [
          accountId
        ]
      );

    return Number(
      rows[0]?.balance_after ||
        0
    );
  };

const addLedgerEntry =
  async ({
    accountId,
    amount,
    entryType,
    referenceType =
      null,
    referenceId =
      null,
    description =
      null,
    createdByUserId =
      null
  }) => {
    const connection =
      await db.promise()
        .getConnection();

    try {
      await connection.beginTransaction();
      const balance =
        await getCurrentBalance(
          accountId,
          connection
        );
      const nextBalance =
        balance +
        amount;

      if (
        nextBalance <
        0
      ) {
        throw new Error(
          "Insufficient credits"
        );
      }

      const [result] =
        await connection.query(
          `
          INSERT INTO credit_ledger (
            account_id,
            amount,
            balance_after,
            entry_type,
            reference_type,
            reference_id,
            description,
            created_by_user_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            accountId,
            amount,
            nextBalance,
            entryType,
            referenceType,
            referenceId,
            description,
            createdByUserId
          ]
        );

      await connection.commit();

      return {
        id:
          result.insertId,
        balanceAfter:
          nextBalance
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

module.exports = {
  getCurrentBalance,
  addLedgerEntry
};
