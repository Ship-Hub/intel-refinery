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
          "/console"
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
    <div className="grid min-h-screen place-items-center bg-void px-6 text-center text-white">
      <div>
        <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
          Completing sign in
        </div>
        <p className="mt-3 font-body text-base text-chrome">
          This window will close automatically.
        </p>
      </div>
    </div>
  );
}
