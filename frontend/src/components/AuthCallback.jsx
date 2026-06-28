import { useEffect, useMemo } from "react";
import { storeSessionToken } from "../lib/api";

export default function AuthCallback() {
  const params =
    useMemo(
      () =>
        new URLSearchParams(
          window.location.search
        ),
      []
    );

  useEffect(
    () => {
      const token =
        params.get("token");
      const error =
        params.get("error");
      const payload =
        {
          type:
            "intel-refinery-auth",
          token,
          error:
            error || ""
        };

      if (token) {
        storeSessionToken(
          token
        );
      }

      if (window.opener) {
        window.opener.postMessage(
          payload,
          window.location.origin
        );
        window.close();
      } else if (token) {
        window.location.replace(
          "/"
        );
      } else {
        window.location.replace(
          `/login?error=${encodeURIComponent(payload.error || "Authentication failed")}`
        );
      }
    },
    [params]
  );

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-6 text-center text-ink-2">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan">
          Completing sign in
        </div>
        <p className="mt-3 text-sm text-ink-4">
          This window will close automatically.
        </p>
      </div>
    </div>
  );
}
