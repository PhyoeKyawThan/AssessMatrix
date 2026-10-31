import { useState } from 'react';

import { catalogApi, type Enrollment, type EnrollmentStatus } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { usePaged } from '@/shared/api/use-page';
import { formatDate } from '@/shared/utils/format';
import { Badge, Body, OptionChips, Pager, RecordRow, ResponsiveDataView, Screen } from '@/shared/ui';

const STATUSES: EnrollmentStatus[] = ['ENROLLED', 'COMPLETED', 'DROPPED'];

function tone(status: EnrollmentStatus) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'DROPPED') return 'neutral' as const;
  return 'info' as const;
}

export function MyEnrollmentsScreen() {
  const [status, setStatus] = useState<'ALL' | EnrollmentStatus>('ALL');
  const list = usePaged<Enrollment>((page) => catalogApi.enrollments.mine(page), []);
  const items = status === 'ALL' ? list.items : list.items.filter((row) => row.status === status);

  return (
    <Screen scroll width="content">
      <AppHeader title="My modules" subtitle="Every module you are on the class list for." />

      <OptionChips<'ALL' | EnrollmentStatus>
        label="Status"
        value={status}
        onChange={setStatus}
        options={[{ value: 'ALL', label: 'All' }, ...STATUSES.map((value) => ({ value, label: value }))]}
      />

      <Body tone="muted">{list.count} enrollment rows on the server.</Body>

      <ResponsiveDataView
        items={items}
        loading={list.loading}
        error={list.error}
        emptyMessage="You are not enrolled in any module yet."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        keyExtractor={(enrollment) => enrollment.id}
        columns={[
          { key: 'code', label: 'Code', minWidth: 100, flex: 0.7, render: (enrollment) => <Body>{enrollment.module.module_code}</Body> },
          { key: 'module', label: 'Module', minWidth: 220, flex: 1.7, render: (enrollment) => <Body>{enrollment.module.module_name}</Body> },
          { key: 'enrolled', label: 'Enrolled', minWidth: 140, render: (enrollment) => <Body tone="secondary">{formatDate(enrollment.enrolled_at)}</Body> },
          { key: 'status', label: 'Status', minWidth: 110, render: (enrollment) => <Badge label={enrollment.status} tone={tone(enrollment.status)} /> },
        ]}
        renderCard={(enrollment) => (
          <RecordRow
            title={`${enrollment.module.module_code} — ${enrollment.module.module_name}`}
            subtitle={`Enrolled ${formatDate(enrollment.enrolled_at)}`}
            badge={<Badge label={enrollment.status} tone={tone(enrollment.status)} />}
          />
        )}
      />
    </Screen>
  );
}
