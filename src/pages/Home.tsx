import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import type { MarketData } from './models/models';
import CryptoTable from './components/CryptoTable';
import type { SelectChangeEvent } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

const Home: React.FC = () => {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [minVolume, setMinVolume] = useState('');
  const [confirmedMinVolume, setConfirmedMinVolume] = useState<number | null>(
    null
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedRef = useRef<Date | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        'https://crypto-alert-back.onrender.com/api/tickers'
      );
      const json = await res.json();

      const prevDataRaw = sessionStorage.getItem('crypto_data');
      const prevData: Record<string, MarketData> = prevDataRaw
        ? JSON.parse(prevDataRaw)
        : {};

      const usdtPairs: MarketData[] = json.data.ticker
        .filter((item: any) => {
          const endsWithUSDT = item.symbol.endsWith('-USDT');
          const volumeOk =
            confirmedMinVolume === null ||
            parseFloat(item.volValue) >= confirmedMinVolume;
          return endsWithUSDT && volumeOk;
        })
        .map((item: any) => {
          const previous = prevData[item.symbol];
          const prevBuy = previous ? parseFloat(previous.buy) : null;
          const currentBuy = parseFloat(item.buy);
          const buyChangePercent =
            prevBuy !== null && prevBuy !== 0
              ? ((currentBuy - prevBuy) / prevBuy) * 100
              : 0;

          return {
            symbol: item.symbol,
            last: item.last,
            changeRate: item.changeRate,
            vol: item.vol,
            volValue: item.volValue,
            buy: item.buy,
            sell: item.sell,
            high: item.high,
            low: item.low,
            buyChangePercent: +buyChangePercent.toFixed(2),
          };
        });

      // Save current to sessionStorage for next comparison
      const storageData: Record<string, MarketData> = {};
      usdtPairs.forEach((item) => {
        storageData[item.symbol] = item;
      });
      sessionStorage.setItem('crypto_data', JSON.stringify(storageData));

      setData(usdtPairs); // now storing ALL filtered results
      setLastUpdated(new Date());
      const now = new Date();
      lastFetchedRef.current = now;
      setLastUpdated(now);
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  // On mount and when interval changes
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (autoRefresh) {
      fetchData();
      intervalRef.current = setInterval(fetchData, intervalMinutes * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMinutes, autoRefresh]);

  useEffect(() => {
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);

    timeIntervalRef.current = setInterval(() => {
      if (!lastFetchedRef.current) {
        setTimeLeft('00:00:00');
        return;
      }

      const nextFetch =
        lastFetchedRef.current.getTime() + intervalMinutes * 60 * 1000;
      const now = Date.now();
      const diff = Math.max(0, nextFetch - now); // prevent negative values

      const minutes = String(Math.floor(diff / 60000)).padStart(2, '0');
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(
        2,
        '0'
      );

      setTimeLeft(`00:${minutes}:${seconds}`);
    }, 1000);

    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, [intervalMinutes]);

  const handleIntervalChange = (event: SelectChangeEvent<number>) => {
    setIntervalMinutes(Number(event.target.value));
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Crypto Alert
      </Typography>

      {/* Control Panel */}
      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <FormControl size="small">
          <InputLabel id="interval-select-label">Interval</InputLabel>
          <Select
            labelId="interval-select-label"
            value={intervalMinutes}
            label="Interval"
            onChange={handleIntervalChange}
          >
            {[1, 2, 3, 5, 10, 15, 30].map((min) => (
              <MenuItem key={min} value={min}>
                {min} minute{min > 1 ? 's' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={fetchData} disabled={loading}>
          Refetch
        </Button>
        <Typography variant="body2" color="text.secondary">
          Last updated:{' '}
          {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
        </Typography>

        <Button
          variant="outlined"
          color="error"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          {autoRefresh ? 'Stop' : 'Start'}
        </Button>
        <Typography variant="body2" color="text.secondary">
          Next update in: {timeLeft}
        </Typography>
        <Button
          variant="outlined"
          color={alertsEnabled ? 'success' : 'inherit'}
          onClick={() => setAlertsEnabled((prev) => !prev)}
          startIcon={
            alertsEnabled ? (
              <NotificationsActiveIcon />
            ) : (
              <NotificationsOffIcon />
            )
          }
        >
          {alertsEnabled ? 'Alerts On' : 'Alerts Off'}
        </Button>

        <Box display="flex" alignItems="center" gap={1}>
          <input
            type="number"
            value={minVolume}
            placeholder="Min Vol 24h"
            onChange={(e) => setMinVolume(e.target.value)}
            style={{
              padding: '6px 8px',
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          />
          <Button
            variant="outlined"
            onClick={() => setConfirmedMinVolume(Number(minVolume))}
          >
            Confirm
          </Button>
        </Box>
        {loading && <CircularProgress size={20} />}
      </Box>
      <CryptoTable data={data} alertsEnabled={alertsEnabled} />
    </Container>
  );
};

export default Home;
