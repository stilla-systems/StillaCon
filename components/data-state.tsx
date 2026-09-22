import Link from "next/link"
import { Button } from "@/components/ui/button"

export function EmptyState({ title, description }: { title: string; description: string }) { return <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center"><p className="font-semibold">{title}</p><p className="mt-2 text-sm text-muted-foreground">{description}</p></div> }
export function ErrorState({ title = "Something went wrong", description = "We could not complete that request. Please try again." }: { title?: string; description?: string }) { return <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"><p className="font-semibold">{title}</p><p className="mt-2 text-sm text-muted-foreground">{description}</p></div> }
export function UnauthorizedState() { return <div className="rounded-2xl border border-border bg-card/40 p-8 text-center"><p className="font-semibold">Sign in required</p><p className="mt-2 text-sm text-muted-foreground">Sign in to view this part of your StillaCon account.</p><Button asChild className="mt-5"><Link href="/login">Sign in</Link></Button></div> }
export function ForbiddenState() { return <ErrorState title="Access restricted" description="You do not have permission to view this area." /> }
export function NotFoundState() { return <ErrorState title="Not found" description="The requested StillaCon resource could not be found." /> }
