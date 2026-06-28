const db =
  require("../../config/db");

const slugify =
  (
    value
  ) =>
    String(
      value
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(
        0,
        220
      );

const createOrGetTelegramUser =
  async ({
    telegramUserId,
    displayName,
    username
  }) => {
    const connection =
      await db.promise()
        .getConnection();

    try {
      await connection.beginTransaction();
      const [identityRows] =
        await connection.query(
          `
          SELECT
            ai.user_id,
            u.display_name
          FROM auth_identities ai
          JOIN users u
            ON u.id = ai.user_id
          WHERE
            ai.provider = 'telegram'
            AND ai.provider_user_id = ?
          LIMIT 1
          `,
          [
            telegramUserId
          ]
        );

      let userId =
        identityRows[0]?.user_id;

      if (
        !userId
      ) {
        const safeDisplayName =
          displayName ||
          username ||
          `Telegram ${telegramUserId}`;
        const [userResult] =
          await connection.query(
            `
            INSERT INTO users (
              display_name
            )
            VALUES (?)
            `,
            [
              safeDisplayName
            ]
          );
        userId =
          userResult.insertId;

        await connection.query(
          `
          INSERT INTO auth_identities (
            user_id,
            provider,
            provider_user_id,
            display_name,
            metadata
          )
          VALUES (?, 'telegram', ?, ?, ?)
          `,
          [
            userId,
            telegramUserId,
            safeDisplayName,
            JSON.stringify({
              username:
                username ||
                null
            })
          ]
        );
      }

      const [memberRows] =
        await connection.query(
          `
          SELECT
            am.account_id
          FROM account_members am
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
      let accountId =
        memberRows[0]?.account_id;

      if (
        !accountId
      ) {
        const baseSlug =
          slugify(
            displayName ||
              username ||
              `telegram-${telegramUserId}`
          ) ||
          `telegram-${telegramUserId}`;
        const slug =
          `${baseSlug}-${telegramUserId}`;
        const [accountResult] =
          await connection.query(
            `
            INSERT INTO accounts (
              name,
              slug
            )
            VALUES (?, ?)
            `,
            [
              displayName ||
                username ||
                `Telegram ${telegramUserId}`,
              slug
            ]
          );
        accountId =
          accountResult.insertId;

        await connection.query(
          `
          INSERT INTO account_members (
            account_id,
            user_id,
            role
          )
          VALUES (?, ?, 'owner')
          `,
          [
            accountId,
            userId
          ]
        );
      }

      const [userRows] =
        await connection.query(
          `
          SELECT
            id,
            email,
            display_name AS displayName,
            platform_role AS platformRole,
            status
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [
            userId
          ]
        );
      const [accountRows] =
        await connection.query(
          `
          SELECT
            id,
            name,
            slug,
            status
          FROM accounts
          WHERE id = ?
          LIMIT 1
          `,
          [
            accountId
          ]
        );

      await connection.commit();

      return {
        user:
          userRows[0],
        account:
          accountRows[0]
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

const createOrGetGoogleUser =
  async ({
    googleUserId,
    email,
    displayName,
    picture =
      null
  }) => {
    const connection =
      await db.promise()
        .getConnection();

    try {
      await connection.beginTransaction();
      const [identityRows] =
        await connection.query(
          `
          SELECT ai.user_id
          FROM auth_identities ai
          WHERE
            ai.provider = 'google'
            AND ai.provider_user_id = ?
          LIMIT 1
          `,
          [
            googleUserId
          ]
        );

      let userId =
        identityRows[0]?.user_id;

      if (!userId) {
        const [userRows] =
          await connection.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [
              email
            ]
          );
        userId =
          userRows[0]?.id;
      }

      if (!userId) {
        const [userResult] =
          await connection.query(
            `
            INSERT INTO users (
              email,
              display_name
            )
            VALUES (?, ?)
            `,
            [
              email,
              displayName ||
                email
            ]
          );
        userId =
          userResult.insertId;
      }

      await connection.query(
        `
        INSERT INTO auth_identities (
          user_id,
          provider,
          provider_user_id,
          email,
          display_name,
          metadata
        )
        VALUES (?, 'google', ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          display_name = VALUES(display_name),
          metadata = VALUES(metadata)
        `,
        [
          userId,
          googleUserId,
          email,
          displayName ||
            email,
          JSON.stringify({
            picture
          })
        ]
      );

      const [memberRows] =
        await connection.query(
          `
          SELECT account_id
          FROM account_members
          WHERE user_id = ?
          ORDER BY
            FIELD(role, 'owner', 'admin', 'member'),
            created_at ASC
          LIMIT 1
          `,
          [
            userId
          ]
        );
      let accountId =
        memberRows[0]?.account_id;

      if (!accountId) {
        const baseSlug =
          slugify(
            displayName ||
              email.split(
                "@"
              )[0]
          ) ||
          `google-${googleUserId}`;
        const slug =
          `${baseSlug}-${googleUserId}`;
        const [accountResult] =
          await connection.query(
            `
            INSERT INTO accounts (
              name,
              slug
            )
            VALUES (?, ?)
            `,
            [
              displayName ||
                email,
              slug
            ]
          );
        accountId =
          accountResult.insertId;

        await connection.query(
          `
          INSERT INTO account_members (
            account_id,
            user_id,
            role
          )
          VALUES (?, ?, 'owner')
          `,
          [
            accountId,
            userId
          ]
        );
      }

      const [userRows] =
        await connection.query(
          `
          SELECT
            id,
            email,
            display_name AS displayName,
            platform_role AS platformRole,
            status
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [
            userId
          ]
        );
      const [accountRows] =
        await connection.query(
          `
          SELECT
            id,
            name,
            slug,
            status
          FROM accounts
          WHERE id = ?
          LIMIT 1
          `,
          [
            accountId
          ]
        );

      await connection.commit();

      return {
        user:
          userRows[0],
        account:
          accountRows[0]
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

const createOrGetOAuthUser =
  async ({
    provider,
    providerUserId,
    email =
      null,
    displayName =
      null,
    metadata =
      {}
  }) => {
    const connection =
      await db.promise()
        .getConnection();

    try {
      await connection.beginTransaction();

      // 1. Check existing identity
      const [identityRows] =
        await connection.query(
          `
          SELECT ai.user_id
          FROM auth_identities ai
          WHERE
            ai.provider = ?
            AND ai.provider_user_id = ?
          LIMIT 1
          `,
          [
            provider,
            String(
              providerUserId
            )
          ]
        );
      let userId =
        identityRows[0]
          ?.user_id;

      // 2. Link by email if no identity found
      if (
        !userId &&
        email
      ) {
        const [emailRows] =
          await connection.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
          );
        userId =
          emailRows[0]?.id;
      }

      // 3. Create new user if still not found
      if (!userId) {
        const safeName =
          displayName ||
          email ||
          `${provider}-${providerUserId}`;
        const [userResult] =
          await connection.query(
            `
            INSERT INTO users (
              email,
              display_name
            )
            VALUES (?, ?)
            `,
            [
              email ||
                null,
              safeName
            ]
          );
        userId =
          userResult.insertId;
      }

      // 4. Upsert the identity row
      await connection.query(
        `
        INSERT INTO auth_identities (
          user_id,
          provider,
          provider_user_id,
          email,
          display_name,
          metadata
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          email         = VALUES(email),
          display_name  = VALUES(display_name),
          metadata      = VALUES(metadata)
        `,
        [
          userId,
          provider,
          String(
            providerUserId
          ),
          email ||
            null,
          displayName ||
            null,
          JSON.stringify(
            metadata
          )
        ]
      );

      // 5. Ensure the user has an account
      const [memberRows] =
        await connection.query(
          `
          SELECT account_id
          FROM account_members
          WHERE user_id = ?
          ORDER BY
            FIELD(role, 'owner', 'admin', 'member'),
            created_at ASC
          LIMIT 1
          `,
          [userId]
        );
      let accountId =
        memberRows[0]
          ?.account_id;

      if (!accountId) {
        const nameForSlug =
          displayName ||
          (
            email
              ? email.split(
                  "@"
                )[0]
              : null
          ) ||
          `${provider}-${providerUserId}`;
        const baseSlug =
          slugify(
            nameForSlug
          ) ||
          `${provider}-${providerUserId}`;
        const slug =
          `${baseSlug}-${providerUserId}`;
        const [accountResult] =
          await connection.query(
            `
            INSERT INTO accounts (
              name,
              slug
            )
            VALUES (?, ?)
            `,
            [
              displayName ||
                email ||
                `${provider} ${providerUserId}`,
              slug
            ]
          );
        accountId =
          accountResult.insertId;

        await connection.query(
          `
          INSERT INTO account_members (
            account_id,
            user_id,
            role
          )
          VALUES (?, ?, 'owner')
          `,
          [
            accountId,
            userId
          ]
        );
      }

      const [userRows] =
        await connection.query(
          `
          SELECT
            id,
            email,
            display_name  AS displayName,
            platform_role AS platformRole,
            status
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [userId]
        );
      const [accountRows] =
        await connection.query(
          `
          SELECT
            id,
            name,
            slug,
            status
          FROM accounts
          WHERE id = ?
          LIMIT 1
          `,
          [accountId]
        );

      await connection.commit();

      return {
        user:
          userRows[0],
        account:
          accountRows[0]
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };

module.exports = {
  createOrGetTelegramUser,
  createOrGetGoogleUser,
  createOrGetOAuthUser
};
