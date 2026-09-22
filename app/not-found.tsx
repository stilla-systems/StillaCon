import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() { return <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center"><p className="text-[10px] font-bold tracking-[.22em] text-primary">STILLACON / 404</p><h1 className="mt-4 text-3xl font-semibold">That page is not available.</h1><p className="mt-3 text-sm text-muted-foreground">The resource may have moved or is not part of this sandbox.</p><Button asChild className="mt-6"><Link href="/">Return home</Link></Button></main> }
