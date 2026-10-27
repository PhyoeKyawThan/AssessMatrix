import { useState } from 'react';
import { View } from 'react-native';

import { ROLE_LABELS, type Role } from '@/features/auth/types';
import { AppHeader } from '@/features/shell/components/app-header';
import { ResourceList } from '@/features/shell/components/resource-list';
import { usersApi, type User } from '@/features/users/api';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import {
  Badge,
  Body,
  Button,
  Card,
  ErrorBanner,
  Field,
  FieldRow,
  OptionChips,
  Pager,
  RecordRow,
  Screen,
  Sheet,
} from '@/shared/ui';

type RoleFilter = 'ALL' | Role;

interface Draft {
  id: string | null;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  password: string;
}

const BLANK: Draft = { id: null, username: '', email: '', full_name: '', role: 'STUDENT', is_active: true, password: '' };

function toDraft(user: User): Draft {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    password: '',
  };
}

export function UsersScreen() {
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);

  const list = usePaged<User>(
    (page) => usersApi.list({ page, role: role === 'ALL' ? undefined : role, search: search || undefined, page_size: 20 }),
    [role, search],
  );
  const submit = useSubmit();

  const save = async () => {
    if (draft === null) return;
    const body = {
      username: draft.username,
      email: draft.email,
      full_name: draft.full_name,
      role: draft.role,
    };
    const ok =
      draft.id === null
        ? await submit.run(
            () => usersApi.create({ ...body, password: draft.password }),
            `${draft.full_name || 'User'} created.`,
          )
        : await submit.run(() => usersApi.update(draft.id as string, { ...body, is_active: draft.is_active }), 'User updated.');

    if (ok) {
      setDraft(null);
      list.reload();
    }
  };

  const remove = async () => {
    if (draft === null || draft.id === null) return;
    const ok = await submit.run(() => usersApi.remove(draft.id as string), 'User deleted.');
    if (ok) {
      setDraft(null);
      list.reload();
    }
  };

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Users"
        subtitle="Admin only. Deleting is blocked while a user teaches, enrolls or grades — deactivate instead."
        actions={
          <Button
            label="New user"
            onPress={() => {
              submit.reset();
              setDraft({ ...BLANK });
            }}
          />
        }
      />

      <Card title="Filters">
        <OptionChips<RoleFilter>
          label="Role"
          value={role}
          onChange={(next) => {
            setRole(next);
            list.setPage(1);
          }}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'ADMIN', label: ROLE_LABELS.ADMIN },
            { value: 'TEACHER', label: ROLE_LABELS.TEACHER },
            { value: 'STUDENT', label: ROLE_LABELS.STUDENT },
          ]}
        />
        <FieldRow>
          <Field
            label="Search"
            value={search}
            autoCapitalize="none"
            placeholder="Name, email or username"
            returnKeyType="search"
            onChangeText={setSearch}
            onSubmitEditing={() => list.setPage(1)}
          />
          <View style={{ justifyContent: 'flex-end' }}>
            <Button label="Apply" variant="secondary" onPress={() => list.setPage(1)} />
          </View>
        </FieldRow>
      </Card>

      <ResourceList
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No users match these filters."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        renderItem={(user) => (
          <RecordRow
            title={user.full_name || user.username}
            subtitle={`${user.username} · ${user.email}`}
            badge={
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Badge label={ROLE_LABELS[user.role]} tone={user.role === 'ADMIN' ? 'info' : 'neutral'} />
                <Badge label={user.is_active ? 'Active' : 'Inactive'} tone={user.is_active ? 'success' : 'danger'} />
              </View>
            }
            onPress={() => {
              submit.reset();
              setDraft(toDraft(user));
            }}
          />
        )}
      />

      <Sheet
        title={draft?.id === null || draft?.id === undefined ? 'New user' : 'Edit user'}
        visible={draft !== null}
        onDismiss={() => setDraft(null)}
      >
        {submit.error !== null ? <ErrorBanner title="The API rejected this request" messages={submit.error} /> : null}
        {submit.notice !== null ? <Body tone="success">{submit.notice}</Body> : null}
        {draft !== null ? (
          <View style={{ gap: 16 }}>
            <Field
              label="Full name"
              value={draft.full_name}
              onChangeText={(full_name) => setDraft({ ...draft, full_name })}
            />
            <FieldRow>
              <Field
                label="Username"
                value={draft.username}
                autoCapitalize="none"
                onChangeText={(username) => setDraft({ ...draft, username })}
              />
              <Field
                label="Email"
                value={draft.email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(email) => setDraft({ ...draft, email })}
              />
            </FieldRow>
            <OptionChips<Role>
              label="Role"
              value={draft.role}
              onChange={(nextRole) => setDraft({ ...draft, role: nextRole })}
              options={[
                { value: 'ADMIN', label: ROLE_LABELS.ADMIN },
                { value: 'TEACHER', label: ROLE_LABELS.TEACHER },
                { value: 'STUDENT', label: ROLE_LABELS.STUDENT },
              ]}
            />
            {draft.id === null || draft.id === undefined ? (
              <Field
                label="Password"
                value={draft.password}
                secureTextEntry
                autoCapitalize="none"
                onChangeText={(password) => setDraft({ ...draft, password })}
              />
            ) : (
              <OptionChips<'true' | 'false'>
                label="Account status"
                value={draft.is_active ? 'true' : 'false'}
                onChange={(next) => setDraft({ ...draft, is_active: next === 'true' })}
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
              />
            )}
            <Body tone="muted">
              Django password rules apply on create. A duplicate username or email returns 409.
            </Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ flexGrow: 1, flexBasis: 160 }}>
                <Button
                  label={draft.id === null || draft.id === undefined ? 'Create user' : 'Save changes'}
                  loading={submit.pending}
                  onPress={save}
                />
              </View>
              {draft.id !== null && draft.id !== undefined ? (
                <View style={{ flexGrow: 1, flexBasis: 160 }}>
                  <Button label="Delete user" variant="secondary" disabled={submit.pending} onPress={remove} />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
