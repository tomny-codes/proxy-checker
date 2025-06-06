import React, { useState, useRef } from 'react';
import axios, { CancelTokenSource } from 'axios';
import ResultsTable from './components/ResultsTable';
import {
  Box,
  Button,
  Container,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

type ProxyResult = {
  proxy: string;
  type: string;
  working: boolean;
  latency?: number;
};

const CONCURRENCY_LIMIT = 10;

const App: React.FC = () => {
  const [proxies, setProxies] = useState<string>("");
  const [results, setResults] = useState<ProxyResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [completed, setCompleted] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const abortRef = useRef<boolean>(false);
  const cancelTokens = useRef<CancelTokenSource[]>([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = async () => {
    const list = proxies.split("\n").map(p => p.trim()).filter(Boolean);
    setResults([]);
    setCompleted(0);
    setTotal(list.length);
    setIsLoading(true);
    abortRef.current = false;
    cancelTokens.current = [];

    const queue = [...list];
    const workers: Promise<void>[] = [];

    for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
      workers.push(runWorker(queue));
    }

    await Promise.all(workers);
    setIsLoading(false);
  };

  const runWorker = async (queue: string[]) => {
    while (true) {
      if (abortRef.current) break;

      const raw = queue.shift();
      if (!raw) break;

      const proxy: string = raw;
      const cancelSource = axios.CancelToken.source();
      cancelTokens.current.push(cancelSource);

      const startTime = performance.now();

      try {
        const res = await axios.post<ProxyResult>('http://localhost:4000/test',
          { proxy },
          { cancelToken: cancelSource.token }
        );

        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        setResults(prev => [...prev, { ...res.data, latency }]);
      } catch (err) {
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        if (axios.isCancel(err)) {
          console.log(`Cancelled request for ${proxy}`);
        } else {
          console.error("Error testing proxy", proxy, err);
          setResults(prev => [...prev, { proxy, type: "Error", working: false, latency }]);
        }
      }

      setCompleted(prev => prev + 1);
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    setIsLoading(false);
    cancelTokens.current.forEach(token => token.cancel());
  };

  const percent = total ? (completed / total * 100) : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Proxy Checker</Typography>

      <Stack spacing={3}>
        <TextField
          label="Proxy List"
          multiline
          rows={isMobile ? 5 : 10}
          fullWidth
          value={proxies}
          disabled={isLoading}
          onChange={(e) => setProxies(e.target.value)}
          placeholder="Enter proxies like ip:port per line"
        />

        <Stack direction={isMobile ? "column" : "row"} spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isLoading || proxies.trim() === ""}
            startIcon={<PlayArrowIcon />}
            fullWidth={isMobile}
          >
            {isLoading ? "Testing..." : "Test Proxies"}
          </Button>

          {isLoading && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              startIcon={<CancelIcon />}
              fullWidth={isMobile}
            >
              Cancel
            </Button>
          )}
        </Stack>

        {isLoading && (
          <Box>
            <Typography>Progress: {completed} / {total} ({percent.toFixed(0)}%)</Typography>
            <LinearProgress variant="determinate" value={percent} sx={{ mt: 1 }} />
          </Box>
        )}

        {results.length > 0 && (
          <>
            <Typography variant="h5" mt={3}>Results</Typography>
            <ResultsTable data={results} />
          </>
        )}
      </Stack>
    </Container>
  );
};

export default App;
