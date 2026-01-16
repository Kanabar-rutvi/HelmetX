import React, { useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle, XCircle, LogIn, LogOut, History, ScanLine, X, Upload } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../utils/api';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

type AttendanceRecord = {
  _id: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'checked_out';
  duration?: number;
};

interface Props {
  data: AttendanceRecord | null;
  loading?: boolean;
  onRefresh?: () => void;
}

const AttendanceScannerCard: React.FC<Props> = ({ data, loading, onRefresh }) => {
  const [liveDuration, setLiveDuration] = useState<string>('00:00');
  const [currentTime, setCurrentTime] = useState<string>(format(new Date(), 'hh:mm:ss a'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'IN' | 'OUT'>('IN');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clock for upload modal
    const clockInterval = setInterval(() => {
        setCurrentTime(format(new Date(), 'hh:mm:ss a'));
    }, 1000);

    let timer: number;
    if (data?.checkInTime && !data.checkOutTime) {
      const start = new Date(data.checkInTime).getTime();
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = now - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setLiveDuration(`${hours}h ${minutes}m`);
      };
      
      updateTimer();
      timer = window.setInterval(updateTimer, 60000); // Update every minute
    } else if (data?.duration) {
      const hours = Math.floor(data.duration / 60);
      const minutes = data.duration % 60;
      setLiveDuration(`${hours}h ${minutes}m`);
    } else {
      setLiveDuration('00:00');
    }

    return () => {
        clearInterval(timer);
        clearInterval(clockInterval);
    };
  }, [data]);

  useEffect(() => {
    if (showScanner) {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(
            (decodedText) => {
                console.log('Scanned:', decodedText);
                scanner.clear();
                setShowScanner(false);
                handleManualScan(decodedText);
            },
            (error) => {
                // console.warn(error);
            }
        );

        return () => {
            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        };
    }
  }, [showScanner]);

  const handleManualScan = async (scannedData?: string, type?: 'IN' | 'OUT') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
        // Determine type if not provided
        const scanType = type || (!data || (data.checkInTime && data.checkOutTime) ? 'IN' : 'OUT');

        if (scanType === 'IN') {
            // Check In
            await api.post('/attendance/checkin', { 
                deviceId: 'WEB_DASHBOARD',
                scannedData
            });
        } else {
            // Check Out
            await api.post('/attendance/checkout', {
                scannedData
            });
        }
        if (onRefresh) onRefresh();
        setShowUploadModal(false);
    } catch (error) {
        console.error('Scan error:', error);
        alert('Error processing scan');
    } finally {
        setIsProcessing(false);
    }
  };

  const startScanning = () => {
    setShowScanner(true);
  };

  const stopScanning = () => {
    setShowScanner(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      try {
          const html5QrCode = new Html5Qrcode("reader-hidden");
          const decodedText = await html5QrCode.scanFile(file, true);
          console.log("File Scanned:", decodedText);
          await handleManualScan(decodedText, uploadType);
      } catch (err) {
          console.error("Error scanning file", err);
          alert("Could not find a valid QR code in the image.");
          setIsProcessing(false);
      } finally {
          // Reset input
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const openUploadModal = () => {
      setShowUploadModal(true);
  };

  const triggerFileUpload = (type: 'IN' | 'OUT') => {
      setUploadType(type);
      fileInputRef.current?.click();
  };

  const getStatusColor = () => {
    if (!data) return 'bg-slate-100 text-slate-500 border-slate-200';
    if (data.status === 'checked_out') return 'bg-green-50 text-green-700 border-green-200';
    if (data.status === 'present') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };

  const getStatusIcon = () => {
    if (!data) return <Clock size={24} />;
    if (data.status === 'checked_out') return <CheckCircle size={24} />;
    return <LogIn size={24} />;
  };

  const getStatusText = () => {
    if (!data) return 'Not Scanned';
    if (data.status === 'checked_out') return 'Checked Out';
    if (data.status === 'present') return 'Checked In';
    return data.status;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Attendance Scanner</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Syncs with Helmet RFID</p>
        </div>
        <div className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-colors ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="font-mono font-bold text-sm min-w-[85px] text-center">{currentTime}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500">
              <History size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{getStatusText()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
             <p className="text-xs text-slate-500 mb-1">Scan IN</p>
             <p className="font-medium text-slate-700 dark:text-slate-200">
               {data?.checkInTime ? format(new Date(data.checkInTime), 'HH:mm') : '--:--'}
             </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
             <p className="text-xs text-slate-500 mb-1">Scan OUT</p>
             <p className="font-medium text-slate-700 dark:text-slate-200">
               {data?.checkOutTime ? format(new Date(data.checkOutTime), 'HH:mm') : '--:--'}
             </p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Worked Duration</span>
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{liveDuration}</span>
          </div>
        </div>

        {/* Manual Scan Button (Requested Feature) */}
        <div className="flex gap-2">
            <button 
                onClick={startScanning}
                disabled={isProcessing || (data?.status === 'checked_out')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    isProcessing || data?.status === 'checked_out'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : !data 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                }`}
            >
                <ScanLine size={20} />
                {isProcessing ? 'Processing...' : 
                data?.status === 'checked_out' ? 'Shift Completed' :
                !data ? 'Tap to Check In' : 'Tap to Check Out'}
            </button>
            
            <button
                onClick={openUploadModal}
                disabled={isProcessing || (data?.status === 'checked_out')}
                className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Upload QR Image"
            >
                <Upload size={20} />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
            />
        </div>
        
        {/* Hidden reader for file scan */}
        <div id="reader-hidden" className="hidden"></div>

      </div>

      {/* Upload Choice Modal */}
      {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                  <button 
                      onClick={() => setShowUploadModal(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                      <X size={20} />
                  </button>
                  
                  <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Manual Scan Upload</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Select scan type</p>
                  </div>

                  <div className="text-center mb-8">
                      <div className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                          {currentTime}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 uppercase tracking-wide">Current Site Time</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <button
                          onClick={() => triggerFileUpload('IN')}
                          disabled={data?.status === 'present'} // Warn if already checked in? Or just let them duplicate check (backend handles)
                          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border-2 border-blue-200 dark:border-blue-800 transition-all group"
                      >
                          <div className="p-3 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                              <LogIn size={24} />
                          </div>
                          <span className="font-bold text-blue-700 dark:text-blue-300">Scan IN</span>
                      </button>

                      <button
                          onClick={() => triggerFileUpload('OUT')}
                          disabled={!data || data.status === 'checked_out'} // Disable if not checked in
                          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border-2 border-red-200 dark:border-red-800 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <div className="p-3 rounded-full bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
                              <LogOut size={24} />
                          </div>
                          <span className="font-bold text-red-700 dark:text-red-300">Scan OUT</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">
                <div className="p-4 flex justify-between items-center border-b dark:border-slate-700">
                    <h3 className="font-bold text-lg dark:text-white">Scan QR Code</h3>
                    <button onClick={stopScanning} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 bg-black">
                    <div id="reader" className="w-full rounded-lg overflow-hidden"></div>
                </div>
                <div className="p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Point your camera at the Site QR Code to {data ? 'Check Out' : 'Check In'}
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceScannerCard;
