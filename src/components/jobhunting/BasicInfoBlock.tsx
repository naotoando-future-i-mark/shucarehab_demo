import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { CompanyNote, CustomField } from '../../types/company';
import { EditModal } from './EditModal';

type MasterData = {
  industry?: string;
  location?: string;
  employees?: string;
  position?: string;
  founded_year?: string;
  capital?: string;
  revenue?: string;
  business_description?: string;
  company_url?: string;
} | null;

interface BasicInfoBlockProps {
  companyNote: CompanyNote;
  masterData: MasterData;
  onUpdate: (updates: Partial<CompanyNote>) => void;
}

export const BasicInfoBlock = ({ companyNote, masterData, onUpdate }: BasicInfoBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    industry: companyNote.industry,
    location: companyNote.location,
    employee_count: companyNote.employee_count,
    job_type: companyNote.job_type,
    founded_year: companyNote.founded_year,
    capital: companyNote.capital,
    revenue: companyNote.revenue,
    business_description: companyNote.business_description,
    website_url: companyNote.website_url,
  });
  const [customFields, setCustomFields] = useState<CustomField[]>(
    companyNote.custom_fields || []
  );

  const masterMap: Record<string, string | undefined> = {
    industry: masterData?.industry,
    location: masterData?.location,
    employee_count: masterData?.employees,
    job_type: masterData?.position,
    founded_year: masterData?.founded_year,
    capital: masterData?.capital,
    revenue: masterData?.revenue,
    business_description: masterData?.business_description,
    website_url: masterData?.company_url,
  };

  const getDisplayValue = (key: string) => {
    const master = masterMap[key];
    if (master && master.trim() !== '') return master;
    return formData[key as keyof typeof formData];
  };

  const isFromMaster = (key: string) => {
    const master = masterMap[key];
    return !!(master && master.trim() !== '');
  };

  const handleSave = () => {
    onUpdate({
      ...formData,
      custom_fields: customFields,
    });
    setIsEditing(false);
  };

  const handleAddCustomField = () => {
    if (customFields.length >= 4) return;
    setCustomFields([...customFields, { label: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleUpdateCustomField = (index: number, key: 'label' | 'value', value: string) => {
    const newFields = [...customFields];
    newFields[index][key] = value;
    setCustomFields(newFields);
  };

  const fields = [
    { key: 'industry', label: '業種' },
    { key: 'location', label: '本社所在地' },
    { key: 'employee_count', label: '従業員数' },
    { key: 'job_type', label: '職種' },
    { key: 'founded_year', label: '設立年' },
    { key: 'capital', label: '資本金' },
    { key: 'revenue', label: '売上高' },
    { key: 'business_description', label: '事業内容' },
    { key: 'website_url', label: '企業HP' },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">基本情報</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ key, label }) => {
              const fromMaster = isFromMaster(key);
              const displayVal = getDisplayValue(key);
              return (
                <div key={key} className="min-w-0">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-sm truncate ${fromMaster ? 'text-gray-500' : 'text-gray-900'}`}>
                    {displayVal || '未設定'}
                  </p>
                </div>
              );
            })}
            {customFields.map((field, index) => (
              <div key={`custom-${index}`} className="min-w-0">
                <p className="text-xs text-gray-500 mb-1">{field.label || '項目名なし'}</p>
                <p className="text-sm text-gray-900 truncate">{field.value || '未設定'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EditModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="基本情報を編集"
      >
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            {fields.map(({ key, label }) => {
              const fromMaster = isFromMaster(key);
              const masterVal = masterMap[key];
              return (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  {fromMaster ? (
                    <>
                      <input
                        type="text"
                        value={masterVal || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">※企業マスターから自動取得</p>
                    </>
                  ) : (
                    <input
                      type="text"
                      value={formData[key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">独自項目</h4>
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={index} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateCustomField(index, 'label', e.target.value)}
                        placeholder="項目名"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleUpdateCustomField(index, 'value', e.target.value)}
                        placeholder="メモ"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveCustomField(index)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
              {customFields.length < 4 && (
                <button
                  onClick={handleAddCustomField}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#FFA52F] hover:text-[#FFA52F] flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  項目を追加 ({customFields.length}/4)
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-[#FFA52F] text-white rounded-lg font-medium hover:bg-[#FF9A1F]"
          >
            保存
          </button>
        </div>
      </EditModal>
    </>
  );
};
