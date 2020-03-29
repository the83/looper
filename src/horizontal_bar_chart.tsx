import * as React from 'react';
import { HorizontalBar } from 'react-chartjs-2';

export default function HorizontalBarChart(props) {
  const options = {
    animation: false,
    tooltips: {
      enabled: false,
    },
    legend: {
      display: false,
    },
    scales: {
      xAxes: [{
        stacked: true,
        display: false,
        ticks: {
          max: props.maxTicks,
          mirror: true,
        },
      }],
      yAxes: [{
        stacked: true,
        display: false,
        ticks: {
          mirror: true,
        },
      }],
    },
  };

  return (
    <HorizontalBar
      height={10}
      data={props.data}
      options={options}
    />
  );
}
