import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ProductListSkeleton } from './ProductListSkeleton'

export function CatalogTableSkeleton() {
    return (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card text-foreground shadow-sm dark:border-white/15 dark:bg-[rgba(13,19,32,0.86)]">
            <Table className="min-w-full text-[13px] text-muted-foreground">
                <TableHeader className="sticky top-0 z-10 bg-card/85 backdrop-blur-sm supports-[backdrop-filter]:bg-card/70">
                    <TableRow className="border-b border-border/60 dark:border-white/10">
                        <TableHead className="px-4 py-3 text-left align-middle">
                            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Product
                            </span>
                        </TableHead>
                        <TableHead className="w-32 px-4 py-3 text-left align-middle">
                            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Availability
                            </span>
                        </TableHead>
                        <TableHead className="w-52 px-4 py-3 text-left align-middle">
                            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Supplier
                            </span>
                        </TableHead>
                        <TableHead className="w-32 px-4 py-3 text-right align-middle">
                            <span className="inline-flex w-full justify-end items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Price
                            </span>
                        </TableHead>
                        <TableHead className="w-[220px] px-4 py-3 text-center align-middle">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Actions
                            </span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <ProductListSkeleton key={i} />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
