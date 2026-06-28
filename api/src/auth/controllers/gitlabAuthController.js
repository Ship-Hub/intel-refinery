const axios =
  require("axios");

const env =
  require(
    "../../config/env"
  );

const {
  createOrGetOAuthUser
} = require(
  "../../accounts/services/userIdentityService"
);

const {
  createUserSession
} = require(
  "../services/sessionService"
);

const GITLAB_AUTHORIZE_URL =
  "https://gitlab.com/oauth/authorize";

const GITLAB_TOKEN_URL =
  "https://gitlab.com/oauth/token";

const GITLAB_USER_URL =
  "https://gitlab.com/api/v4/user";

const getApiBase = (req) => {
  const proto =
    req.get(
      "x-forwarded-proto"
    ) ||
    req.protocol;
  const host =
    req.get(
      "x-forwarded-host"
    ) ||
    req.get("host");
  return `${proto}://${host}`;
};

const getAuthFrontendBase = (req) => {
  const configured =
    env.AUTH_FRONTEND_BASE_URL ||
    env.FRONTEND_BASE_URL ||
    getApiBase(req);

  try {
    const url =
      new URL(configured);
    return url.toString().replace(/\/$/, "");
  } catch {
    return configured;
  }
};

const isAllowedFrontendOrigin = (origin) => {
  try {
    const url =
      new URL(origin);
    return (
      url.origin === "https://intelrefinery.site" ||
      url.origin === "https://app.intelrefinery.site" ||
      url.origin === "http://localhost:5173" ||
      url.origin === "http://127.0.0.1:5173"
    );
  } catch {
    return false;
  }
};

const encodeState = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

const decodeState = (state) => {
  try {
    return JSON.parse(Buffer.from(state || "", "base64url").toString("utf8"));
  } catch {
    return {};
  }
};

const getRequestedFrontendBase = (req) => {
  const requested =
    req.query.frontend_origin;

  if (
    requested &&
    isAllowedFrontendOrigin(requested)
  ) {
    return String(requested).replace(/\/$/, "");
  }

  return getAuthFrontendBase(req);
};

const getCallbackFrontendBase = (req) => {
  const state =
    decodeState(req.query.state);

  if (
    state.frontendOrigin &&
    isAllowedFrontendOrigin(state.frontendOrigin)
  ) {
    return String(state.frontendOrigin).replace(/\/$/, "");
  }

  return getAuthFrontendBase(req);
};

const gitlabRedirect =
  (req, res) => {
    if (!env.GITLAB_CLIENT_ID) {
      return res
        .status(503)
        .send(
          "GitLab OAuth is not configured on this server."
        );
    }

    const callbackUrl =
      `${getApiBase(req)}/auth/gitlab/callback`;
    const frontendBase =
      getRequestedFrontendBase(req);

    const params =
      new URLSearchParams({
        client_id:
          env.GITLAB_CLIENT_ID,
        redirect_uri:
          callbackUrl,
        response_type:
          "code",
        scope:
          "read_user",
        state:
          encodeState({
            frontendOrigin:
              frontendBase
          })
      });

    res.redirect(
      `${GITLAB_AUTHORIZE_URL}?${params}`
    );
  };

const gitlabCallback =
  async (req, res) => {
    const frontendBase =
      getCallbackFrontendBase(req);

    try {
      const {
        code,
        error: oauthError
      } = req.query;

      if (oauthError) {
        throw new Error(
          `GitLab denied access: ${oauthError}`
        );
      }

      if (!code) {
        throw new Error(
          "No authorization code received from GitLab."
        );
      }

      const callbackUrl =
        `${getApiBase(req)}/auth/gitlab/callback`;

      // Exchange code for access token
      const tokenRes =
        await axios.post(
          GITLAB_TOKEN_URL,
          {
            client_id:
              env.GITLAB_CLIENT_ID,
            client_secret:
              env.GITLAB_CLIENT_SECRET,
            code,
            grant_type:
              "authorization_code",
            redirect_uri:
              callbackUrl
          }
        );

      const accessToken =
        tokenRes.data
          .access_token;

      if (!accessToken) {
        throw new Error(
          "GitLab did not return an access token."
        );
      }

      // Fetch user profile
      const userRes =
        await axios.get(
          GITLAB_USER_URL,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`
            }
          }
        );

      const gitlabUser =
        userRes.data;

      const identity =
        await createOrGetOAuthUser({
          provider:
            "gitlab",
          providerUserId:
            String(
              gitlabUser.id
            ),
          email:
            gitlabUser.email ||
            null,
          displayName:
            gitlabUser.name ||
            gitlabUser.username,
          metadata: {
            username:
              gitlabUser.username,
            avatar_url:
              gitlabUser.avatar_url
          }
        });

      const session =
        await createUserSession({
          userId:
            identity.user.id
        });

      res.redirect(
        `${frontendBase}/auth/callback?token=${encodeURIComponent(session.token)}&provider=gitlab`
      );
    } catch (error) {
      res.redirect(
        `${frontendBase}/auth/callback?error=${encodeURIComponent(error.message)}&provider=gitlab`
      );
    }
  };

module.exports = {
  gitlabRedirect,
  gitlabCallback
};
