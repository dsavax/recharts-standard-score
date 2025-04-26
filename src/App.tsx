import React, {memo} from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  DotProps,
} from 'recharts';

type DataPoint = {
  name: string;
  uv: number;
  pv: number;
  amt: number;
}

const initialData: DataPoint[] = [
  { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];

const calculateStats = (data: DataPoint[]) => {
  const values = data.map((item) => item.pv);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  return { mean, stdDev };
};

const getPvColor = (zScore?: number) => (zScore !== undefined && Math.abs(zScore) > 1 ? '#ff4444' : '#8884d8');

type Payload = DataPoint & { zScore?: number };

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: Payload;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="custom-tooltip polished-tooltip" role="tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="tooltip-row" style={{ color: entry.color }}>
          <span className="tooltip-key">{entry.name}:</span> <span className="tooltip-value">{entry.value}</span>
          {entry.dataKey === 'pv' &&
            <span className="tooltip-zscore"> (Z-score: {entry.payload.zScore?.toFixed(2)})</span>}
        </div>
      ))}
    </div>
  );
};

const PvDot: React.FC<DotProps & { payload: Payload }> = memo((props) => {
  const { cx, cy, r = 6, payload } = props;
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  // You may want to remove console.log in production for performance
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      className="pv-dot"
      fill={getPvColor(payload.zScore)}
      stroke={getPvColor(payload.zScore)}
    />
  );
});

const PvActiveDot: React.FC<DotProps & { payload: Payload }> = memo((props) => {
  const { cx, cy, r = 10, payload } = props;
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      className="pv-dot active"
      fill={getPvColor(payload.zScore)}
    />
  );
});
const App: React.FC = () => {
  const { mean, stdDev } = calculateStats(initialData);
  const data = initialData.map((item) => ({
    ...item,
    zScore: stdDev !== 0 ? (item.pv - mean) / stdDev : 0,
  }));

  return (
    <LineChart
      width={500}
      height={300}
      data={data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" padding={{ left: 20, right: 20 }} />
      <YAxis />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Line
        key="pv"
        type="monotone"
        dataKey="pv"
        stroke="#8884d8"
        strokeWidth={2}
        dot={(props: DotProps & { payload: Payload }) => {
          const { key, ...rest } = props;
          return <PvDot key={key} {...rest} />;
        }}
        activeDot={(props: DotProps & { payload: Payload }) => <PvActiveDot {...props} />}
      />
      <Line
        key='uv'
        type="monotone"
        dataKey="uv"
        stroke="#82ca9d"
        strokeWidth={2}
        dot={{ r: 4 }}
        activeDot={{ r: 8 }}
      />
    </LineChart>
  );
};

export default App;
