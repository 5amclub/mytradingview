import { OptionsTableComponent } from "@/components/OptionsTableComponent";
import { getCachedDataForSymbol } from "@/lib/mzDataService";

export default async function Page({ params, searchParams }: { params: { symbol: string }, searchParams: { [key: string]: string | number } }) {
    const { symbol } = params
    const cachedDates = await getCachedDataForSymbol(symbol); //[];//await getCachedSummaryDatesBySymbol(symbol);
    return <OptionsTableComponent symbol={symbol} cachedDates={cachedDates.map(j => j.dt)} />
}