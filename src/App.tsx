import React, { useState } from 'react';
import { Calendar, DollarSign, Clock, Briefcase, TrendingUp } from 'lucide-react';

interface SalaryRequest {
  startDate: string;
  endDate: string;
  hourlyRate: number;
  hoursPerDay: number;
  workedWeekends: boolean;
  weekendPremiumMultiplier: number;
  excludeHolidays: boolean;
}

interface SalaryResponse {
  totalSalary: number;
  totalHours: number;
  totalDays: number;
  weekdayCount: number;
  weekendCount: number;
  holidayCount: number;
  holidayDates: string[];
  weekdaySalary: number;
  weekendSalary: number;
  holidaySalary: number;
  effectiveWeekendRate: number;
}

export default function SalaryCalculator() {
  const [formData, setFormData] = useState<SalaryRequest>({
    startDate: '',
    endDate: '',
    hourlyRate: 0,
    hoursPerDay: 8,
    workedWeekends: false,
    weekendPremiumMultiplier: 1.0,
    excludeHolidays: true,
  });

  const [result, setResult] = useState<SalaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // US Federal Holidays (2024-2026) - stored as YYYY-MM-DD strings to avoid timezone issues
  const holidays = [
    // 2024
    '2024-01-01', '2024-01-15', '2024-02-19', '2024-05-27', '2024-06-19',
    '2024-07-04', '2024-09-02', '2024-10-14', '2024-11-11', '2024-11-28',
    '2024-12-25',
    // 2025
    '2025-01-01', '2025-01-20', '2025-02-17', '2025-05-26', '2025-06-19',
    '2025-07-04', '2025-09-01', '2025-10-13', '2025-11-11', '2025-11-27',
    '2025-12-25',
    // 2026
    '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-06-19',
    '2026-07-03', '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26',
    '2026-12-25'
  ];

  const calculateSalary = (request: SalaryRequest): SalaryResponse => {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    if (request.hourlyRate <= 0) {
      throw new Error('Hourly rate must be greater than 0');
    }

    if (request.hoursPerDay <= 0 || request.hoursPerDay > 24) {
      throw new Error('Hours per day must be between 0 and 24');
    }

    let weekdayCount = 0;
    let weekendCount = 0;
    let holidayCount = 0;
    const holidayDates: string[] = [];

    // Iterate through each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Format date as YYYY-MM-DD for comparison (avoids timezone issues)
      const dateString = currentDate.toISOString().split('T')[0];
      
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const isHoliday = holidays.includes(dateString);

      if (isHoliday) {
        holidayCount++;
        holidayDates.push(dateString);
        if (request.excludeHolidays) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue; // Skip this day
        }
      } else if (isWeekend) {
        weekendCount++;
        if (!request.workedWeekends) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue; // Skip weekends if not worked
        }
      } else {
        weekdayCount++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate salary components
    const weekdayHours = weekdayCount * request.hoursPerDay;
    const weekdaySalary = weekdayHours * request.hourlyRate;

    const weekendHours = request.workedWeekends ? weekendCount * request.hoursPerDay : 0;
    const effectiveWeekendRate = request.hourlyRate * request.weekendPremiumMultiplier;
    const weekendSalary = weekendHours * effectiveWeekendRate;

    const holidayHours = !request.excludeHolidays ? holidayCount * request.hoursPerDay : 0;
    const holidaySalary = holidayHours * request.hourlyRate;

    const totalSalary = weekdaySalary + weekendSalary + holidaySalary;
    const totalHours = weekdayHours + weekendHours + holidayHours;
    const totalDays = weekdayCount + (request.workedWeekends ? weekendCount : 0) + 
                      (request.excludeHolidays ? 0 : holidayCount);

    return {
      totalSalary: Math.round(totalSalary * 100) / 100,
      totalHours,
      totalDays,
      weekdayCount,
      weekendCount,
      holidayCount,
      holidayDates,
      weekdaySalary: Math.round(weekdaySalary * 100) / 100,
      weekendSalary: Math.round(weekendSalary * 100) / 100,
      holidaySalary: Math.round(holidaySalary * 100) / 100,
      effectiveWeekendRate: Math.round(effectiveWeekendRate * 100) / 100
    };
  };

  const handleSubmit = () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Validate required fields
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Please enter both start and end dates');
      }

      if (formData.hourlyRate <= 0) {
        throw new Error('Please enter a valid hourly rate');
      }

      // Perform calculation on the frontend
      const calculatedResult = calculateSalary(formData);
      
      // Simulate a brief loading state for better UX
      setTimeout(() => {
        setResult(calculatedResult);
        setLoading(false);
      }, 300);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <DollarSign className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">Salary Calculator</h1>
          </div>
          <p className="text-gray-600">Calculate your earnings for any date range</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Enter Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate || ''}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="25.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  Hours Per Day
                </label>
                <input
                  type="number"
                  name="hoursPerDay"
                  value={formData.hoursPerDay}
                  onChange={handleInputChange}
                  step="0.5"
                  min="0.5"
                  max="24"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="workedWeekends"
                    checked={formData.workedWeekends}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">I worked on weekends</span>
                </label>

                {formData.workedWeekends && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      Weekend Premium Multiplier
                    </label>
                    <input
                      type="number"
                      name="weekendPremiumMultiplier"
                      value={formData.weekendPremiumMultiplier}
                      onChange={handleInputChange}
                      step="0.1"
                      min="1"
                      max="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      1.0 = regular rate, 1.5 = time and a half, 2.0 = double time
                    </p>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="excludeHolidays"
                  checked={formData.excludeHolidays}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Exclude US Federal Holidays</span>
              </label>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Calculating...' : 'Calculate Salary'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Salary Breakdown</h2>
            
            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Briefcase className="w-16 h-16 mb-4" />
                <p className="text-center">Enter your details and click calculate to see results</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                  <p className="text-sm opacity-90 mb-1">Total Salary</p>
                  <p className="text-4xl font-bold">${result.totalSalary.toLocaleString()}</p>
                  <p className="text-sm opacity-75 mt-2">
                    {result.totalHours} hours across {result.totalDays} days
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Weekday Earnings</span>
                    <span className="font-semibold text-gray-900">${result.weekdaySalary.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600 px-3">
                    <span>{result.weekdayCount} weekdays</span>
                  </div>

                  {result.weekendSalary > 0 && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-700">Weekend Earnings</span>
                        <span className="font-semibold text-blue-900">${result.weekendSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 px-3">
                        <span>{result.weekendCount} weekend days</span>
                        <span>${result.effectiveWeekendRate}/hr</span>
                      </div>
                    </>
                  )}

                  {result.holidaySalary > 0 && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700">Holiday Earnings</span>
                        <span className="font-semibold text-green-900">${result.holidaySalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 px-3">
                        <span>{result.holidayCount} holidays</span>
                      </div>
                    </>
                  )}

                  {result.holidayDates.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800">
                        View holidays in date range ({result.holidayDates.length})
                      </summary>
                      <ul className="mt-2 text-xs text-gray-600 space-y-1 pl-4">
                        {result.holidayDates.map((date, idx) => (
                          <li key={idx}>• {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{result.totalDays}</p>
                    <p className="text-xs text-gray-600">Working Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{result.totalHours}</p>
                    <p className="text-xs text-gray-600">Total Hours</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Built with React + TypeScript | Client-Side Calculations (v1.0)</p>
          <p className="mt-1 text-xs">⚡ No backend required - All calculations run in your browser</p>
        </div>
      </div>
    </div>
  );
}