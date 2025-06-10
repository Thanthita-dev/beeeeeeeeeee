import React, { useState, useCallback } from 'react';
import { Copy, Calendar, Server, MapPin, Terminal, Check } from 'lucide-react';


interface Building {
  id: string;
  name: string;
  group: 'IIG' | 'NIX' | 'DC3';
}

const buildings: Building[] = [
  { id: 'Phoenix', name: 'Phoenix', group: 'IIG' },
  { id: 'Tokyo', name: 'Tokyo', group: 'NIX' },
  { id: 'Zeus', name: 'Zeus', group: 'NIX' },
  { id: 'Archer', name: 'Archer', group: 'IIG' },
  { id: 'IDC32NIX', name: 'IDC32NIX', group: 'DC3' },
  { id: 'IDC32IIG', name: 'IDC32IIG', group: 'DC3' },
  { id: 'IDC3NIX', name: 'IDC3NIX', group: 'DC3' },
  { id: 'IDC3IIG', name: 'IDC3IIG', group: 'DC3' },
];

const buildingGroups = {
  IIG: buildings.filter(b => b.group === 'IIG'),
  NIX: buildings.filter(b => b.group === 'NIX'),
  DC3: buildings.filter(b => b.group === 'DC3'),
};

function App() {
  const [server, setServer] = useState<'nfsen' | 's3'>('nfsen');
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');
  const [ipAddress, setIpAddress] = useState('');
  const [copied, setCopied] = useState(false);

  const formatDateTime = useCallback((date: string, time: string) => {
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');
    return {
      path: `${year}/${month}/${day}`,
      filename: `nfcapd.${year}${month}${day}${hour}${minute}`
    };
  }, []);

  const generateCommand = useCallback(() => {
    if (!startDate || !endDate || selectedBuildings.length === 0 || !ipAddress) {
      return '';
    }

    const serverPath = server === 'nfsen' 
      ? '/home/nfsen/nfsen/profiles-data/live'
      : '/mnt/s3test';

    const buildingList = selectedBuildings.join(':');
    
    const startDateTime = formatDateTime(startDate, startTime);
    const endDateTime = formatDateTime(endDate, endTime);
    
    const timeRange = `${startDateTime.path}/${startDateTime.filename}:${endDateTime.path}/${endDateTime.filename}`;
    
    return `nfdump -M ${serverPath}/${buildingList} -T -R ${timeRange} -o 'fmt:%ts %td %pr %sap -> %dap %pkt %byt %fl %in %out %flg %bps %sas %das' 'ip ${ipAddress}'`;
  }, [server, selectedBuildings, startDate, startTime, endDate, endTime, ipAddress, formatDateTime]);

  const command = generateCommand();

  const copyToClipboard = async () => {
    if (command) {
      try {
        await navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy command:', err);
      }
    }
  };

  const toggleBuilding = (buildingId: string) => {
    setSelectedBuildings(prev => 
      prev.includes(buildingId)
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  const selectAllBuildings = () => {
    setSelectedBuildings(buildings.map(b => b.id));
  };

  const selectBuildingGroup = (group: 'IIG' | 'NIX' | 'DC3') => {
    const groupBuildings = buildingGroups[group].map(b => b.id);
    const allSelected = groupBuildings.every(id => selectedBuildings.includes(id));
    
    if (allSelected) {
      setSelectedBuildings(prev => prev.filter(id => !groupBuildings.includes(id)));
    } else {
      setSelectedBuildings(prev => [...new Set([...prev, ...groupBuildings])]);
    }
  };

  const clearSelection = () => {
    setSelectedBuildings([]);
  };

  const isValidIP = (ip: string) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-700 px-8 py-6">
              <div className="flex items-center space-x-3">
                <Terminal className="h-8 w-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">NFSEN Command Generator By ตาบี๋</h1>
                  <p className="text-blue-100 mt-1">เครื่องมือสร้างคำสั่ง NFSEN สำหรับการดึงข้อมูล Network Flow</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Server Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-800">เลือก Server</h2>
                </div>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="server"
                      value="nfsen"
                      checked={server === 'nfsen'}
                      onChange={(e) => setServer(e.target.value as 'nfsen' | 's3')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">NFSEN (ข้อมูลล่าสุด 30 วัน)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="server"
                      value="s3"
                      checked={server === 's3'}
                      onChange={(e) => setServer(e.target.value as 'nfsen' | 's3')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">S3 (ข้อมูลย้อนหลังมากกว่า 30 วัน)</span>
                  </label>
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-800">เลือกช่วงเวลา</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">วันที่เริ่มต้น</label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">วันที่สิ้นสุด</label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Building Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-800">เลือกตึก/อุปกรณ์</h2>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllBuildings}
                      className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      เลือกทั้งหมด
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      ล้างการเลือก
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(buildingGroups).map(([groupName, groupBuildings]) => (
                    <div key={groupName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">{groupName}</h3>
                        <button
                          onClick={() => selectBuildingGroup(groupName as 'IIG' | 'NIX' | 'DC3')}
                          className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        >
                          {groupBuildings.every(b => selectedBuildings.includes(b.id)) ? 'ยกเลิก' : 'เลือก'} {groupName}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {groupBuildings.map((building) => (
                          <label key={building.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedBuildings.includes(building.id)}
                              onChange={() => toggleBuilding(building.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                            />
                            <span className="text-gray-700">{building.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IP Address Input */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-800">IP Address</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="เช่น 203.151.32.99"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    ipAddress && !isValidIP(ipAddress)
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {ipAddress && !isValidIP(ipAddress) && (
                  <p className="text-red-600 text-sm">กรุณาใส่ IP Address ที่ถูกต้อง</p>
                )}
              </div>

              {/* Generated Command */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">คำสั่งที่สร้างขึ้น</h2>
                <div className="relative">
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto min-h-[100px] flex items-center">
                    {command ? (
                      <pre className="whitespace-pre-wrap break-all">{command}</pre>
                    ) : (
                      <span className="text-gray-500">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสร้างคำสั่ง</span>
                    )}
                  </div>
                  {command && (
                    <button
                      onClick={copyToClipboard}
                      className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                      title="คัดลอกคำสั่ง"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
                {copied && (
                  <p className="text-green-600 text-sm flex items-center space-x-1">
                    <Check className="h-4 w-4" />
                    <span>คัดลอกคำสั่งเรียบร้อยแล้ว!</span>
                  </p>
                )}
              </div>

              {/* Command Validation */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">ข้อมูลที่จำเป็น:</h3>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li className={`flex items-center space-x-2 ${server ? 'text-green-700' : ''}`}>
                    <span className={`h-2 w-2 rounded-full ${server ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span>เลือก Server ({server ? '✓' : '✗'})</span>
                  </li>
                  <li className={`flex items-center space-x-2 ${startDate && endDate ? 'text-green-700' : ''}`}>
                    <span className={`h-2 w-2 rounded-full ${startDate && endDate ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span>กำหนดช่วงวันที่ ({startDate && endDate ? '✓' : '✗'})</span>
                  </li>
                  <li className={`flex items-center space-x-2 ${selectedBuildings.length > 0 ? 'text-green-700' : ''}`}>
                    <span className={`h-2 w-2 rounded-full ${selectedBuildings.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span>เลือกตึก/อุปกรณ์ ({selectedBuildings.length > 0 ? `✓ (${selectedBuildings.length} รายการ)` : '✗'})</span>
                  </li>
                  <li className={`flex items-center space-x-2 ${ipAddress && isValidIP(ipAddress) ? 'text-green-700' : ''}`}>
                    <span className={`h-2 w-2 rounded-full ${ipAddress && isValidIP(ipAddress) ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span>ใส่ IP Address ({ipAddress && isValidIP(ipAddress) ? '✓' : '✗'})</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;