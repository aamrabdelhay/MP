"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Archive,
  ClipboardList,
  KeyRound,
  LoaderCircle,
  LogOut,
  Search,
} from "lucide-react";
import { useLanguage } from "@/app/providers";
import { CopyButton } from "@/components/CopyButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RequestCard, formatRequestForCopy, getRequestFields, type AdminRequest, type RequestStatus } from "@/components/RequestCard";
import { Toast } from "@/components/Toast";
import { UniversityMark } from "@/components/UniversityMark";

type AuthState = "checking" | "locked" | "ready";
type ToastState = { message: string; type: "success" | "error" } | null;
type RequestsResponse = {
  requests: AdminRequest[];
  counts: { new: number; old: number };
  total: number;
  page: number;
  pageSize: number;
};

export function AdminDashboard() {
  const { language, t } = useLanguage();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [activeStatus, setActiveStatus] = useState<RequestStatus>("new");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [counts, setCounts] = useState({ new: 0, old: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const requestSequence = useRef(0);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    return () => {
      requestSequence.current += 1;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const loadRequests = useCallback(async (requestedPage = 1, append = false) => {
    const sequence = ++requestSequence.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setLoadError("");

    const params = new URLSearchParams({ status: activeStatus, page: String(requestedPage) });
    if (debouncedQuery) params.set("q", debouncedQuery);

    try {
      const response = await fetch(`/api/admin/requests?${params.toString()}`, { cache: "no-store" });
      if (sequence !== requestSequence.current) return;
      if (response.status === 401) {
        setAuthState("locked");
        setRequests([]);
        setLoginError(t.admin.loginRequired);
        return;
      }
      if (!response.ok) throw new Error("requests-unavailable");
      const result = (await response.json()) as RequestsResponse;
      if (sequence !== requestSequence.current) return;
      setRequests((current) => (append ? [...current, ...result.requests] : result.requests));
      setCounts(result.counts);
      setTotal(result.total);
      setPage(result.page);
    } catch {
      if (sequence === requestSequence.current) setLoadError(t.admin.requestsLoadError);
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [activeStatus, debouncedQuery, t.admin.loginRequired, t.admin.requestsLoadError]);

  useEffect(() => {
    if (authState !== "ready") return;
    const timer = window.setTimeout(() => { void loadRequests(1, false); }, 0);
    return () => window.clearTimeout(timer);
  }, [authState, loadRequests]);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const response = await fetch("/api/admin/requests?status=new&page=1", { cache: "no-store" });
        if (cancelled) return;
        setAuthState(response.ok ? "ready" : "locked");
      } catch {
        if (!cancelled) setAuthState("locked");
      }
    }
    void checkSession();
    return () => { cancelled = true; };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || loggingIn) return;
    setLoggingIn(true);
    setLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json().catch(() => ({}))) as { code?: string };
      if (response.status === 401) {
        setLoginError(t.admin.loginError);
      } else if (response.status === 429 || result.code === "RATE_LIMITED") {
        setLoginError(t.admin.tooManyAttempts);
      } else if (response.status === 503 || result.code === "LOGIN_UNAVAILABLE") {
        setLoginError(t.admin.loginServiceUnavailable);
      } else if (!response.ok) {
        setLoginError(t.admin.networkError);
      } else {
        setPassword("");
        setAuthState("ready");
      }
    } catch {
      setLoginError(t.admin.networkError);
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      requestSequence.current += 1;
      setAuthState("locked");
      setRequests([]);
      setCounts({ new: 0, old: 0 });
      setTotal(0);
      setPassword("");
      setLoginError("");
    }
  }

  async function changeStatus(request: AdminRequest, status: RequestStatus) {
    setBusyRequestId(request.id);
    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.status === 401) {
        setAuthState("locked");
        setLoginError(t.admin.loginRequired);
        return false;
      }
      if (!response.ok) throw new Error("status-update-failed");
      await loadRequests(1, false);
      return true;
    } catch {
      showToast(t.admin.statusUpdateError, "error");
      return false;
    } finally {
      setBusyRequestId(null);
    }
  }

  async function handleCopied(request: AdminRequest) {
    showToast(t.admin.copied);
    if (request.status === "new") await changeStatus(request, "old");
  }

  function handleCopyFailure() {
    showToast(t.admin.copyFailed, "error");
  }

  async function handleDelete(request: AdminRequest) {
    if (!window.confirm(t.admin.confirmDelete)) return;
    setBusyRequestId(request.id);
    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, { method: "DELETE" });
      if (response.status === 401) {
        setAuthState("locked");
        setLoginError(t.admin.loginRequired);
        return;
      }
      if (!response.ok) throw new Error("delete-failed");
      showToast(t.admin.deleted);
      await loadRequests(1, false);
    } catch {
      showToast(t.admin.deleteError, "error");
    } finally {
      setBusyRequestId(null);
    }
  }

  async function handleVisibleCopied() {
    showToast(t.admin.copied);
    const toArchive = requests.filter((request) => request.status === "new");
    if (toArchive.length) {
      setBusyRequestId("bulk");
      const results = await Promise.all(toArchive.map(async (request) => {
        try {
          const response = await fetch(`/api/admin/requests/${request.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "old" }),
          });
          if (response.status === 401) {
            setAuthState("locked");
            setLoginError(t.admin.loginRequired);
          }
          return response.ok;
        } catch {
          return false;
        }
      }));
      setBusyRequestId(null);
      if (results.some((result) => !result)) showToast(t.admin.statusUpdateError, "error");
      await loadRequests(1, false);
    }
  }

  const hasMore = requests.length < total;

  return (
    <main className="admin-page">
      {toast ? <Toast message={toast.message} type={toast.type} /> : null}
      <header className="admin-header">
        <div className="admin-header-brand">
          <UniversityMark />
          <div>
            <h1>{t.admin.title}</h1>
            <p>{t.admin.description}</p>
          </div>
        </div>
        <div className="admin-header-actions">
          <LanguageSwitcher />
          {authState === "ready" ? (
            <button className="icon-text-button" type="button" onClick={handleLogout}>
              <LogOut aria-hidden="true" size={15} />
              <span>{t.admin.logout}</span>
            </button>
          ) : null}
        </div>
      </header>

      {authState === "checking" ? (
        <div className="admin-loading" role="status">
          <LoaderCircle aria-hidden="true" size={21} />
          <span>{t.admin.loadingRequests}</span>
        </div>
      ) : null}

      {authState === "locked" ? (
        <section className="admin-login-card" aria-labelledby="admin-login-title">
          <div className="admin-login-emblem"><KeyRound aria-hidden="true" size={25} /></div>
          <h2 id="admin-login-title">{t.admin.accessLabel}</h2>
          <p>{t.admin.description}</p>
          <form onSubmit={handleLogin}>
            <label className="field-label" htmlFor="admin-password">{t.admin.passwordLabel}</label>
            <input
              className="field-control"
              id="admin-password"
              name="password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              placeholder={t.admin.passwordPlaceholder}
              value={password}
              onChange={(event) => {
                setPassword(event.currentTarget.value);
                setLoginError("");
              }}
              required
              aria-required="true"
              aria-invalid={Boolean(loginError)}
              autoFocus
            />
            {loginError ? <p className="field-hint field-hint--error" role="alert">{loginError}</p> : null}
            <button className="primary-button" type="submit" disabled={!password || loggingIn}>
              {loggingIn ? <LoaderCircle aria-hidden="true" size={17} className="button-spinner" /> : <KeyRound aria-hidden="true" size={16} />}
              <span>{loggingIn ? t.admin.loggingIn : t.admin.login}</span>
            </button>
          </form>
          <Link
            className="back-link admin-login-back-button"
            href="/"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              width: "100%",
              minHeight: 44,
              marginTop: 14,
              padding: "10px 14px",
              border: "1px solid rgba(24, 45, 74, 0.2)",
              borderRadius: 12,
              background: "rgba(255, 255, 255, 0.72)",
              textDecoration: "none",
            }}
          >
            <span aria-hidden="true">{language === "ar" ? "←" : "→"}</span>
            {t.admin.backToSite}
          </Link>
        </section>
      ) : null}

      {authState === "ready" ? (
        <section aria-label={t.admin.title}>
          <div className="admin-tabs-row">
            <div className="admin-tabs" role="tablist" aria-label={language === "ar" ? "حالة الطلب" : "Request status"}>
              <button
                className={`admin-tab${activeStatus === "new" ? " admin-tab--active" : ""}`}
                type="button"
                role="tab"
                id="tab-new"
                aria-selected={activeStatus === "new"}
                aria-controls="requests-panel"
                onClick={() => setActiveStatus("new")}
              >
                <span>{t.admin.newRequests}</span>
                <span className="admin-tab-count" aria-label={`${counts.new}`}>{counts.new}</span>
              </button>
              <button
                className={`admin-tab${activeStatus === "old" ? " admin-tab--active" : ""}`}
                type="button"
                role="tab"
                id="tab-old"
                aria-selected={activeStatus === "old"}
                aria-controls="requests-panel"
                onClick={() => setActiveStatus("old")}
              >
                <span>{t.admin.oldRequests}</span>
                <span className="admin-tab-count" aria-label={`${counts.old}`}>{counts.old}</span>
              </button>
            </div>
            <CopyButton
              value={requests.map((request) => formatRequestForCopy(getRequestFields(request, language, t.admin.noDepartment, {
                ...t.admin.fields,
                governmentUniversity: t.governmentUniversity,
                privateUniversity: t.privateUniversity,
              }))).join("\n\n────────────────────\n\n")}
              label={t.admin.copyVisible}
              accessibleLabel={t.admin.copyVisible}
              variant="text"
              className="admin-copy-visible"
              onCopied={handleVisibleCopied}
              onFailure={handleCopyFailure}
              disabled={requests.length === 0 || Boolean(busyRequestId)}
            />
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <Search aria-hidden="true" size={17} />
              <input
                className="admin-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder={t.admin.searchPlaceholder}
                aria-label={t.admin.searchPlaceholder}
                maxLength={100}
              />
            </div>
          </div>

          <div id="requests-panel" role="tabpanel" aria-labelledby={activeStatus === "new" ? "tab-new" : "tab-old"}>
            {loadError ? (
              <div className="form-message form-message--error" role="alert">
                <span>{loadError}</span>
                <button className="text-button" type="button" onClick={() => void loadRequests(1, false)}>
                  {language === "ar" ? "إعادة المحاولة" : "Retry"}
                </button>
              </div>
            ) : null}

            {loading ? (
              <div className="admin-loading" role="status">
                <LoaderCircle aria-hidden="true" size={21} />
                <span>{t.admin.loadingRequests}</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="admin-empty-state">
                <span className="admin-empty-icon">
                  {debouncedQuery ? <Search aria-hidden="true" size={21} /> : <Archive aria-hidden="true" size={21} />}
                </span>
                <p>{debouncedQuery ? t.admin.emptySearch : t.admin.emptyRequests}</p>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    busy={busyRequestId === request.id || busyRequestId === "bulk"}
                    onCopied={handleCopied}
                    onCopyFailure={handleCopyFailure}
                    onStatusChange={(item, status) => void changeStatus(item, status)}
                    onDelete={(item) => void handleDelete(item)}
                  />
                ))}
              </div>
            )}

            {!loading && requests.length > 0 ? (
              <div className="admin-list-footer">
                <span>{t.admin.pageCount(requests.length, total)}</span>
                {hasMore ? (
                  <button
                    className="load-more-button"
                    type="button"
                    onClick={() => void loadRequests(page + 1, true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? <LoaderCircle aria-hidden="true" size={14} className="button-spinner" /> : <ClipboardList aria-hidden="true" size={14} />}
                    <span>{loadingMore ? t.admin.loadingRequests : t.admin.loadMore}</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
