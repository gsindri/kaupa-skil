import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function RecentOrdersSkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Suppliers</TableHead>
                    <TableHead className="text-right">Total (ex VAT)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                            <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="text-right">
                            <Skeleton className="ml-auto h-4 w-20" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
