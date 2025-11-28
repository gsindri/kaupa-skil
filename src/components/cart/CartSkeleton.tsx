import { Skeleton } from "@/components/ui/skeleton"

export function CartSkeleton() {
    return (
        <div className="cart-rail__body">
            <ul className="cart-rail__list">
                {Array.from({ length: 3 }).map((_, i) => (
                    <li className="cart-item" key={i}>
                        <div className="cart-item__media">
                            <Skeleton className="h-10 w-10 rounded-md" />
                        </div>

                        <div className="cart-item__main gap-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>

                        <div className="cart-item__right gap-2">
                            <Skeleton className="h-4 w-16" />
                            <div className="flex items-center gap-1">
                                <Skeleton className="h-6 w-20 rounded-md" />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
