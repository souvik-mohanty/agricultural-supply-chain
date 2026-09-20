import React, { useState } from 'react';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import { downloadReport } from '../../service/adminApi';
import { getErrorMessage } from '../../lib/errors';

const REPORTS = [
  { type: 'pdf', label: 'User report (PDF)', file: 'agrolink-users.pdf', description: 'Every user with email, role and whether they are suspended.' },
  { type: 'excel', label: 'User report (Excel)', file: 'agrolink-users.xlsx', description: 'The same data as a spreadsheet.' },
];

// The token travels in a header, so a plain link would not work: fetch the file, then hand it to the browser.
const AdminReports = () => {
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);

  const download = async (report) => {
    setNotice(null);
    setBusy(report.type);
    try {
      const { data } = await downloadReport(report.type);
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.file;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice({ type: 'success', text: `${report.label} downloaded.` });
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error, 'Could not generate the report.') });
    } finally {
      setBusy(null);
    }
  };

  return (
    <PageLayout title="Reports" subtitle="Downloadable summaries">
      <Notice type={notice?.type}>{notice?.text}</Notice>
      <div className="ui-grid-2">
        {REPORTS.map((report) => (
          <section key={report.type} className="ui-card">
            <h2>{report.label}</h2>
            <p className="pg-sub">{report.description}</p>
            <button type="button" className="ui-btn primary" onClick={() => download(report)} disabled={busy !== null}>
              {busy === report.type ? 'Preparing…' : 'Download'}
            </button>
          </section>
        ))}
      </div>
    </PageLayout>
  );
};

export default AdminReports;
