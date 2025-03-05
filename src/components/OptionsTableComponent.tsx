'use client';
import { ExposureDataType, useOptionExposure } from "@/lib/hooks";
import { DataModeType, DexGexType } from "@/lib/types";
import { Button, Container, LinearProgress, Link, Paper } from "@mui/material";
import { parseAsInteger, parseAsStringEnum, useQueryState } from "nuqs";
import { useState } from "react";
import { DteStrikeSelector } from "./ChartTypeSelectorTab";
import { GridColDef } from "@mui/x-data-grid";
import { GreeksExposureTable } from "./GreeksExposureTable";
import { xAxixFormatter } from "./GreeksExposureChart";

type Props = {}

const columns: GridColDef[] = [
  { field: 'col1', headerName: 'Column 1', width: 150 },
]

export type SummedData = {
  exposureType: string
  calls: number
  puts: number
  strike?: number
}

const mapExposureDataCallsAndPuts = (exposureData: ExposureDataType, type: DexGexType): SummedData[] => {
  const summedData: SummedData[] = [];
  const callsSum = new Array(exposureData.strikes.length).fill(0);
  const putsSum = new Array(exposureData.strikes.length).fill(0);

  exposureData.items.forEach((item, index) => {
    // Assuming even indices are calls and odd indices are puts
    if (index % 2 === 0) { // Calls
      item.data.forEach((value, i) => {
        callsSum[i] += value;
      });
    } else { // Puts (stored as negative values)
      item.data.forEach((value, i) => {
        putsSum[i] += Math.abs(value); // Convert to positive for summing
      });
    }
  });

  // Create processed data with summed values
  exposureData.strikes.forEach((strike, index) => {
    summedData.push({
      exposureType: type,
      strike: strike,
      calls: callsSum[index],
      puts: putsSum[index],
    });
  });

  return summedData
}

function processExposureData(strikes: number[], dexData: SummedData[], gexData: SummedData[], oiData: SummedData[], volumeData: SummedData[]) {
  const exposureData: { [key: number]: SummedData[] } = {};


  for (const strike of strikes) {
    exposureData[strike] = [];
  }

  const dataSources = [dexData, gexData, oiData, volumeData];

  for (const dataSource of dataSources) {
    for (const item of dataSource) {
      const strike = item.strike;
      if (strike)
        if (exposureData[strike]) {
          exposureData[strike].push({
            exposureType: item.exposureType,
            calls: item.calls,
            puts: item.puts,
          });
        }
    }
  }

  return exposureData;
}

const exportToCsv = (exposureData: { [key: number]: SummedData[] }) => {
  let csv =
    'DEX (calls),GEX (calls),OI (calls),VOLUME (calls),Strike Price,DEX (puts),GEX (puts),OI (puts),VOLUME (puts)\n';

  for (const [key, value] of Object.entries(exposureData).sort((a, b) => Number(b[0]) - Number(a[0]))) {
    let content = '';
    for (const data of value) {
      content += xAxixFormatter(data.exposureType as DexGexType, data.calls) + ',';
    }

    content += key + ',';

    for (const data of value) {
      content += xAxixFormatter(data.exposureType as DexGexType, data.puts) + ',';
    }

    csv += content.split(',').slice(0, -1).join(',') + '\n';
  }

  return csv;
}

export const OptionsTableComponent = (props: { symbol: string, cachedDates: string[] }) => {
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

  return (
    <Container>
      <DteStrikeSelector dte={dte} strikeCounts={strikeCounts} setDte={setDte} setStrikesCount={setStrikesCount} symbol={symbol} dataMode={dataMode} setDataMode={setDataMode} hasHistoricalData={cachedDates.length > 0} />
      <GreeksExposureTable exposureData={processExposureData(exposureDataDex.strikes, mapExposureDataCallsAndPuts(exposureDataDex, DexGexType.DEX), mapExposureDataCallsAndPuts(exposureDataGex, DexGexType.GEX), mapExposureDataCallsAndPuts(exposureDataOI, DexGexType.OI), mapExposureDataCallsAndPuts(exposureDataVolume, DexGexType.VOLUME))} />
      <Paper sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'end', padding: '5px', marginBottom: '2rem' }}>
        <Link
          component={Button}
          variant="button"
          underline="none"
          onClick={() => {
            let csvContent = exportToCsv(processExposureData(exposureDataDex.strikes, mapExposureDataCallsAndPuts(exposureDataDex, DexGexType.DEX), mapExposureDataCallsAndPuts(exposureDataGex, DexGexType.GEX), mapExposureDataCallsAndPuts(exposureDataOI, DexGexType.OI), mapExposureDataCallsAndPuts(exposureDataVolume, DexGexType.VOLUME)))
            var pom = document.createElement('a');
            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            pom.href = url;
            pom.setAttribute('download', 'data.csv');
            pom.click();
          }}
        >
          Export
        </Link>
      </Paper>
    </Container>

  )
}