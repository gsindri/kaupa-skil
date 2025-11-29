import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function ProductListSkeleton() {
    return (
        <TableRow className="border-b border-border/60 bg-background dark:bg-transparent">
            <TableCell className="px-4 py-2 align-middle">
                <div className="flex h-full items-center gap-3">
                    {/* Product Thumb */}
                    <div className="size-14 flex-none overflow-hidden rounded-xl bg-muted/30">
                        <div className="h-full w-full bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 bg-[length:200%_100%] animate-shimmer" />
                    </div>
                    {/* Product Info */}
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
                        <div className="h-3 w-1/2 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '100ms' }} />
                    </div>
                </div>
            </TableCell>
            {/* Availability */}
            <TableCell className="w-32 px-4 py-2 align-middle">
                <div className="h-6 w-16 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '150ms' }} />
            </TableCell>
            {/* Supplier */}
            <TableCell className="w-52 px-4 py-2 align-middle">
                <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '200ms' }} />
                    <div className="h-3 w-24 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '200ms' }} />
                </div>
            </TableCell>
            {/* Price */}
            <TableCell className="w-32 px-4 py-2 align-middle">
                <div className="ml-auto h-4 w-16 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '250ms' }} />
            </TableCell>
            {/* Actions */}
            <TableCell className="w-[220px] px-4 py-2 align-middle">
                <div className="mx-auto h-10 w-[78%] max-w-[220px] rounded-md bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '300ms' }} />
            </TableCell>
        </TableRow>
    )
}
