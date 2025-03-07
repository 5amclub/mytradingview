import { OptionsExposureComponent2 } from "@/components/OptionsExposureComponent";
import { getCachedDataForSymbol } from "@/lib/mzDataService";
export default async function Page({ params, searchParams }: { params: { symbol: string }, searchParams: { [key: string]: string | number } }) {
    const { symbol } = params
    const cachedDates = await getCachedDataForSymbol(symbol); //[];//await getCachedSummaryDatesBySymbol(symbol);
    return <OptionsExposureComponent2 symbol={symbol} cachedDates={cachedDates.map(j => j.dt)} />
}