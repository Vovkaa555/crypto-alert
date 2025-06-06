import React, { useEffect, useState } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  Button,
  Typography,
  Box,
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import type { CryptoTableProps, MarketData, Order } from '../models/models';
import { playAlertSound } from '../../helpers/system';

const CryptoTable: React.FC<CryptoTableProps> = ({ data, alertsEnabled }) => {
  const [orderBy, setOrderBy] = useState<keyof MarketData>('buyChangePercent');
  const [order, setOrder] = useState<Order>('asc'); // Start with ascending to show negatives first
  const [visibleRows, setVisibleRows] = useState(20);

  const handleSort = (property: keyof MarketData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[orderBy];
    const bVal = b[orderBy];

    if (aVal == null || bVal == null) return 0;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return order === 'asc'
      ? Number(aVal) - Number(bVal)
      : Number(bVal) - Number(aVal);
  });

  const visibleData = sortedData.slice(0, visibleRows);

  const columns: { key: keyof MarketData; label: string }[] = [
    { key: 'symbol', label: 'SYMBOL' },
    { key: 'buyChangePercent', label: 'LAST UPDATE CHANGE' },
    { key: 'buy', label: 'BUY' },
    { key: 'sell', label: 'SELL' },
    { key: 'high', label: 'HIGH' },
    { key: 'low', label: 'LOW' },
    { key: 'volValue', label: 'VOLUME 24h' },
    { key: 'vol', label: 'VOLUME' },
  ];

  useEffect(() => {
    if (alertsEnabled === false) {
      return;
    }
    const topChange = sortedData[0]?.buyChangePercent;

    if (typeof topChange !== 'number') return;

    let level = null;
    if (topChange <= -20) level = 4;
    else if (topChange <= -15) level = 3;
    else if (topChange <= -10) level = 2;
    else if (topChange <= -5) level = 1;

    if (level) {
      playAlertSound(level);
    }
  }, [sortedData[0]?.buyChangePercent]);

  const renderBuyChange = (value?: number) => {
    if (value === undefined || value === 0) {
      return <Typography>{value?.toFixed(2)}%</Typography>;
    }

    const isPositive = value > 0;
    return (
      <Box
        display="flex"
        alignItems="center"
        color={isPositive ? 'green' : 'red'}
      >
        {isPositive ? (
          <ArrowDropUpIcon fontSize="small" />
        ) : (
          <ArrowDropDownIcon fontSize="small" />
        )}
        <Typography variant="body2">{value.toFixed(2)}%</Typography>
      </Box>
    );
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key}>
                <TableSortLabel
                  active={orderBy === col.key}
                  direction={orderBy === col.key ? order : 'asc'}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleData.map((item) => (
            <TableRow key={item.symbol}>
              <TableCell>
                <a
                  href={`https://www.kucoin.com/trade/${item.symbol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: '#1976d2' }} // optional: adds MUI blue link color
                >
                  {item.symbol}
                </a>
              </TableCell>
              <TableCell>{renderBuyChange(item.buyChangePercent)}</TableCell>
              <TableCell>{item.buy}</TableCell>
              <TableCell>{item.sell}</TableCell>
              <TableCell>{item.high}</TableCell>
              <TableCell>{item.low}</TableCell>
              <TableCell>{parseFloat(item.volValue).toFixed(2)}</TableCell>
              <TableCell>{parseFloat(item.vol).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {visibleRows < sortedData.length && (
        <Button
          variant="outlined"
          onClick={() => setVisibleRows((prev) => prev + 20)}
          sx={{ mt: 2 }}
        >
          Show More
        </Button>
      )}
    </>
  );
};

export default CryptoTable;
