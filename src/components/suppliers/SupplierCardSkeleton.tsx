import { Skeleton } from "@/components/ui/skeleton"

export function SupplierCardSkeleton() {
    return (
        <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </div>
        </div>
    )
}
