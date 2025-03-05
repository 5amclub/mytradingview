import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React from 'react'
import { SummedData } from './OptionsTableComponent'
import { xAxixFormatter } from './GreeksExposureChart'
import { DexGexType } from '@/lib/types'
import _ from 'lodash'

export const GreeksExposureTable = (props: { exposureData: { [key: number]: SummedData[] } }) => {
  const { exposureData } = props

  const getValueColor = (value: number) => {
    if (value === 0) return "#666";
    return value > 0 ? "#00c853" : "#ff1744";
  };

  // Get background color for cells
  const getCellBackground = (value: number, isCall: boolean) => {
    if (value === 0) return "transparent";

    if (isCall) {
      return value > 0 ? "rgba(0, 200, 83, 0.1)" : "rgba(255, 23, 68, 0.1)";
    } else {
      return value > 0 ? "rgba(0, 200, 83, 0.1)" : "rgba(255, 23, 68, 0.1)";
    }
  };

  return (
    <TableContainer component={Paper} sx={{ marginTop: 2, marginBottom: 2 }}>
      <Table>
        <TableHead sx={{ height: '20px' }}>
          <TableRow sx={{ backgroundColor: '#0D47A1' }}>
            <TableCell colSpan={4} align="center" sx={{ color: 'white', borderBottom: 'none', py: 0.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">CALLS</Typography>
            </TableCell>
            <TableCell align="center" sx={{ color: 'white', borderBottom: 'none', py: 0.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">STRIKE</Typography>
            </TableCell>
            <TableCell colSpan={4} align="center" sx={{ color: 'white', borderBottom: 'none', py: 0.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">PUTS</Typography>
            </TableCell>
          </TableRow>
          <TableRow sx={{ backgroundColor: '#0D47A1' }}>
            <TableCell align="center" sx={{ color: 'white', py: 0.5 }}>DEX</TableCell>
            <TableCell align="center" sx={{ color: 'white', py: 0.5 }}>GEX</TableCell>
            <TableCell align="center" sx={{ color: 'white', py: 0.5 }}>OI</TableCell>
            <TableCell align="center" sx={{ color: 'white', py: 0.5 }}>VOLUME</TableCell>
            <TableCell align="center" sx={{
              color: 'white',
              py: 0.5,
              backgroundColor: '#1565C0',
              fontWeight: 'bold'
            }}>Price</TableCell>
            <TableCell align="center" sx={{ color: 'white', py: 0.5 }}>DEX</TableCell>
            <TableCell align="center" sx={{ color: 'white', py: 0.5 }}>GEX</TableCell>
            <TableCell align="center" sx={{ color: 'white', py: 0.5 }}>OI</TableCell>
            <TableCell align="center" sx={{ color: 'white', py: 0.5 }}>VOLUME</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {exposureData && Object.entries(exposureData)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([key, value]) => (
              <TableRow key={key}>
                {value.map((v) => (
                  <TableCell
                    key={v.calls}
                    align='center'
                    sx={{
                      color: getValueColor(v.calls),
                      backgroundColor: getCellBackground(v.calls, true),
                      borderBottom: '1px solid rgba(81, 81, 81, 0.3)',
                      width: '10px',
                      py: 0.5
                    }}
                  >{xAxixFormatter(v.exposureType as DexGexType, v.calls)}</TableCell>
                ))}
                <TableCell
                  align="center"
                  sx={{
                    backgroundColor: '#1565C0',
                    color: 'white',
                    fontWeight: 'bold',
                    borderBottom: '1px solid rgba(81, 81, 81, 0.3)',
                    width: '10px',
                    py: 0.5
                  }}
                >
                  ${key}
                </TableCell>
                {value.map((v) => (
                  <TableCell
                    key={v.puts}
                    align='center'
                    sx={{
                      color: getValueColor(v.puts),
                      backgroundColor: getCellBackground(v.puts, false),
                      borderBottom: '1px solid rgba(81, 81, 81, 0.3)',
                      width: '10px',
                      py: 0.5
                    }}
                  >{xAxixFormatter(v.exposureType as DexGexType, v.puts)}</TableCell>
                  // >{v.puts}</TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}