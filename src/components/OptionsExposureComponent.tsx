'use client';
import { useOptionExposure } from "@/lib/hooks";
import { DataModeType, DexGexType } from "@/lib/types";
import { Box, Container, Grid, LinearProgress, Paper, Slider, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { parseAsInteger, parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo, useState, Suspense, lazy } from "react";
import { ChartTypeSelectorTab, ChartTypeSelectorTab2, DteStrikeSelector } from "./ChartTypeSelectorTab";
import { UpdateFrequencyDisclaimer } from "./UpdateFrequencyDisclaimer";
import { getValueColor, mapExposureDataCallsAndPuts } from "./OptionsTableComponent";

// Lazy load the GreeksExposureChart to improve initial load time
const GreeksExposureChart = lazy(() => import('./GreeksExposureChart').then(module => ({ default: module.GreeksExposureChart })));

// Simple fallback component for lazy loading
const ChartSkeleton = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
    <LinearProgress sx={{ width: '100%' }} />
  </Box>
);

export const OptionsExposureComponent2 = (props: { symbol: string, cachedDates: string[] }) => {
    const { symbol, cachedDates } = props;
    const [historicalDate, setHistoricalDate] = useState(cachedDates.at(-1) || '');
    const [dte, setDte] = useQueryState('dte', parseAsInteger.withDefault(50));
    const [strikeCounts, setStrikesCount] = useQueryState('sc', parseAsInteger.withDefault(30));
    const [exposureTab, setexposureTab] = useQueryState<DexGexType>('tab', parseAsStringEnum<DexGexType>(Object.values(DexGexType)).withDefault(DexGexType.DEXGEX));
    const [dataMode, setDataMode] = useQueryState<DataModeType>('mode', parseAsStringEnum<DataModeType>(Object.values(DataModeType)).withDefault(DataModeType.CBOE));
    
    // Only fetch data for the currently visible tab to reduce initial load
    const shouldLoadDex = useMemo(() => exposureTab === DexGexType.DEXGEX, [exposureTab]);
    const shouldLoadGex = useMemo(() => exposureTab === DexGexType.DEXGEX, [exposureTab]);
    const shouldLoadOI = useMemo(() => exposureTab === DexGexType.OIVOLUME, [exposureTab]);
    const shouldLoadVolume = useMemo(() => exposureTab === DexGexType.OIVOLUME, [exposureTab]);
    
    // Add staggered loading with progressively increasing delays to prevent API overloading
    const { exposureData: exposureDataDex, isLoaded: isLoadedDex, hasError: hasErrorDex } = useOptionExposure(
        symbol, 
        dte, 
        strikeCounts, 
        DexGexType.DEX, 
        dataMode, 
        historicalDate, 
        shouldLoadDex ? 0 : null
    );
    
    const { exposureData: exposureDataGex, isLoaded: isLoadedGex, hasError: hasErrorGex } = useOptionExposure(
        symbol, 
        dte, 
        strikeCounts, 
        DexGexType.GEX, 
        dataMode, 
        historicalDate, 
        shouldLoadGex ? 300 : null
    );
    
    const { exposureData: exposureDataOI, isLoaded: isLoadedOI, hasError: hasErrorOI } = useOptionExposure(
        symbol, 
        dte, 
        strikeCounts, 
        DexGexType.OI, 
        dataMode, 
        historicalDate, 
        shouldLoadOI ? 300 : null
    );
    
    const { exposureData: exposureDataVolume, isLoaded: isLoadedVolume, hasError: hasErrorVolume } = useOptionExposure(
        symbol, 
        dte, 
        strikeCounts, 
        DexGexType.VOLUME, 
        dataMode, 
        historicalDate, 
        shouldLoadVolume ? 600 : null
    );

    // Memoize the total DEX calculation to prevent recalculation on rerenders
    const totalDEX = useMemo(() => {
        if (!exposureDataDex) return { calls: 0, puts: 0 };
        return mapExposureDataCallsAndPuts(exposureDataDex, DexGexType.DEX).reduce((acc, cur) => {
            acc.calls += cur.calls;
            acc.puts += cur.puts;
            return acc;
        }, { strike: 0, calls: 0, puts: 0 });
    }, [exposureDataDex]);

    const dexRatio = useMemo(() => {
        return totalDEX.puts !== 0 ? (totalDEX.calls / totalDEX.puts).toFixed(3) : "N/A";
    }, [totalDEX]);

    // Skip rendering if none of the required data is loaded
    if (
        (shouldLoadDex && !exposureDataDex) || 
        (shouldLoadGex && !exposureDataGex) || 
        (shouldLoadOI && !exposureDataOI) || 
        (shouldLoadVolume && !exposureDataVolume)
    ) {
        return <LinearProgress />;
    }

    return <Container maxWidth="xl" sx={{ p: 0 }}>
        <DteStrikeSelector dte={dte} strikeCounts={strikeCounts} setDte={setDte} setStrikesCount={setStrikesCount} symbol={symbol} dataMode={dataMode} setDataMode={setDataMode} hasHistoricalData={cachedDates.length > 0} />
        <Grid container spacing={2} sx={{ mt: '0.5rem' }}>
            <Grid item xs={12} md={4}>
                <Paper sx={{
                    p: 2,
                    borderRadius: 2,
                }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Spot Price
                    </Typography>
                    <Typography variant="h6" sx={{
                        color: exposureDataDex ? getValueColor(exposureDataDex.spotPrice) : 'inherit'
                    }}>
                        ${exposureDataDex ? exposureDataDex.spotPrice.toFixed(2) : '--'}
                    </Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
                <Paper sx={{
                    p: 2,
                    borderRadius: 2,
                }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Call/Put DEX Ratio
                    </Typography>
                    <Typography variant="h6" sx={{
                        color: dexRatio !== "N/A" && parseFloat(dexRatio) > 1 ? "#00c853" : "#ff1744"
                    }}>
                        {dexRatio}
                    </Typography>
                </Paper>
            </Grid>
        </Grid>
        <Paper sx={{ mt: 2 }}>
            <ChartTypeSelectorTab2 tab={exposureTab} onChange={setexposureTab} />
            {exposureTab == DexGexType.DEXGEX &&
                <Stack direction={'row'} spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ m: 1, width: '100%' }}>
                        {hasErrorDex ? <i>Error occurred! Please try again...</i> : (
                            exposureDataDex && <Suspense fallback={<ChartSkeleton />}>
                                <GreeksExposureChart 
                                    exposureData={exposureDataDex!} 
                                    dte={dte} 
                                    symbol={symbol} 
                                    exposureType={DexGexType.DEX} 
                                    isLoaded={isLoadedDex} 
                                    skipAnimation={true}
                                />
                            </Suspense>
                        )}
                    </Box>
                    <Box sx={{ m: 1, width: '100%' }}>
                        {hasErrorGex ? <i>Error occurred! Please try again...</i> : (
                            exposureDataGex && <Suspense fallback={<ChartSkeleton />}>
                                <GreeksExposureChart 
                                    exposureData={exposureDataGex!} 
                                    dte={dte} 
                                    symbol={symbol} 
                                    exposureType={DexGexType.GEX} 
                                    isLoaded={isLoadedGex} 
                                    skipAnimation={true}
                                />
                            </Suspense>
                        )}
                    </Box>
                </Stack>
            }

            {exposureTab == DexGexType.OIVOLUME &&
                <Stack direction={'row'} spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ m: 1, width: '100%' }}>
                        {hasErrorOI ? <i>Error occurred! Please try again...</i> : (
                            exposureDataOI && <Suspense fallback={<ChartSkeleton />}>
                                <GreeksExposureChart 
                                    exposureData={exposureDataOI!} 
                                    dte={dte} 
                                    symbol={symbol} 
                                    exposureType={DexGexType.OI} 
                                    isLoaded={isLoadedOI} 
                                    skipAnimation={true}
                                />
                            </Suspense>
                        )}
                    </Box>
                    <Box sx={{ m: 1, width: '100%' }}>
                        {hasErrorVolume ? <i>Error occurred! Please try again...</i> : (
                            exposureDataVolume && <Suspense fallback={<ChartSkeleton />}>
                                <GreeksExposureChart 
                                    exposureData={exposureDataVolume!} 
                                    dte={dte} 
                                    symbol={symbol} 
                                    exposureType={DexGexType.VOLUME} 
                                    isLoaded={isLoadedVolume} 
                                    skipAnimation={true}
                                />
                            </Suspense>
                        )}
                    </Box>
                </Stack>
            }
        </Paper>
        {dataMode == DataModeType.HISTORICAL && <Paper sx={{ px: 4 }}>
            <HistoricalDateSlider dates={cachedDates} onChange={(v) => setHistoricalDate(v)} currentValue={historicalDate} />
        </Paper>
        }
        <UpdateFrequencyDisclaimer />
    </Container>
}

export const OptionsExposureComponent = (props: { symbol: string, cachedDates: string[], isNet?: boolean }) => {
    const { symbol, cachedDates, isNet } = props;
    const [historicalDate, setHistoricalDate] = useState(cachedDates.at(-1) || '');
    const [dte, setDte] = useQueryState('dte', parseAsInteger.withDefault(50));
    const [strikeCounts, setStrikesCount] = useQueryState('sc', parseAsInteger.withDefault(30));
    const [exposureTab, setexposureTab] = useQueryState<DexGexType>('tab', parseAsStringEnum<DexGexType>(Object.values(DexGexType)).withDefault(DexGexType.DEX));
    const [dataMode, setDataMode] = useQueryState<DataModeType>('mode', parseAsStringEnum<DataModeType>(Object.values(DataModeType)).withDefault(DataModeType.CBOE));
    const { exposureData, isLoaded, hasError } = useOptionExposure(symbol, dte, strikeCounts, exposureTab, dataMode, historicalDate);
    
    if (!exposureData) return <LinearProgress />;

    return <Container maxWidth="md" sx={{ p: 0 }}>
        <DteStrikeSelector dte={dte} strikeCounts={strikeCounts} setDte={setDte} setStrikesCount={setStrikesCount} symbol={symbol} dataMode={dataMode} setDataMode={setDataMode} hasHistoricalData={cachedDates.length > 0} />
        <Paper sx={{ mt: 2 }}>
            <ChartTypeSelectorTab tab={exposureTab} onChange={setexposureTab} />
            <Box sx={{ m: 1 }}>
                {hasError ? <i>Error occurred! Please try again...</i> : (
                    <Suspense fallback={<ChartSkeleton />}>
                        <GreeksExposureChart 
                            exposureData={exposureData} 
                            dte={dte} 
                            symbol={symbol} 
                            exposureType={exposureTab} 
                            isLoaded={isLoaded} 
                            isNet={isNet} 
                            skipAnimation={true}
                        />
                    </Suspense>
                )}
            </Box>
        </Paper>
        {dataMode == DataModeType.HISTORICAL && <Paper sx={{ px: 4 }}>
            <HistoricalDateSlider dates={cachedDates} onChange={(v) => setHistoricalDate(v)} currentValue={historicalDate} />
        </Paper>
        }
        <UpdateFrequencyDisclaimer />
    </Container>
}


type IHistoricalDateSliderPorps = { dates: string[], currentValue?: string, onChange: (v: string) => void }
const HistoricalDateSlider = (props: IHistoricalDateSliderPorps) => {
    const { dates, onChange, currentValue } = props;
    const [value, setValue] = useState<number>(dates.indexOf(currentValue || ''));
    const strikePriceMarks = useMemo(() => {
        const marks = dates.map((m, ix) => ({ value: ix, label: dayjs(m).format('D MMM') }));
        const maxMarks = 5;
        if (dates.length <= maxMarks) return marks;
        const result = [];
        const step = (marks.length - 1) / (maxMarks - 1);
        for (let i = 0; i < maxMarks; i++) {
            result.push(marks[Math.round(i * step)]);
        }
        return result;
    }, [dates]);

    return <Slider
        key={currentValue}
        value={value}
        onChange={(e, v) => setValue(v as number)}
        onChangeCommitted={(e, v) => onChange(dates[v as number])}
        getAriaValueText={(v, ix) => dates[ix]}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => dayjs(dates[v]).format('D MMM')}
        marks={strikePriceMarks}
        min={0}
        max={dates.length - 1}
        step={1} />
};

