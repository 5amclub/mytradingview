'use client';
import { useOptionExposure } from "@/lib/hooks";
import { DataModeType, DexGexType } from "@/lib/types";
import { Box, Container, Grid, LinearProgress, Paper, Slider, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { parseAsInteger, parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { ChartTypeSelectorTab, ChartTypeSelectorTab2, DteStrikeSelector } from "./ChartTypeSelectorTab";
import { GreeksExposureChart } from "./GreeksExposureChart";
import { UpdateFrequencyDisclaimer } from "./UpdateFrequencyDisclaimer";
import { getValueColor, mapExposureDataCallsAndPuts } from "./OptionsTableComponent";

export const OptionsExposureComponent2 = (props: { symbol: string, cachedDates: string[] }) => {
    const { symbol, cachedDates } = props;
    const [historicalDate, setHistoricalDate] = useState(cachedDates.at(-1) || '');
    const [dte, setDte] = useQueryState('dte', parseAsInteger.withDefault(50));
    const [strikeCounts, setStrikesCount] = useQueryState('sc', parseAsInteger.withDefault(30));
    const [exposureTab, setexposureTab] = useQueryState<DexGexType>('tab', parseAsStringEnum<DexGexType>(Object.values(DexGexType)).withDefault(DexGexType.DEXGEX));
    const [dataMode, setDataMode] = useQueryState<DataModeType>('mode', parseAsStringEnum<DataModeType>(Object.values(DataModeType)).withDefault(DataModeType.CBOE));
    const { exposureData: exposureDataDex, isLoaded: isLoadedDex, hasError: hasErrorDex } = useOptionExposure(symbol, dte, strikeCounts, DexGexType.DEX, dataMode, historicalDate);
    const { exposureData: exposureDataGex, isLoaded: isLoadedGex, hasError: hasErrorGex } = useOptionExposure(symbol, dte, strikeCounts, DexGexType.GEX, dataMode, historicalDate);
    const { exposureData: exposureDataOI, isLoaded: isLoadedOI, hasError: hasErrorOI } = useOptionExposure(symbol, dte, strikeCounts, DexGexType.OI, dataMode, historicalDate);
    const { exposureData: exposureDataVolume, isLoaded: isLoadedVolume, hasError: hasErrorVolume } = useOptionExposure(symbol, dte, strikeCounts, DexGexType.VOLUME, dataMode, historicalDate);

    if (!exposureDataDex || !exposureDataGex || !exposureDataOI || !exposureDataVolume) return <LinearProgress />;

    const startHistoricalAnimation = async () => {
        const delayMs = 1000;
        for (const d of cachedDates) {
            setTimeout(() => {
                setHistoricalDate(d);
            }, delayMs);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }

    const totalDEX = mapExposureDataCallsAndPuts(exposureDataDex, DexGexType.DEX).reduce((acc, cur) => {
        acc.calls += cur.calls
        acc.puts += cur.puts
        return acc
    }, { strike: 0, calls: 0, puts: 0 })

    const dexRatio = totalDEX.puts !== 0 ? (totalDEX.calls / totalDEX.puts).toFixed(3) : "N/A";

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
                        color: getValueColor(exposureDataDex.spotPrice)
                    }}>
                        ${exposureDataDex.spotPrice.toFixed(2)}
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
                        {hasErrorDex ? <i>Error occurred! Please try again...</i> : <GreeksExposureChart exposureData={exposureDataDex} dte={dte} symbol={symbol} exposureType={DexGexType.DEX} isLoaded={isLoadedDex} />}
                    </Box>
                    <Box sx={{ m: 1, width: '100%' }}>
                        {hasErrorGex ? <i>Error occurred! Please try again...</i> : <GreeksExposureChart exposureData={exposureDataGex} dte={dte} symbol={symbol} exposureType={DexGexType.GEX} isLoaded={isLoadedGex} />}
                    </Box>
                </Stack>
            }

            {exposureTab == DexGexType.OIVOLUME &&
                <Stack direction={'row'} spacing={2} sx={{ alignItems: "center" }}>
                    <Box sx={{ m: 1, width: '100%' }}>
                        {hasErrorOI ? <i>Error occurred! Please try again...</i> : <GreeksExposureChart exposureData={exposureDataOI} dte={dte} symbol={symbol} exposureType={DexGexType.OI} isLoaded={isLoadedOI} />}
                    </Box>
                    <Box sx={{ m: 1, width: '100%' }}>
                        {hasErrorVolume ? <i>Error occurred! Please try again...</i> : <GreeksExposureChart exposureData={exposureDataVolume} dte={dte} symbol={symbol} exposureType={DexGexType.VOLUME} isLoaded={isLoadedVolume} />}
                    </Box>
                </Stack>
            }
        </Paper>
        {dataMode == DataModeType.HISTORICAL && <Paper sx={{ px: 4 }}>
            <HistoricalDateSlider dates={cachedDates} onChange={(v) => setHistoricalDate(v)} currentValue={historicalDate} />
            {/* <Stack direction={'row'} spacing={2} sx={{ alignItems: "center" }}>
            </Stack> */}
            {/* <IconButton onClick={startHistoricalAnimation}><PlayIcon /></IconButton> */}
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

    const startHistoricalAnimation = async () => {
        const delayMs = 1000;
        for (const d of cachedDates) {
            setTimeout(() => {
                setHistoricalDate(d);
            }, delayMs);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }

    return <Container maxWidth="md" sx={{ p: 0 }}>
        <DteStrikeSelector dte={dte} strikeCounts={strikeCounts} setDte={setDte} setStrikesCount={setStrikesCount} symbol={symbol} dataMode={dataMode} setDataMode={setDataMode} hasHistoricalData={cachedDates.length > 0} />
        <Paper sx={{ mt: 2 }}>
            <ChartTypeSelectorTab tab={exposureTab} onChange={setexposureTab} />
            <Box sx={{ m: 1 }}>
                {hasError ? <i>Error occurred! Please try again...</i> : <GreeksExposureChart exposureData={exposureData} dte={dte} symbol={symbol} exposureType={exposureTab} isLoaded={isLoaded} isNet={isNet} />}
            </Box>
        </Paper>
        {dataMode == DataModeType.HISTORICAL && <Paper sx={{ px: 4 }}>
            <HistoricalDateSlider dates={cachedDates} onChange={(v) => setHistoricalDate(v)} currentValue={historicalDate} />
            {/* <Stack direction={'row'} spacing={2} sx={{ alignItems: "center" }}>
            </Stack> */}
            {/* <IconButton onClick={startHistoricalAnimation}><PlayIcon /></IconButton> */}
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

