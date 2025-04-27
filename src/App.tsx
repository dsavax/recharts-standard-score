import React, { memo } from 'react';
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

const pvZScoreThreshold = 1.0;

type DataPoint = {
  name: string;
  uv: number;
  pv: number;
  amt: number;
};

const initialData: DataPoint[] = [
  {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
  {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
  {name: 'Page C', uv: 2000, pv: 9800, amt: 2290},
  {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
  {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
  {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
  {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
];

const calculateStats = (data: DataPoint[]) => {
  const values = data.map((item) => item.pv);
  if (values.length === 0) return {mean: 0, stdDev: 0};
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  return {mean, stdDev};
};

const getZScoreColor = (zScore?: number, threshold: number = 1) =>
  zScore !== undefined && zScore > threshold ? '#ff4444' : '#8884d8';

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

const CustomTooltip: React.FC<CustomTooltipProps> = ({active, payload, label}) => {
  if (!active || !payload || !payload.length) return null;

  const seen = new Set();
  const dedupedPayload = payload.filter(entry => {
    const key = `${entry.dataKey}-${entry.name}`;
    return seen.has(key) ? false : seen.add(key);
  });

  return (
    <div className="custom-tooltip" style={{
      background: 'white',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div className="tooltip-label" style={{fontWeight: 'bold', marginBottom: '8px'}}>
        {label}
      </div>
      {dedupedPayload.map((entry) => (
        <div key={entry.name} style={{
          color: entry.color,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          margin: '4px 0'
        }}>
          <span>{entry.name}:</span>
          <span>{entry.value}</span>
          {entry.dataKey === 'pv' && entry.payload?.zScore !== undefined && (
            <span style={{
              color: entry.payload.zScore > pvZScoreThreshold ? "#ff4444" : "#8884d8",
              marginLeft: '8px'
            }}>
              (z: {entry.payload.zScore.toFixed(2)})
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

interface PvDotProps extends DotProps {
  payload: Payload;
}

const PvDot: React.FC<PvDotProps> = memo(({cx, cy, r = 4, payload}) => {
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={getZScoreColor(payload.zScore, pvZScoreThreshold)}
      stroke={getZScoreColor(payload.zScore, pvZScoreThreshold)}
    />
  );
});

const App: React.FC = () => {
  const {mean, stdDev} = calculateStats(initialData);
  const dataWithAbsZScores = initialData.map((item) => ({
    ...item,
    zScore: stdDev !== 0 ? Math.abs((item.pv - mean) / stdDev) : 0,
  }));

  const gradientStops: Array<{ offset: string; color: string }> = [];
  if (dataWithAbsZScores.length > 0) {
    let currentColor = getZScoreColor(dataWithAbsZScores[0].zScore);
    gradientStops.push({offset: '0%', color: currentColor});

    for (let i = 1; i < dataWithAbsZScores.length; i++) {
      const newColor = getZScoreColor(dataWithAbsZScores[i].zScore);
      if (newColor !== currentColor) {
        const position = ((i - 1) / (dataWithAbsZScores.length - 1)) * 100;
        gradientStops.push({offset: `${position}%`, color: currentColor});
        gradientStops.push({offset: `${position}%`, color: newColor});
        currentColor = newColor;
      }
    }

    gradientStops.push({
      offset: '100%',
      color: currentColor
    });
  }

  return (
    <LineChart
      width={600}
      height={350}
      data={dataWithAbsZScores}
      margin={{top: 5, right: 30, left: 20, bottom: 5}}
    >
      <defs>
        <linearGradient id="colorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          {gradientStops.map((stop, index) => (
            <stop
              key={index}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
        </linearGradient>
      </defs>

      <CartesianGrid strokeDasharray="3 3"/>
      <XAxis dataKey="name"/>
      <YAxis/>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend/>

      <Line
        type="monotone"
        dataKey="pv"
        stroke="url(#colorGradient)"
        strokeWidth={2}
        dot={<PvDot />}
        activeDot={<PvDot r={6} />}
        connectNulls
        isAnimationActive={false}
      />

      <Line
        type="monotone"
        dataKey="uv"
        stroke="#82ca9d"
        strokeWidth={2}
      />
    </LineChart>
  );
};

export default App;
