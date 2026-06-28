const db =
  require("../../config/db");

const createPayment =
  async ({
    accountId,
    amountCents,
    currency,
    creditsToGrant,
    description,
    provider
  }) => {
    const [result] =
      await db.promise()
        .query(
          `
          INSERT INTO payments (
            account_id,
            amount_cents,
            credits_to_grant,
            currency,
            status,
            provider,
            description
          )
          VALUES (?, ?, ?, ?, 'pending', ?, ?)
          `,
          [
            accountId,
            amountCents,
            creditsToGrant,
            currency,
            provider,
            description
          ]
        );

    return getPaymentById(
      result.insertId
    );
  };

const getPaymentById =
  async (
    paymentId
  ) => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            id,
            account_id AS accountId,
            amount_cents AS amountCents,
            credits_to_grant AS creditsToGrant,
            currency,
            status,
            provider,
            provider_payment_id AS providerPaymentId,
            description,
            paid_at AS paidAt,
            created_at AS createdAt
          FROM payments
          WHERE id = ?
          LIMIT 1
          `,
          [
            paymentId
          ]
        );

    return rows[0] ||
      null;
  };

const createPaymentAttempt =
  async ({
    paymentId,
    providerCode,
    providerReference,
    checkoutUrl,
    metadata =
      null
  }) => {
    const [result] =
      await db.promise()
        .query(
          `
          INSERT INTO payment_attempts (
            payment_id,
            provider_code,
            provider_reference,
            checkout_url,
            metadata
          )
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            paymentId,
            providerCode,
            providerReference,
            checkoutUrl,
            metadata
              ? JSON.stringify(
                  metadata
                )
              : null
          ]
        );

    return {
      id:
        result.insertId,
      paymentId,
      providerCode,
      providerReference,
      checkoutUrl
    };
  };

const getPaymentByAttemptReference =
  async ({
    providerCode,
    providerReference
  }) => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            p.id,
            p.account_id AS accountId,
            p.amount_cents AS amountCents,
            p.credits_to_grant AS creditsToGrant,
            p.currency,
            p.status,
            p.provider,
            p.provider_payment_id AS providerPaymentId,
            p.description,
            p.paid_at AS paidAt,
            p.created_at AS createdAt,
            pa.id AS paymentAttemptId
          FROM payment_attempts pa
          INNER JOIN payments p
            ON p.id = pa.payment_id
          WHERE
            pa.provider_code = ?
            AND pa.provider_reference = ?
          LIMIT 1
          `,
          [
            providerCode,
            providerReference
          ]
        );

    return rows[0] ||
      null;
  };

const markPaymentAttemptStatus =
  async ({
    paymentAttemptId,
    status
  }) => {
    await db.promise()
      .query(
        `
        UPDATE payment_attempts
        SET status = ?
        WHERE id = ?
        `,
        [
          status,
          paymentAttemptId
        ]
      );
  };

const markPaymentFailed =
  async ({
    paymentId
  }) => {
    await db.promise()
      .query(
        `
        UPDATE payments
        SET status = 'failed'
        WHERE
          id = ?
          AND status = 'pending'
        `,
        [
          paymentId
        ]
      );
  };

const markPaymentPaid =
  async ({
    paymentId,
    providerPaymentId
  }) => {
    const connection =
      await db.promise()
        .getConnection();

    try {
      await connection.beginTransaction();
      const [rows] =
        await connection.query(
          `
          SELECT *
          FROM payments
          WHERE id = ?
          FOR UPDATE
          `,
          [
            paymentId
          ]
        );
      const payment =
        rows[0];

      if (
        !payment
      ) {
        throw new Error(
          "Payment not found"
        );
      }

      if (
        payment.status ===
        "paid"
      ) {
        await connection.commit();
        return {
          alreadyPaid:
            true
        };
      }

      await connection.query(
        `
        UPDATE payments
        SET
          status = 'paid',
          provider_payment_id = ?,
          paid_at = NOW()
        WHERE id = ?
        `,
        [
          providerPaymentId,
          paymentId
        ]
      );
      if (
        payment.credits_to_grant >
        0
      ) {
        const [ledgerRows] =
          await connection.query(
            `
            SELECT balance_after
            FROM credit_ledger
            WHERE account_id = ?
            ORDER BY id DESC
            LIMIT 1
            FOR UPDATE
            `,
            [
              payment.account_id
            ]
          );
        const balance =
          Number(
            ledgerRows[0]?.balance_after ||
              0
          );

        await connection.query(
          `
          INSERT INTO credit_ledger (
            account_id,
            amount,
            balance_after,
            entry_type,
            reference_type,
            reference_id,
            description
          )
          VALUES (?, ?, ?, 'topup', 'payment', ?, ?)
          `,
          [
            payment.account_id,
            payment.credits_to_grant,
            balance +
              payment.credits_to_grant,
            String(
              paymentId
            ),
            payment.description ||
              "Payment top-up"
          ]
        );
      }

      await connection.commit();

      return {
        alreadyPaid:
          false
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

const listPayments =
  async ({
    accountId =
      null,
    status =
      null,
    limit =
      100
  } = {}) => {
    const filters =
      [];
    const params =
      [];

    if (
      accountId
    ) {
      filters.push(
        "p.account_id = ?"
      );
      params.push(
        accountId
      );
    }

    if (
      status
    ) {
      filters.push(
        "p.status = ?"
      );
      params.push(
        status
      );
    }

    const whereClause =
      filters.length
        ? `WHERE ${filters.join(
            " AND "
          )}`
        : "";
    params.push(
      limit
    );

    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            p.id,
            p.account_id AS accountId,
            a.name AS accountName,
            p.amount_cents AS amountCents,
            p.credits_to_grant AS creditsToGrant,
            p.currency,
            p.status,
            p.provider,
            p.provider_payment_id AS providerPaymentId,
            p.description,
            p.paid_at AS paidAt,
            p.created_at AS createdAt
          FROM payments p
          JOIN accounts a
            ON a.id = p.account_id
          ${whereClause}
          ORDER BY p.created_at DESC
          LIMIT ?
          `,
          params
        );

    return rows;
  };

const listPaymentAttempts =
  async ({
    paymentId =
      null,
    providerCode =
      null,
    status =
      null,
    limit =
      100
  } = {}) => {
    const filters =
      [];
    const params =
      [];

    if (paymentId) {
      filters.push(
        "pa.payment_id = ?"
      );
      params.push(
        paymentId
      );
    }
    if (providerCode) {
      filters.push(
        "pa.provider_code = ?"
      );
      params.push(
        providerCode
      );
    }
    if (status) {
      filters.push(
        "pa.status = ?"
      );
      params.push(
        status
      );
    }

    const whereClause =
      filters.length
        ? `WHERE ${filters.join(
            " AND "
          )}`
        : "";
    params.push(
      limit
    );

    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            pa.id,
            pa.payment_id AS paymentId,
            pa.provider_code AS providerCode,
            pa.provider_reference AS providerReference,
            pa.checkout_url AS checkoutUrl,
            pa.status,
            pa.metadata,
            pa.created_at AS createdAt,
            pa.updated_at AS updatedAt
          FROM payment_attempts pa
          ${whereClause}
          ORDER BY pa.created_at DESC
          LIMIT ?
          `,
          params
        );

    return rows;
  };

module.exports = {
  createPayment,
  getPaymentById,
  createPaymentAttempt,
  getPaymentByAttemptReference,
  markPaymentAttemptStatus,
  markPaymentFailed,
  markPaymentPaid,
  listPayments,
  listPaymentAttempts
};
