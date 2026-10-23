import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  Building,
  UploadCloud,
  FileCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { getSignedFileUrl } from '../../lib/storage';
import { MedicalRecord, RecordType } from '../../types';
import { formatDate, formatFileSize } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const RecordsPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dataService.getRecords(user.id);
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [user]);

  const handleOpenViewer = async (rec: MedicalRecord) => {
    setViewRecord(rec);
    setSignedUrl(null);
    if (rec.file_path) {
      setUrlLoading(true);
      try {
        const url = await getSignedFileUrl(rec.file_path);
        setSignedUrl(url);
      } catch (err) {
        console.warn('Could not generate signed download link:', err);
      } finally {
        setUrlLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this health record?')) {
      await dataService.deleteRecord(id);
      loadRecords();
    }
  };

  const filteredRecords = records.filter(rec => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.doctor_name && rec.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rec.notes && rec.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'all' || rec.record_type === selectedType;

    return matchesSearch && matchesType;
  });

  const getRecordTypeBadge = (type: RecordType) => {
    switch (type) {
      case 'lab_result':
        return <Badge variant="teal">Lab Result</Badge>;
      case 'imaging_scan':
        return <Badge variant="pink">Imaging Scan</Badge>;
      case 'prescription':
        return <Badge variant="mint">Prescription</Badge>;
      case 'doctor_note':
        return <Badge variant="slate">Doctor Note</Badge>;
      case 'vaccine_record':
        return <Badge variant="amber">Vaccine Record</Badge>;
      default:
        return <Badge variant="outline">Document</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Digital Health Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Encrypted vault for medical reports, lab results, clinical imaging, and wellness notes
          </p>
        </div>

        <Link to="/records/upload">
          <Button variant="primary" size="sm">
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Report</span>
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by report title, physician, or symptoms..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-teal-500 shadow-sm"
        >
          <option value="all">All Record Types</option>
          <option value="lab_result">Lab Results</option>
          <option value="imaging_scan">Imaging Scans (Ultrasound, X-Ray)</option>
          <option value="doctor_note">Doctor Notes</option>
          <option value="prescription">Prescriptions</option>
          <option value="discharge_summary">Discharge Summaries</option>
          <option value="vaccine_record">Vaccination Records</option>
          <option value="other">Other Records</option>
        </select>
      </div>

      {/* Records Grid */}
      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(rec => (
            <Card key={rec.id} hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  {getRecordTypeBadge(rec.record_type)}
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDate(rec.record_date)}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">
                  {rec.title}
                </h3>

                <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{rec.clinic_or_hospital || rec.doctor_name || 'Clinical Center'}</span>
                </p>

                {rec.notes && (
                  <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                    {rec.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {rec.file_name ? (
                    <span className="flex items-center gap-1 text-teal-700 font-medium">
                      <FileCheck className="w-3.5 h-3.5" />
                      {formatFileSize(rec.file_size_bytes)}
                    </span>
                  ) : (
                    'Note only'
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => handleOpenViewer(rec)}
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Button>

                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-xs">
          No records found matching your filters. Click "Upload New Report" to add clinical files.
        </Card>
      )}

      {/* Record Viewer Modal with Pre-signed URL */}
      <Modal
        isOpen={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        title={viewRecord?.title || 'Health Record Details'}
        description={`Recorded on ${formatDate(viewRecord?.record_date)}`}
        maxWidth="lg"
      >
        {viewRecord && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block">Record Type:</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {viewRecord.record_type.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Doctor / Clinic:</span>
                <span className="font-semibold text-slate-900">
                  {viewRecord.doctor_name || viewRecord.clinic_or_hospital || 'Not specified'}
                </span>
              </div>
            </div>

            {viewRecord.notes && (
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinical Summary & Doctor Notes:
                </span>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {viewRecord.notes}
                </div>
              </div>
            )}

            {/* Document Preview & Pre-signed Download */}
            {viewRecord.file_path && (
              <div className="border border-teal-200/80 rounded-2xl p-4 bg-teal-50/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Attached Document: {viewRecord.file_name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Secure Pre-Signed Download Link (5-minute TTL)
                    </div>
                  </div>

                  {signedUrl && (
                    <a
                      href={signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  )}
                </div>

                {urlLoading && (
                  <p className="text-xs text-slate-500 italic">Generating secure download URL...</p>
                )}

                {signedUrl && (viewRecord.file_type?.startsWith('image/') || viewRecord.file_name?.match(/\.(png|jpg|jpeg)$/i)) && (
                  <div className="mt-3 text-center">
                    <img
                      src={signedUrl}
                      alt={viewRecord.title}
                      className="max-h-72 rounded-xl mx-auto border border-slate-200 shadow-sm"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setViewRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
