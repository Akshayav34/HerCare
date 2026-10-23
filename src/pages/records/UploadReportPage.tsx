import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UploadCloud, FileText, ArrowLeft, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { uploadMedicalDocument } from '../../lib/storage';
import { RecordType } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FileUploader } from '../../components/records/FileUploader';

const uploadSchema = z.object({
  title: z.string().min(3, 'Report title is required'),
  record_type: z.enum([
    'lab_result',
    'imaging_scan',
    'prescription',
    'doctor_note',
    'discharge_summary',
    'vaccine_record',
    'other',
  ]),
  record_date: z.string().min(1, 'Please select document date'),
  doctor_name: z.string().optional(),
  clinic_or_hospital: z.string().optional(),
  notes: z.string().optional(),
  is_confidential: z.boolean().default(true),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export const UploadReportPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      record_type: 'lab_result',
      record_date: new Date().toISOString().split('T')[0],
      is_confidential: true,
    },
  });

  const onSubmit = async (data: UploadFormData) => {
    if (!user) return;
    setErrorMsg(null);
    setIsUploading(true);

    try {
      let uploadedFileMeta: { path: string; fileName: string; fileSize: number; fileType: string } | null = null;

      if (selectedFile) {
        uploadedFileMeta = await uploadMedicalDocument(user.id, selectedFile);
      }

      await dataService.addRecord({
        user_id: user.id,
        title: data.title,
        record_type: data.record_type,
        record_date: data.record_date,
        doctor_name: data.doctor_name,
        clinic_or_hospital: data.clinic_or_hospital,
        notes: data.notes,
        file_path: uploadedFileMeta?.path,
        file_name: uploadedFileMeta?.fileName,
        file_type: uploadedFileMeta?.fileType,
        file_size_bytes: uploadedFileMeta?.fileSize,
        is_confidential: data.is_confidential,
      });

      navigate('/records');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/records')}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Upload Medical Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store PDF lab reports, ultrasound scans, or diagnostic summaries with client-side encryption
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-2xl p-4 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Document File Uploader Component */}
        <Card className="p-6">
          <label className="text-xs font-semibold text-slate-800 block mb-2">
            Select Report File (PDF, JPG, PNG - Max 10MB)
          </label>
          <FileUploader
            onFileSelected={setSelectedFile}
            selectedFile={selectedFile}
          />
        </Card>

        {/* Metadata Details */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Document Metadata
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Report Title *
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Complete Blood Count & Ferritin Panel"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Record Type *
              </label>
              <select
                {...register('record_type')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 capitalize font-medium"
              >
                <option value="lab_result">Lab Result (Blood, Urine, Biopsy)</option>
                <option value="imaging_scan">Imaging Scan (Ultrasound, MRI, X-Ray)</option>
                <option value="prescription">Prescription Slip</option>
                <option value="doctor_note">Doctor Clinical Note</option>
                <option value="discharge_summary">Hospital Discharge Summary</option>
                <option value="vaccine_record">Vaccine Record</option>
                <option value="other">Other Healthcare Document</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Date of Examination / Test *
              </label>
              <input
                type="date"
                {...register('record_date')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
              {errors.record_date && (
                <p className="text-xs text-red-500 mt-1">{errors.record_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Physician / Specialist
              </label>
              <input
                type="text"
                {...register('doctor_name')}
                placeholder="e.g. Dr. Sarah Jenkins"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Clinic, Lab, or Hospital
              </label>
              <input
                type="text"
                {...register('clinic_or_hospital')}
                placeholder="e.g. Swedish Medical Center"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Summary Findings & Key Numbers
            </label>
            <textarea
              rows={3}
              {...register('notes')}
              placeholder="e.g. Ferritin 14 ng/mL, fasting blood sugar normal, follow up recommended in 3 months"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_confidential')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 mt-0.5"
              />
              <span className="text-xs text-slate-600 leading-snug">
                <strong>Mark as confidential:</strong> Private file access strictly restricted to authorized session tokens. Will NOT be shown on public emergency card QR.
              </span>
            </label>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => navigate('/records')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isUploading}
            className="px-6 font-semibold"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload & Save Record</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
