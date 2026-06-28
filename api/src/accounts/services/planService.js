const db =
  require("../../config/db");

const createPlan =
  async ({
    code,
    name,
    monthlyPriceCents,
    monthlyCredits
  }) => {
    const [result] =
      await db.promise()
        .query(
          `
          INSERT INTO plans (
            code,
            name,
            monthly_price_cents,
            monthly_credits
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            code,
            name,
            monthlyPriceCents,
            monthlyCredits
          ]
        );

    return getPlanById(
      result.insertId
    );
  };

const getPlanById =
  async (
    planId
  ) => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            id,
            code,
            name,
            monthly_price_cents AS monthlyPriceCents,
            monthly_credits AS monthlyCredits,
            status,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM plans
          WHERE id = ?
          LIMIT 1
          `,
          [
            planId
          ]
        );

    return rows[0] ||
      null;
  };

const listPlans =
  async () => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            id,
            code,
            name,
            monthly_price_cents AS monthlyPriceCents,
            monthly_credits AS monthlyCredits,
            status,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM plans
          ORDER BY created_at DESC
          `
        );

    return rows;
  };

module.exports = {
  createPlan,
  getPlanById,
  listPlans
};
