import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { AppHeader } from '@/features/shell/components/app-header';
import { ResourceList } from '@/features/shell/components/resource-list';
import { teachingApi, type Assessment, type AssessmentStatus } from '@/features/teaching/api';
import { usePaged } from '@/shared/api/use-page';
import { Badge, Meta, OptionChips, Pager, RecordRow, Screen } from '@/shared/ui';

const STATUSES: AssessmentStatus[] = ['SCHEDULED', 'OPEN', 'CLOSED', 'GRADED'];

function tone(status: AssessmentStatus) {
  if (status === 'GRADED') return 'success' as const;
  if (status === 'OPEN') return 'info' as const;
  if (status === 'CLOSED') return 'danger' as const;
  return 'neutral' as const;
}

export function AssessmentsScreen() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'ALL' | AssessmentStatus>('ALL');
  const basePath = user?.role === 'ADMIN' ? '/admin/assessments' : '/teacher/assessments';

  const list = usePaged<Assessment>(
    (page) => teachingApi.assessments.list({ page, status: status === 'ALL' ? undefined : status }),
    [status],
  );

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Assessments"
        subtitle="Every item under the plans you can reach. Open one to record marks."
      />

      <View style={{ gap: 10 }}>
        <OptionChips<'ALL' | AssessmentStatus>
          label="Status"
          value={status}
          onChange={(next) => {
            setStatus(next);
            list.setPage(1);
          }}
          options={[{ value: 'ALL', label: 'All' }, ...STATUSES.map((value) => ({ value, label: value }))]}
        />
      </View>

      <ResourceList
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No assessments in this state."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        renderItem={(assessment) => (
          <RecordRow
            title={assessment.title}
            subtitle={`${assessment.assessment_type} · item ${assessment.sequence_no} · max ${assessment.max_mark} · ${assessment.distribution_status}`}
            badge={<Badge label={assessment.status} tone={tone(assessment.status)} />}
            trailing={<Meta tone="faint">Marks ›</Meta>}
            onPress={() => router.push(`${basePath}/${assessment.id}` as Href)}
          />
        )}
      />
    </Screen>
  );
}
