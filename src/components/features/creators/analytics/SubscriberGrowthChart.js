import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { Box } from '@chakra-ui/react';

const SubscriberGrowthChart = ({ data, timeRange = '30d' }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const lineSeriesRef = useRef();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#d4d4d8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
      },
    });

    // Create line series with gradient
    lineSeriesRef.current = chartRef.current.addLineSeries({
      color: '#10b981',
      lineWidth: 3,
      priceFormat: {
        type: 'custom',
        formatter: (price) => Math.round(price).toString(),
      },
    });

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: 300,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!lineSeriesRef.current) return;

    if (data && data.length > 0) {
      lineSeriesRef.current.setData(data);
      
      // Fit content
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } else {
      // Clear chart if no data
      lineSeriesRef.current.setData([]);
    }
  }, [data, timeRange]);

  if (!data || data.length === 0) {
    return (
      <Box
        w="100%"
        h="300px"
        bg="rgba(255, 255, 255, 0.02)"
        borderRadius="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        gap={3}
      >
        <Box fontSize="32px">👥</Box>
        <Box color="white" fontSize="18px" fontWeight="600">No Subscriber Data</Box>
        <Box color="rgba(255, 255, 255, 0.6)" fontSize="14px" textAlign="center">
          Subscriber growth data will appear here once you gain subscribers
        </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={chartContainerRef}
      w="100%"
      h="300px"
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="lg"
      p={2}
    />
  );
};

export default SubscriberGrowthChart;