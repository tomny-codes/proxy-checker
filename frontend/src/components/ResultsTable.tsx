import React, { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Typography,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

type ProxyResult = {
  proxy: string;
  type: string;
  working: boolean;
  latency?: number;
};

interface TableProps {
  data: ProxyResult[];
}

const ResultsTable: React.FC<TableProps> = ({ data }) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [workingFilter, setWorkingFilter] = useState<'all' | 'working' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'HTTP' | 'SOCKS4' | 'SOCKS5' | 'Unknown'>('all');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchesWorking =
        workingFilter === 'all' ||
        (workingFilter === 'working' && row.working) ||
        (workingFilter === 'failed' && !row.working);
      const matchesType = typeFilter === 'all' || row.type === typeFilter;
      const matchesSearch = row.proxy.includes(globalFilter);
      return matchesWorking && matchesType && matchesSearch;
    });
  }, [data, globalFilter, workingFilter, typeFilter]);

  const columns: ColumnDef<ProxyResult>[] = [
    { header: 'Proxy', accessorKey: 'proxy' },
    { header: 'Type', accessorKey: 'type' },
    { header: 'Working', accessorKey: 'working', cell: info => info.getValue() ? '✅' : '❌' },
    { header: 'Latency (ms)', accessorKey: 'latency', cell: info => info.getValue() ?? '-' },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleDownload = () => {
    const rows = table.getSortedRowModel().rows;
    const content = rows.map(row => row.original.proxy).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "filtered_proxies.txt";
    link.click();
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={2}
        mb={2}
        flexWrap="wrap"
        alignItems="center"
      >
        <TextField
          label="Search proxy"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          fullWidth={isMobile}
        />

        <FormControl sx={{ minWidth: 120 }} fullWidth={isMobile}>
          <InputLabel>Working</InputLabel>
          <Select value={workingFilter} label="Working" onChange={(e) => setWorkingFilter(e.target.value as any)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="working">Working</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }} fullWidth={isMobile}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value as any)}>
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="HTTP">HTTP</MenuItem>
            <MenuItem value="SOCKS4">SOCKS4</MenuItem>
            <MenuItem value="SOCKS5">SOCKS5</MenuItem>
            <MenuItem value="Unknown">Unknown</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleDownload}
          startIcon={<DownloadIcon />}
          fullWidth={isMobile}
        >
          Download
        </Button>
      </Stack>

      <Typography variant="subtitle1" mb={1}>
        Showing {table.getFilteredRowModel().rows.length} results
      </Typography>

      <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableCell
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' 🔼' : header.column.getIsSorted() === 'desc' ? ' 🔽' : ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} flexWrap="wrap">
        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</Button>
        <Typography>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </Typography>
        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
      </Box>
    </Box>
  );
};

export default ResultsTable;
