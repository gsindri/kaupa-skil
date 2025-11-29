import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function SupplierOrderCardSkeleton() {
    return (
        <Card className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <div className="flex gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <Skeleton className="ml-auto h-3 w-16 mb-1" />
                    <Skeleton className="ml-auto h-8 w-24" />
                </div>
            </div>

            <CardContent className="p-0">
                {/* Items List Skeleton */}
                <div className="divide-y divide-slate-100">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="min-w-0 flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <div className="w-32 shrink-0">
                                <Skeleton className="h-8 w-full" />
                            </div>
                            <div className="w-24 shrink-0 text-right">
                                <Skeleton className="ml-auto h-5 w-16" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                    ))}
                </div>

                {/* Footer Skeleton */}
                <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </CardContent>
        </Card>
    )
}
