'use client';
import { ExposureDataType, useOptionExposure } from "@/lib/hooks";
import { DataModeType, DexGexType } from "@/lib/types";
import { Alert, Button, Container, Grid, LinearProgress, Link, Paper, Stack, Typography } from "@mui/material";
import { parseAsInteger, parseAsStringEnum, useQueryState } from "nuqs";
import { useState } from "react";
import { DteStrikeSelector } from "./ChartTypeSelectorTab";
import { GridColDef } from "@mui/x-data-grid";
import { GreeksExposureTable } from "./GreeksExposureTable";
import { xAxixFormatter } from "./GreeksExposureChart";
import React from "react";
import { Kaushan_Script } from "next/font/google";

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

export const mapExposureDataCallsAndPuts = (exposureData: ExposureDataType, type: DexGexType): SummedData[] => {
  const summedData: SummedData[] = [];
  const callsSum = new Array(exposureData.strikes.length).fill(0);
  const putsSum = new Array(exposureData.strikes.length).fill(0);

  exposureData.items.forEach((item, index) => {
    if (type !== DexGexType.GEX) {
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
    } else {
      // Assuming even indices are calls and odd indices are puts
      item.data.forEach((value, i) => {
        if (value > 0) {
          callsSum[i] += value;
        } else {
          putsSum[i] += value; // Convert to positive for summing
        }
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

export const getValueColor = (value: number) => {
  if (value === 0) return "#666";
  return value > 0 ? "#00c853" : "#ff1744";
};

// Get background color for cells
export const getCellBackground = (value: number, isCall: boolean) => {
  if (value === 0) return "transparent";

  if (isCall) {
    return value > 0 ? "rgba(0, 200, 83, 0.1)" : "rgba(255, 23, 68, 0.1)";
  } else {
    return value > 0 ? "rgba(0, 200, 83, 0.1)" : "rgba(255, 23, 68, 0.1)";
  }
};

export const OptionsTableComponent = (props: { symbol: string, cachedDates: string[] }) => {
  const { symbol, cachedDates } = props;
  const [historicalDate, setHistoricalDate] = useState(cachedDates.at(-1) || '');
  const [selectedExpirations, setSelectedExpirations] = useState<string[]>([]);
  const [dte, setDte] = useQueryState('dte', parseAsInteger.withDefault(50));
  const [strikeCounts, setStrikesCount] = useQueryState('sc', parseAsInteger.withDefault(30));
  const [exposureTab, setexposureTab] = useQueryState<DexGexType>('tab', parseAsStringEnum<DexGexType>(Object.values(DexGexType)).withDefault(DexGexType.DEXGEX));
  const [dataMode, setDataMode] = useQueryState<DataModeType>('mode', parseAsStringEnum<DataModeType>(Object.values(DataModeType)).withDefault(DataModeType.CBOE));
  const { exposureData: exposureDataDex, isLoading: isLoadingDex, hasError: hasErrorDex } = useOptionExposure(symbol, dte, selectedExpirations, strikeCounts, DexGexType.DEX, dataMode, historicalDate, 300);
  const { exposureData: exposureDataGex, isLoading: isLoadingGex, hasError: hasErrorGex } = useOptionExposure(symbol, dte, selectedExpirations, strikeCounts, DexGexType.GEX, dataMode, historicalDate, 300);
  const { exposureData: exposureDataOI, isLoading: isLoadingOI, hasError: hasErrorOI } = useOptionExposure(symbol, dte, selectedExpirations, strikeCounts, DexGexType.OI, dataMode, historicalDate, 300);
  const { exposureData: exposureDataVolume, isLoading: isLoadingVolume, hasError: hasErrorVolume } = useOptionExposure(symbol, dte, selectedExpirations, strikeCounts, DexGexType.VOLUME, dataMode, historicalDate, 300);

  if (!exposureDataDex || !exposureDataGex || !exposureDataOI || !exposureDataVolume) return <LinearProgress />;

  const totalDEX = mapExposureDataCallsAndPuts(exposureDataDex, DexGexType.DEX).reduce((acc, cur) => {
    acc.calls += cur.calls
    acc.puts += cur.puts
    return acc
  }, { strike: 0, calls: 0, puts: 0 })

  const dexRatio = totalDEX.puts !== 0 ? (totalDEX.calls / totalDEX.puts).toFixed(3) : "N/A";

  return (
    <Container>
      {isLoadingDex || isLoadingGex || isLoadingOI || isLoadingVolume &&
        <Stack sx={{ width: '100%', marginBottom: '0.5rem' }} spacing={1}>
          {hasErrorDex && <Alert severity="error">Failed to fetch <strong>DEX</strong>.</Alert>}
          {hasErrorGex && <Alert severity="error">Failed to fetch <strong>GEX</strong>.</Alert>}
          {hasErrorOI && <Alert severity="error">Failed to fetch <strong>OPEN INTERESTS</strong>.</Alert>}
          {hasErrorVolume && <Alert severity="error">Failed to fetch <strong>VOLUME</strong>.</Alert>}
        </Stack>
      }
      <DteStrikeSelector dte={dte} strikeCounts={strikeCounts} setDte={setDte} setStrikesCount={setStrikesCount} symbol={symbol} dataMode={dataMode} setDataMode={setDataMode} hasHistoricalData={cachedDates.length > 0} availableDates={[]} setCustomExpirations={setSelectedExpirations} />
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
      {isLoadingDex && isLoadingGex && isLoadingOI && isLoadingVolume && <GreeksExposureTable exposureData={processExposureData(exposureDataDex.strikes, mapExposureDataCallsAndPuts(exposureDataDex, DexGexType.DEX), mapExposureDataCallsAndPuts(exposureDataGex, DexGexType.GEX), mapExposureDataCallsAndPuts(exposureDataOI, DexGexType.OI), mapExposureDataCallsAndPuts(exposureDataVolume, DexGexType.VOLUME))} />}
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