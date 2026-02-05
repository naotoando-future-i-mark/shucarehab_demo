import { useState } from 'react';
import { CompaniesListPage } from './CompaniesListPage';
import { CompanyNotePage } from './CompanyNotePage';

export default function Notes() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  if (selectedCompanyId) {
    return (
      <CompanyNotePage
        companyId={selectedCompanyId}
        onBack={() => setSelectedCompanyId(null)}
      />
    );
  }

  return <CompaniesListPage onCompanySelect={setSelectedCompanyId} />;
}
