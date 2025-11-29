import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-9 w-28" />
                </div>
                <Skeleton className="h-9 w-28" />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="grid grid-cols-12 gap-6">
                    {/* Mimic a typical dashboard layout */}
                    <div className="col-span-12 md:col-span-4">
                        <Skeleton className="h-[220px] rounded-2xl" />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                        <Skeleton className="h-[220px] rounded-2xl" />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                        <Skeleton className="h-[220px] rounded-2xl" />
                    </div>
                    <div className="col-span-12 md:col-span-8">
                        <Skeleton className="h-[300px] rounded-2xl" />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                        <Skeleton className="h-[300px] rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    )
}
