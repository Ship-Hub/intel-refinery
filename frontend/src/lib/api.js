export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const SESSION_KEY =
  "intel_refinery_session_token";

export const getStoredSessionToken =
  () =>
    window.localStorage.getItem(
      SESSION_KEY
    );

export const storeSessionToken =
  (token) =>
    window.localStorage.setItem(
      SESSION_KEY,
      token
    );

export const clearSessionToken =
  () =>
    window.localStorage.removeItem(
      SESSION_KEY
    );

const request =
  async (
    path,
    {
      method =
        "GET",
      body,
      sessionToken =
        getStoredSessionToken()
    } = {}
  ) => {
    const response =
      await fetch(
        `${API_BASE_URL}${path}`,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
            ...(sessionToken
              ? {
                  Authorization:
                    `Bearer ${sessionToken}`
                }
              : {})
          },
          ...(body
            ? {
                body:
                  JSON.stringify(
                    body
                  )
              }
            : {})
        }
      );
    const payload =
      await response.json();

    if (
      !response.ok ||
      !payload.success
    ) {
      throw new Error(
        payload.error ||
          "Request failed"
      );
    }

    return payload.data;
  };

const formRequest =
  async (
    path,
    formData,
    {
      method =
        "POST",
      sessionToken =
        getStoredSessionToken()
    } = {}
  ) => {
    const response =
      await fetch(
        `${API_BASE_URL}${path}`,
        {
          method,
          headers: {
            ...(sessionToken
              ? {
                  Authorization:
                    `Bearer ${sessionToken}`
                }
              : {})
          },
          body:
            formData
        }
      );
    const payload =
      await response.json();

    if (
      !response.ok ||
      !payload.success
    ) {
      throw new Error(
        payload.error ||
          "Request failed"
      );
    }

    return payload.data;
  };

export const api =
  {
    docs:
      async () => {
        const response =
          await fetch(
            `${API_BASE_URL}/docs`
          );
        const payload =
          await response.json();

        if (
          !response.ok ||
          !payload.success
        ) {
          throw new Error(
            payload.error ||
              "Failed to load API docs"
          );
        }

        return payload;
      },
    verifyTelegramOtp:
      (code) =>
        request(
          "/auth/telegram/verify-otp",
          {
            method:
              "POST",
            body: {
              code
            },
            sessionToken:
              null
          }
        ),
    googleSignIn:
      (idToken) =>
        request(
          "/auth/google",
          {
            method:
              "POST",
            body: {
              idToken
            },
            sessionToken:
              null
          }
        ),
    me:
      () =>
        request(
          "/auth/me"
        ),
    logout:
      () =>
        request(
          "/auth/logout",
          {
            method:
              "POST"
          }
        ),
    account:
      () =>
        request(
          "/dashboard/account"
        ),
    apiKeys:
      () =>
        request(
          "/dashboard/api-keys"
        ),
    createApiKey:
      (label) =>
        request(
          "/dashboard/api-keys",
          {
            method:
              "POST",
            body: {
              label
            }
          }
        ),
    revokeApiKey:
      (apiKeyId) =>
        request(
          `/dashboard/api-keys/${apiKeyId}/revoke`,
          {
            method:
              "POST"
          }
        ),
    deleteApiKey:
      (apiKeyId) =>
        request(
          `/dashboard/api-keys/${apiKeyId}`,
          {
            method:
              "DELETE"
          }
        ),
    usage:
      () =>
        request(
          "/dashboard/usage"
        ),
    payments:
      () =>
        request(
          "/dashboard/payments"
        ),

    // ── Refinery: Projects ───────────────────────────────────────────────
    projects:
      () =>
        request("/api/projects"),

    createProject:
      (body) =>
        request("/api/projects", { method: "POST", body }),

    getProject:
      (id) =>
        request(`/api/projects/${id}`),

    updateProject:
      (id, body) =>
        request(`/api/projects/${id}`, { method: "PUT", body }),

    deleteProject:
      (id) =>
        request(`/api/projects/${id}`, { method: "DELETE" }),

    // ── Refinery: Sources ─────────────────────────────────────────────────
    projectSources:
      (projectId) =>
        request(`/api/sources/project/${projectId}`),

    getSource:
      (id) =>
        request(`/api/sources/${id}`),

    deleteSource:
      (id) =>
        request(`/api/sources/${id}`, { method: "DELETE" }),

    // ── Refinery: Pipeline ─────────────────────────────────────────────────
    startRefinement:
      (projectId) =>
        request(`/api/projects/${projectId}/refine`, { method: "POST" }),

    runReflection:
      (projectId) =>
        request(`/api/projects/${projectId}/reflection`, { method: "POST" }),

    projectStatus:
      (projectId) =>
        request(`/api/projects/${projectId}/status`),

    // ── Refinery: Model Overview ──────────────────────────────────────────
    modelOverview:
      (projectId) =>
        request(`/api/projects/${projectId}/model`),

    modelVersions:
      (projectId) =>
        request(`/api/projects/${projectId}/versions`),

    getModelVersion:
      (projectId, versionId) =>
        request(`/api/projects/${projectId}/versions/${versionId}`),

    latestModelVersion:
      (projectId) =>
        request(`/api/projects/${projectId}/versions/latest`),

    // ── Refinery: Artifacts ───────────────────────────────────────────────
    artifacts:
      (projectId, params) =>
        request(`/api/projects/${projectId}/artifacts?${new URLSearchParams(params || {})}`),

    getArtifact:
      (projectId, artifactId) =>
        request(`/api/projects/${projectId}/artifacts/${artifactId}`),

    artifactTypes:
      (projectId) =>
        request(`/api/projects/${projectId}/artifacts/types`),

    // Convenience artifact type queries
    hypotheses:
      (projectId) =>
        request(`/api/projects/${projectId}/hypotheses`),

    questions:
      (projectId) =>
        request(`/api/projects/${projectId}/questions`),

    people:
      (projectId) =>
        request(`/api/projects/${projectId}/people`),

    events:
      (projectId) =>
        request(`/api/projects/${projectId}/events`),

    gaps:
      (projectId) =>
        request(`/api/projects/${projectId}/gaps`),

    insights:
      (projectId) =>
        request(`/api/projects/${projectId}/insights`),

    patterns:
      (projectId) =>
        request(`/api/projects/${projectId}/patterns`),

    // ── Refinery: Connections ─────────────────────────────────────────────
    connections:
      (projectId, params) =>
        request(`/api/projects/${projectId}/connections?${new URLSearchParams(params || {})}`),

    getConnection:
      (projectId, connectionId) =>
        request(`/api/projects/${projectId}/connections/${connectionId}`),

    connectionTypes:
      (projectId) =>
        request(`/api/projects/${projectId}/connections/types`),

    // ── Refinery: Views ───────────────────────────────────────────────────
    views:
      (projectId) =>
        request(`/api/projects/${projectId}/views`),

    getView:
      (projectId, viewId) =>
        request(`/api/projects/${projectId}/views/${viewId}`),

    // ── Refinery: Runs ────────────────────────────────────────────────────
    runs:
      (projectId) =>
        request(`/api/projects/${projectId}/runs`),

    getRun:
      (projectId, runId) =>
        request(`/api/projects/${projectId}/runs/${runId}`),

    // â”€â”€ Cyber Refinery v1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    v1Projects:
      () =>
        request("/api/v1/projects"),

    createV1Project:
      (body) =>
        request("/api/v1/projects", { method: "POST", body }),

    getV1Project:
      (projectId) =>
        request(`/api/v1/projects/${projectId}`),

    updateV1Project:
      (projectId, body) =>
        request(`/api/v1/projects/${projectId}`, { method: "PATCH", body }),

    v1ProjectSources:
      (projectId) =>
        request(`/api/v1/projects/${projectId}/sources`),

    createV1RawSource:
      (projectId, body) =>
        request(`/api/v1/projects/${projectId}/sources/raw`, { method: "POST", body }),

    createV1UrlSource:
      (projectId, body) =>
        request(`/api/v1/projects/${projectId}/sources/url`, { method: "POST", body }),

    uploadV1Source:
      (projectId, formData) =>
        formRequest(`/api/v1/projects/${projectId}/sources/upload`, formData),

    updateV1Source:
      (projectId, sourceId, body) =>
        request(`/api/v1/projects/${projectId}/sources/${sourceId}`, { method: "PATCH", body }),

    v1SourcePackages:
      (projectId) =>
        request(`/api/v1/projects/${projectId}/source-packages`),

    createV1SourcePackage:
      (projectId, body) =>
        request(`/api/v1/projects/${projectId}/source-packages`, { method: "POST", body }),

    cyberReadiness:
      (projectId) =>
        request(`/api/v1/projects/${projectId}/cyber/readiness`),

    startV1Refinement:
      (projectId) =>
        request(`/api/v1/projects/${projectId}/refine`, { method: "POST" }),

    v1RunStatus:
      (projectId, runId = "latest") =>
        request(`/api/v1/projects/${projectId}/runs/${runId}`)
  };
