import { Mail, Phone, Search, Star } from "lucide-react";
import Link from "next/link";
import { deleteFeedback, setEnquiryStatus, setFeedbackStatus } from "@/app/admin/actions/feedback";
import { Panel, PageTitle } from "@/components/admin/admin-shell";
import { ActionButton, ConfirmAction } from "@/components/admin/controls";
import { FeedbackNotesForm } from "@/components/admin/feedback-notes-form";
import { Badge, type BadgeTone } from "@/components/arc/badge/badge";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { isAdminRole, requireStaffPage } from "@/lib/auth/session";
import { getAdminRepo } from "@/lib/data";
import { formatDateTime, labelise } from "@/lib/format";
import { FEEDBACK_STATUSES, type FeedbackStatus } from "@/lib/types";

export const metadata = { title: "Feedback" };

const TONE: Record<FeedbackStatus, BadgeTone> = { pending: "warning", reviewed: "info", published: "success", rejected: "neutral" };

function Rating({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-[var(--text-muted)]">{label}</span>
      <Star aria-hidden className="size-3.5 fill-current text-[var(--warning)]" />
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

export default async function FeedbackAdminPage({ searchParams }: { searchParams: Promise<{ status?: string; branch?: string; q?: string }> }) {
  const user = await requireStaffPage();
  const sp = await searchParams;
  const repo = await getAdminRepo();
  const scope = user.role === "branch_editor" ? user.branch_ids : undefined;
  const status = FEEDBACK_STATUSES.includes(sp.status as FeedbackStatus) ? (sp.status as FeedbackStatus) : undefined;

  const [all, branches, enquiries] = await Promise.all([
    repo.listFeedback({ branchScope: scope }),
    repo.listBranches({ includeInactive: true }),
    repo.listEnquiries({ branchScope: scope }),
  ]);
  const list = await repo.listFeedback({ status, branchId: sp.branch || undefined, search: sp.q, branchScope: scope });
  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name ?? "No branch";
  const counts = Object.fromEntries(FEEDBACK_STATUSES.map((s) => [s, all.filter((f) => f.status === s).length]));
  const tabHref = (s?: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (sp.branch) p.set("branch", sp.branch);
    if (sp.q) p.set("q", sp.q);
    return `/admin/feedback${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageTitle title="Feedback" description="Website reviews stay private until you publish them. Contact details are never shown on the website." />

      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        {[undefined, ...FEEDBACK_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={tabHref(s)}
            aria-current={status === s ? "page" : undefined}
            className={`inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] border px-3.5 text-[length:var(--text-sm)] ${
              status === s ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            {s ? labelise(s) : "All"} <span className="tabular-nums opacity-70">{s ? counts[s] : all.length}</span>
          </Link>
        ))}
      </nav>

      <form method="get" className="mb-6 flex flex-wrap gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative min-w-60 flex-1">
          <label htmlFor="fq" className="sr-only">Search feedback</label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input id="fq" name="q" defaultValue={sp.q} placeholder="Search name or message" className="h-[var(--control-height-md)] w-full rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] pl-9 pr-3 text-[length:var(--text-sm)]" />
        </div>
        <label htmlFor="fb" className="sr-only">Branch</label>
        <select id="fb" name="branch" defaultValue={sp.branch ?? ""} className="h-[var(--control-height-md)] rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[length:var(--text-sm)]">
          <option value="">All branches</option>
          {branches.filter((b) => !scope || scope.includes(b.id)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button type="submit" className="h-[var(--control-height-md)] rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-4 text-[length:var(--text-sm)] hover:bg-[var(--surface-muted)]">Filter</button>
      </form>

      {list.length ? (
        <ul className="grid gap-3">
          {list.map((f) => (
            <li key={f.id} className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)]">
              <details className="group">
                <summary className="grid cursor-pointer list-none gap-2 p-4 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{f.display_name}</span>
                      <Badge size="sm" tone={TONE[f.status]}>{labelise(f.status)}</Badge>
                      <span className="inline-flex items-center gap-1 text-[length:var(--text-sm)]">
                        <Star aria-hidden className="size-4 fill-current text-[var(--warning)]" />
                        <span className="tabular-nums">{f.rating_overall}</span><span className="sr-only">out of 5</span>
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[length:var(--text-sm)] text-[var(--text-secondary)] group-open:line-clamp-none">{f.message}</p>
                  </div>
                  <div className="text-[length:var(--text-xs)] text-[var(--text-muted)] sm:text-right">
                    <p>{branchName(f.branch_id)}</p>
                    <p>{formatDateTime(f.created_at)}</p>
                  </div>
                </summary>
                <div className="grid gap-5 border-t border-[var(--border)] p-4 lg:grid-cols-2">
                  <div className="grid content-start gap-3 text-[length:var(--text-sm)]">
                    <p className="flex flex-wrap gap-x-4 gap-y-1">
                      <Rating label="Food" value={f.rating_food} />
                      <Rating label="Service" value={f.rating_service} />
                      <Rating label="Atmosphere" value={f.rating_atmosphere} />
                    </p>
                    <p className="text-[var(--text-secondary)]">{labelise(f.visit_type)} · {f.country}</p>
                    <div className="rounded-[var(--radius-control)] bg-[var(--surface-muted)] p-3">
                      <p className="text-[length:var(--text-xs)] text-[var(--text-muted)]">Private contact details</p>
                      {f.email || f.phone ? (
                        <ul className="mt-1 grid gap-1">
                          {f.email && <li className="flex items-center gap-2"><Mail aria-hidden className="size-4" /><a href={`mailto:${f.email}`} className="hover:underline">{f.email}</a></li>}
                          {f.phone && <li className="flex items-center gap-2"><Phone aria-hidden className="size-4" /><a href={`tel:${f.phone}`} className="hover:underline">{f.phone}</a></li>}
                        </ul>
                      ) : (
                        <p className="mt-1">None given</p>
                      )}
                      <p className="mt-2 text-[length:var(--text-xs)]">{f.consent_to_contact ? "Agreed to be contacted" : "Did not ask to be contacted"}</p>
                    </div>
                    {f.published_at && <p className="text-[length:var(--text-xs)] text-[var(--text-muted)]">Published {formatDateTime(f.published_at)}</p>}
                  </div>
                  <div className="grid content-start gap-4">
                    <div className="flex flex-wrap gap-2">
                      {f.status !== "published" && <ActionButton variant="primary" onRun={setFeedbackStatus.bind(null, f.id, "published")}>Publish</ActionButton>}
                      {f.status === "published" && <ActionButton onRun={setFeedbackStatus.bind(null, f.id, "reviewed")}>Unpublish</ActionButton>}
                      {f.status === "pending" && <ActionButton onRun={setFeedbackStatus.bind(null, f.id, "reviewed")}>Mark as reviewed</ActionButton>}
                      {f.status !== "rejected" && <ActionButton variant="ghost" onRun={setFeedbackStatus.bind(null, f.id, "rejected")}>Reject</ActionButton>}
                    </div>
                    <FeedbackNotesForm id={f.id} notes={f.internal_notes} />
                    {isAdminRole(user) && <ConfirmAction label="Delete feedback" prompt="Delete this feedback permanently?" onConfirm={deleteFeedback.bind(null, f.id)} />}
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={all.length ? "Nothing matches these filters" : "No feedback yet"}
          description={all.length ? "Try another status, branch or search." : "Submissions from the website's review form will appear here."}
        />
      )}

      <div className="mt-10">
        <Panel title="Contact enquiries" description="Messages from the contact page. Reply by email or phone, then mark them handled.">
          {enquiries.length ? (
            <ul className="divide-y divide-[var(--border)]">
              {enquiries.map((e) => (
                <li key={e.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0 text-[length:var(--text-sm)]">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{e.name}</span>
                      <Badge size="sm" tone={e.status === "new" ? "warning" : "neutral"}>{e.status === "new" ? "New" : "Handled"}</Badge>
                      <span className="text-[var(--text-muted)]">{labelise(e.topic)}{e.branch_id ? ` · ${branchName(e.branch_id)}` : ""}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[var(--text-secondary)]">{e.message}</p>
                    <p className="mt-2 flex flex-wrap gap-4 text-[length:var(--text-xs)]">
                      {e.email && <a href={`mailto:${e.email}`} className="hover:underline">{e.email}</a>}
                      {e.phone && <a href={`tel:${e.phone}`} className="hover:underline">{e.phone}</a>}
                      <span className="text-[var(--text-muted)]">{formatDateTime(e.created_at)}</span>
                    </p>
                  </div>
                  <div>
                    <ActionButton onRun={setEnquiryStatus.bind(null, e.id, e.status === "new" ? "handled" : "new")}>
                      {e.status === "new" ? "Mark handled" : "Mark as new"}
                    </ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">No enquiries yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
