import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api, clearSessionToken, getStoredSessionToken } from "../../lib/api";

const WorkspaceAuthContext = createContext(null);

const getLoginTarget = (location) => {
  const redirect =
    `${location.pathname}${location.search}${location.hash}`;
  const params =
    new URLSearchParams({
      redirect,
      from:
        "workspace"
    });
  return `/login?${params.toString()}`;
};

function WorkspaceAuthLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-6 text-center">
      <div>
        <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-ink-5">
          Checking session
        </div>
        <div className="mt-3 h-1 w-44 overflow-hidden rounded-full bg-surface">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan" />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceAuthGate() {
  const location =
    useLocation();
  const [state, setState] =
    useState({
      loading: true,
      user: null
    });

  useEffect(
    () => {
      let canceled =
        false;
      const token =
        getStoredSessionToken();

      if (!token) {
        setState({
          loading: false,
          user: null
        });
        return () => {
          canceled =
            true;
        };
      }

      api.me()
        .then((result) => {
          if (canceled) {
            return;
          }

          setState({
            loading: false,
            user: result.user
          });
        })
        .catch(() => {
          clearSessionToken();
          if (canceled) {
            return;
          }

          setState({
            loading: false,
            user: null
          });
        });

      return () => {
        canceled =
          true;
      };
    },
    []
  );

  const value =
    useMemo(
      () => ({
        user:
          state.user,
        signOut:
          async () => {
            try {
              await api.logout();
            } catch {
              // Clearing the local token still signs this browser out.
            } finally {
              clearSessionToken();
              window.location.assign("/login");
            }
          }
      }),
      [state.user]
    );

  if (state.loading) {
    return <WorkspaceAuthLoading />;
  }

  if (!state.user) {
    return (
      <Navigate
        to={getLoginTarget(location)}
        replace
      />
    );
  }

  return (
    <WorkspaceAuthContext.Provider value={value}>
      <Outlet />
    </WorkspaceAuthContext.Provider>
  );
}

export const useWorkspaceAuth = () => {
  const value =
    useContext(
      WorkspaceAuthContext
    );

  if (!value) {
    throw new Error("useWorkspaceAuth must be used inside WorkspaceAuthGate");
  }

  return value;
};
