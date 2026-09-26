"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function MerchantReviewControls({ id, status }: { id: string; status: string }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  async function move(nextStatus: string, needsReason = false) {
    const reason = needsReason ? window.prompt(nextStatus === "REJECTED" ? "Reason for rejection" : "What information is needed?")?.trim() : ""
    if (needsReason && !reason) return
    if (nextStatus === "APPROVED" && !window.confirm("Approve this application and create the merchant account?")) return
    setPending(true); setMessage(null)
    const response = await fetch(`/api/admin/merchant-applications/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: nextStatus, previousStatus: status, reason }) })
    const result = await response.json().catch(() => ({}))
    setMessage(response.ok ? "Action completed. Refresh to see the updated status." : result.error ?? "Action failed.")
    setPending(false)
    if (response.ok) window.location.reload()
  }
  return <div className="flex flex-wrap gap-2">{status === "APPLIED" && <Button size="sm" disabled={pending} onClick={() => move("UNDER_REVIEW")}>Start review</Button>}{status === "UNDER_REVIEW" && <><Button size="sm" disabled={pending} onClick={() => move("APPROVED")}>Approve</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => move("REQUESTED_INFORMATION", true)}>Request information</Button></>}{["APPLIED", "UNDER_REVIEW"].includes(status) && <Button size="sm" variant="destructive" disabled={pending} onClick={() => move("REJECTED", true)}>Reject</Button>}{status === "REQUESTED_INFORMATION" && <Button size="sm" disabled={pending} onClick={() => move("UNDER_REVIEW")}>Resume review</Button>}{message && <p role="status" className="basis-full text-xs text-muted-foreground">{message}</p>}</div>
}
