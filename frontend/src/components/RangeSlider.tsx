'use client';

import { useState } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  onChange: (value: { min: number; max: number }) => void;
}

const RangeSlider = ({ min, max, step, onChange }: RangeSliderProps) => {
  const [minValue, setMinValue] = useState(min);
  const [maxValue, setMaxValue] = useState(max);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxValue - step);
    setMinValue(value);
    onChange({ min: value, max: maxValue });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minValue + step);
    setMaxValue(value);
    onChange({ min: minValue, max: value });
  };

  return (
    <div className="relative w-full">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minValue}
        onChange={handleMinChange}
        className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxValue}
        onChange={handleMaxChange}
        className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none"
      />
      <div className="relative h-2">
        <div className="absolute z-10 w-full h-2 bg-gray-600 rounded-lg">
          <div
            className="absolute z-20 h-2 bg-green-500 rounded-lg"
            style={{ left: `${(minValue / max) * 100}%`, width: `${((maxValue - minValue) / max) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;
