const db =
  require("../../config/db");

const createSubscription =
  async ({
    accountId,
    planId,
    status =
      "active",
    currentPeriodStart,
    currentPeriodEnd,
    provider =
      null,
    providerSubscriptionId =
      null
  }) => {
    const [result] =
      await db.promise()
        .query(
          `
          INSERT INTO subscriptions (
            account_id,
            plan_id,
            status,
            current_period_start,
            current_period_end,
            provider,
            provider_subscription_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            accountId,
            planId,
            status,
            currentPeriodStart,
            currentPeriodEnd,
            provider,
            providerSubscriptionId
          ]
        );

    return getSubscriptionById(
      result.insertId
    );
  };

const getSubscriptionById =
  async (
    subscriptionId
  ) => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            s.id,
            s.account_id AS accountId,
            s.plan_id AS planId,
            p.code AS planCode,
            p.name AS planName,
            s.status,
            s.current_period_start AS currentPeriodStart,
            s.current_period_end AS currentPeriodEnd,
            s.provider,
            s.provider_subscription_id AS providerSubscriptionId,
            s.created_at AS createdAt,
            s.updated_at AS updatedAt
          FROM subscriptions s
          JOIN plans p
            ON p.id = s.plan_id
          WHERE s.id = ?
          LIMIT 1
          `,
          [
            subscriptionId
          ]
        );

    return rows[0] ||
      null;
  };

const listSubscriptions =
  async (
    accountId =
      null
  ) => {
    const params =
      [];
    let whereClause =
      "";

    if (
      accountId
    ) {
      whereClause =
        "WHERE s.account_id = ?";
      params.push(
        accountId
      );
    }

    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            s.id,
            s.account_id AS accountId,
            a.name AS accountName,
            s.plan_id AS planId,
            p.code AS planCode,
            p.name AS planName,
            s.status,
            s.current_period_start AS currentPeriodStart,
            s.current_period_end AS currentPeriodEnd,
            s.provider,
            s.provider_subscription_id AS providerSubscriptionId,
            s.created_at AS createdAt,
            s.updated_at AS updatedAt
          FROM subscriptions s
          JOIN plans p
            ON p.id = s.plan_id
          JOIN accounts a
            ON a.id = s.account_id
          ${whereClause}
          ORDER BY s.created_at DESC
          `,
          params
        );

    return rows;
  };

module.exports = {
  createSubscription,
  getSubscriptionById,
  listSubscriptions
};
