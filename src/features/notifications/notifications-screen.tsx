import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { teachingApi, type LecturePlan } from '@/features/teaching/api';
import { notificationsApi, type EligibleRecipient, type InboxNotification, type SentNotification } from '@/features/notifications/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { usePaged } from '@/shared/api/use-page';
import { useResource, useSubmit } from '@/shared/api/use-resource';
import { formatDate } from '@/shared/utils/format';
import { Badge, Body, Button, CheckRow, ErrorBanner, Field, OptionChips, Pager, Picker, RecordRow, ResponsiveDataView, Screen, Sheet } from '@/shared/ui';

type Box = 'INBOX' | 'SENT';
type AdminTarget = 'ROLE' | 'INDIVIDUAL';
type TeacherTarget = 'MODULE' | 'INDIVIDUAL';

export function NotificationsScreen() {
  const { user } = useAuth();
  const canSend = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const [box, setBox] = useState<Box>('INBOX');
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [requiresAck, setRequiresAck] = useState(false);
  const [adminTarget, setAdminTarget] = useState<AdminTarget>('ROLE');
  const [teacherTarget, setTeacherTarget] = useState<TeacherTarget>('MODULE');
  const [targetRole, setTargetRole] = useState<'ALL' | 'TEACHER' | 'STUDENT'>('STUDENT');
  const [moduleId, setModuleId] = useState('');
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const submit = useSubmit();

  const inbox = usePaged<InboxNotification>((page) => notificationsApi.inbox(page), []);
  const sent = usePaged<SentNotification>(
    (page) => canSend ? notificationsApi.sent(page) : Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
    [canSend],
  );
  const eligible = useResource<EligibleRecipient[]>(
    () => canSend ? notificationsApi.eligible() : Promise.resolve([]),
    [canSend],
  );
  const plans = usePaged<LecturePlan>(
    (page) => user?.role === 'TEACHER' ? teachingApi.plans.mine({ page, page_size: 100 }) : Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
    [user?.role],
  );
  const moduleOptions = useMemo(() => plans.items.map((plan) => ({ value: plan.module_id, label: `${plan.module.module_code} — ${plan.module.module_name}` })), [plans.items]);
  const selectedModule = moduleId || moduleOptions[0]?.value || '';

  const resetCompose = () => {
    setTitle(''); setBody(''); setRequiresAck(false); setRecipientIds([]); setModuleId(''); submit.reset();
  };

  const send = async () => {
    const target = user?.role === 'ADMIN'
      ? adminTarget === 'ROLE' ? { target_role: targetRole } : { recipient_ids: recipientIds }
      : teacherTarget === 'MODULE' ? { module_id: selectedModule } : { recipient_ids: recipientIds };
    const ok = await submit.run(
      () => notificationsApi.create({ title: title.trim(), body: body.trim(), requires_acknowledgement: requiresAck, ...target }),
      'Notification saved and push delivery attempted.',
    );
    if (ok) { setComposeOpen(false); resetCompose(); sent.reload(); setBox('SENT'); }
  };

  const markRead = async (notification: InboxNotification) => {
    if (notification.read_at) return;
    const ok = await submit.run(() => notificationsApi.markRead(notification.id));
    if (ok) inbox.reload();
  };

  const acknowledge = async (notification: InboxNotification) => {
    const ok = await submit.run(() => notificationsApi.acknowledge(notification.id), 'Acknowledged.');
    if (ok) inbox.reload();
  };

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Notifications"
        subtitle="Announcements remain here even when push delivery is disabled or unavailable."
        actions={canSend ? <Button label="New notification" onPress={() => { resetCompose(); setComposeOpen(true); }} /> : null}
      />
      {submit.error ? <ErrorBanner title="Notification action failed" messages={submit.error} /> : null}
      {submit.notice ? <Body tone="success">{submit.notice}</Body> : null}
      {canSend ? <OptionChips<Box> value={box} onChange={setBox} options={[{ value: 'INBOX', label: 'Inbox' }, { value: 'SENT', label: 'Sent' }]} /> : null}

      {box === 'INBOX' ? (
        <ResponsiveDataView
          items={inbox.items}
          loading={inbox.loading}
          error={inbox.error}
          emptyMessage="Your notification inbox is empty."
          onRetry={inbox.reload}
          keyExtractor={(notification) => notification.id}
          onRowPress={markRead}
          columns={[
            { key: 'sender', label: 'From', minWidth: 150, render: (notification) => <Body>{notification.sender.full_name}</Body> },
            { key: 'title', label: 'Title', minWidth: 180, flex: 1.3, render: (notification) => <Body>{notification.title}</Body> },
            { key: 'message', label: 'Message', minWidth: 240, flex: 2, render: (notification) => <Body tone="secondary">{notification.body}</Body> },
            { key: 'date', label: 'Received', minWidth: 140, render: (notification) => <Body tone="secondary">{formatDate(notification.created_at)}</Body> },
            { key: 'status', label: 'Status', minWidth: 120, render: (notification) => <Badge label={notification.acknowledged_at ? 'Acknowledged' : notification.read_at ? 'Read' : 'New'} tone={notification.acknowledged_at ? 'success' : notification.read_at ? 'neutral' : 'info'} /> },
            { key: 'action', label: '', minWidth: 130, render: (notification) => notification.requires_acknowledgement && !notification.acknowledged_at ? <Button label="Acknowledge" variant="secondary" onPress={() => acknowledge(notification)} /> : null },
          ]}
          renderCard={(notification) => (
            <RecordRow
              title={notification.title}
              subtitle={`${notification.sender.full_name} · ${formatDate(notification.created_at)}\n${notification.body}`}
              badge={<Badge label={notification.acknowledged_at ? 'Acknowledged' : notification.read_at ? 'Read' : 'New'} tone={notification.acknowledged_at ? 'success' : notification.read_at ? 'neutral' : 'info'} />}
              trailing={notification.requires_acknowledgement && !notification.acknowledged_at ? <Button label="Acknowledge" variant="secondary" onPress={() => acknowledge(notification)} /> : undefined}
              onPress={() => markRead(notification)}
            />
          )}
          footer={<Pager page={inbox.page} pageCount={inbox.pageCount} onChange={inbox.setPage} disabled={inbox.loading} />}
        />
      ) : (
        <ResponsiveDataView
          items={sent.items}
          loading={sent.loading}
          error={sent.error}
          emptyMessage="You have not sent any notifications."
          onRetry={sent.reload}
          keyExtractor={(notification) => notification.id}
          columns={[
            { key: 'title', label: 'Title', minWidth: 180, flex: 1.3, render: (notification) => <Body>{notification.title}</Body> },
            { key: 'message', label: 'Message', minWidth: 260, flex: 2, render: (notification) => <Body tone="secondary">{notification.body}</Body> },
            { key: 'recipients', label: 'Recipients', minWidth: 100, render: (notification) => <Body>{notification.recipient_count}</Body> },
            { key: 'read', label: 'Read', minWidth: 80, render: (notification) => <Body>{notification.read_count}</Body> },
            { key: 'ack', label: 'Acknowledged', minWidth: 110, render: (notification) => <Body>{notification.requires_acknowledgement ? notification.acknowledged_count : '—'}</Body> },
            { key: 'push', label: 'Push accepted', minWidth: 110, render: (notification) => <Body>{notification.delivery_count}</Body> },
            { key: 'date', label: 'Sent', minWidth: 140, render: (notification) => <Body tone="secondary">{formatDate(notification.created_at)}</Body> },
          ]}
          renderCard={(notification) => <RecordRow title={notification.title} subtitle={`${notification.body}\n${notification.recipient_count} recipients · ${notification.read_count} read · ${notification.delivery_count} push accepted`} badge={notification.requires_acknowledgement ? <Badge label={`${notification.acknowledged_count} acknowledged`} tone="info" /> : undefined} />}
          footer={<Pager page={sent.page} pageCount={sent.pageCount} onChange={sent.setPage} disabled={sent.loading} />}
        />
      )}

      <Sheet title="New notification" visible={composeOpen} onDismiss={() => setComposeOpen(false)}>
        {submit.error ? <ErrorBanner title="Could not send notification" messages={submit.error} /> : null}
        <Field label="Title" value={title} placeholder="Important announcement" onChangeText={setTitle} />
        <Field label="Message" value={body} multiline numberOfLines={4} placeholder="Write a clear message for recipients." onChangeText={setBody} />
        <OptionChips<'YES' | 'NO'> label="Acknowledgement" value={requiresAck ? 'YES' : 'NO'} onChange={(value) => setRequiresAck(value === 'YES')} options={[{ value: 'NO', label: 'Not required' }, { value: 'YES', label: 'Require acknowledgement' }]} />
        {user?.role === 'ADMIN' ? (
          <OptionChips<AdminTarget> label="Target" value={adminTarget} onChange={setAdminTarget} options={[{ value: 'ROLE', label: 'Role or everyone' }, { value: 'INDIVIDUAL', label: 'Selected users' }]} />
        ) : (
          <OptionChips<TeacherTarget> label="Target" value={teacherTarget} onChange={setTeacherTarget} options={[{ value: 'MODULE', label: 'Module class' }, { value: 'INDIVIDUAL', label: 'Selected students' }]} />
        )}
        {user?.role === 'ADMIN' && adminTarget === 'ROLE' ? <OptionChips label="Recipients" value={targetRole} onChange={setTargetRole} options={[{ value: 'ALL', label: 'All active users' }, { value: 'TEACHER', label: 'Teachers' }, { value: 'STUDENT', label: 'Students' }]} /> : null}
        {user?.role === 'TEACHER' && teacherTarget === 'MODULE' ? <Picker label="Module" loading={plans.loading} options={moduleOptions} value={selectedModule} onChange={setModuleId} /> : null}
        {(user?.role === 'ADMIN' ? adminTarget === 'INDIVIDUAL' : teacherTarget === 'INDIVIDUAL') ? (
          <View style={{ gap: 8 }}>
            <Body tone="secondary">Select recipients</Body>
            {eligible.data?.map((recipient) => <CheckRow key={recipient.id} title={recipient.full_name || recipient.email} subtitle={`${recipient.role} · ${recipient.email}`} checked={recipientIds.includes(recipient.id)} onToggle={() => setRecipientIds((current) => current.includes(recipient.id) ? current.filter((id) => id !== recipient.id) : [...current, recipient.id])} />)}
          </View>
        ) : null}
        <Button label="Save and send" loading={submit.pending} disabled={!title.trim() || !body.trim() || ((user?.role === 'ADMIN' ? adminTarget === 'INDIVIDUAL' : teacherTarget === 'INDIVIDUAL') && recipientIds.length === 0) || (user?.role === 'TEACHER' && teacherTarget === 'MODULE' && !selectedModule)} onPress={send} />
      </Sheet>
    </Screen>
  );
}
