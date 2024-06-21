import { fetchFilteredCustomers } from "@/app/lib/data";
import CustomersTable from "@/app/ui/customers/table";
import { lusitana } from "@/app/ui/fonts"
import Search from "@/app/ui/search";
import { CustomersTableSkeleton } from "@/app/ui/skeletons";
import { Metadata } from "next"
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Customers",
}

export default async function Customers(
    { searchParams, }: {
        searchParams?: {
            query?: string,
        }
    }
) {

    const query = searchParams?.query || '';
    const customers = await fetchFilteredCustomers(query);

    return (
        <div className="w-full">

            <div>
                <div className="flex w-full items-center justify-between">
                    <h1 className={`${lusitana.className} mb-8 text-xl md:text-2xl`}>
                        Customers
                    </h1>
                </div>
                <Search placeholder="Search customers..." />
            </div>
            <Suspense fallback={<CustomersTableSkeleton />}>
                <CustomersTable customers={customers} />
            </Suspense>
        </div>
    )
}