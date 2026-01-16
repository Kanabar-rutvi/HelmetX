import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const SubmitDPR = () => {
  const [task, setTask] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [todayReport, setTodayReport] = useState<{ task?: string; imageUrl?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
    if (f) setImagePreview(URL.createObjectURL(f)); else setImagePreview('');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      if (videoRef.current) {
        const v = videoRef.current as HTMLVideoElement & { srcObject: MediaStream | null };
        v.srcObject = stream;
        await videoRef.current.play();
        setCameraOn(true);
      }
    } catch (e) { console.error(e); }
  };

  const stopCamera = () => {
    const v = videoRef.current as HTMLVideoElement & { srcObject: MediaStream | null } | null;
    const stream = v?.srcObject as MediaStream | undefined;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) {
      const vid = videoRef.current as HTMLVideoElement & { srcObject: MediaStream | null };
      vid.srcObject = null;
    }
    setCameraOn(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/png');
    setImagePreview(dataUrl);
    setImageFile(null);
  };

  const loadTodayData = async () => {
    try {
      const res = await api.get('/reports/me/today');
      return res.data;
    } catch {
      return null;
    }
  };

  useEffect(() => { 
    (async () => {
      const data = await loadTodayData();
      if (data) { setTimeout(() => setTodayReport(data), 0); }
    })();
  }, []);
  useEffect(() => { return () => stopCamera(); }, []);

  const submit = async () => {
    try {
      const imageData = imageFile ? await toBase64(imageFile) : (imagePreview?.startsWith('data:image') ? imagePreview : undefined);
      const { data } = await api.post('/reports/me', { task, imageData });
      setTodayReport(data);
      setTask('');
      setImageFile(null);
      setImagePreview('');
      alert('Daily progress report submitted');
    } catch (err: unknown) { 
      const msg = (typeof err === 'object' && err && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message) 
        || (err instanceof Error ? err.message : 'Failed to submit');
      alert(msg);
    }
  };

  return (
    <Layout role="worker">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Submit Daily Progress Report</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <label className="block text-sm text-gray-600 mb-1">Today's Task</label>
            <textarea value={task} onChange={(e) => setTask(e.target.value)} className="w-full border rounded-lg p-2" rows={5} placeholder="Describe your work" />
            <label className="block text-sm text-gray-600 mt-4 mb-1">Upload Work Photo</label>
            <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="w-full" />
            <div className="mt-3 flex gap-2">
              {!cameraOn ? (
                <button onClick={startCamera} className="px-3 py-2 rounded bg-gray-100">Open Camera</button>
              ) : (
                <>
                  <button onClick={capturePhoto} className="px-3 py-2 rounded bg-blue-600 text-white">Capture</button>
                  <button onClick={stopCamera} className="px-3 py-2 rounded bg-gray-100">Close</button>
                </>
              )}
            </div>
            {cameraOn && (
              <video ref={videoRef} className="mt-3 w-full rounded-lg border h-48 object-cover" playsInline />
            )}
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 rounded-lg border h-48 object-cover" />}
            <div className="mt-4">
              <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Submit DPR</button>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3">Today's Report</h3>
            {!todayReport ? (
              <p className="text-gray-500 text-sm">No report submitted yet</p>
            ) : (
              <div>
                <p className="text-sm text-gray-700 mb-2">{todayReport.task}</p>
                {todayReport.imageUrl && (
                  <img
                    src={`${api.defaults?.baseURL ? api.defaults.baseURL.replace(/\/api$/, '') : (import.meta as ImportMeta).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${todayReport.imageUrl}`}
                    alt="Report"
                    className="rounded-lg border h-48 object-cover"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubmitDPR;
