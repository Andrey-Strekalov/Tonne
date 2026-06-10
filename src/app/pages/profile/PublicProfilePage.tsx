import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/app/layout/MainLayout'
import { useAuth } from '@/app/providers/auth-context'
import { getUserProfile } from '@/shared/api/profile'
import { getUserRequisites } from '@/shared/api/requisites'
import { getDisplayName, getInitials, getRoleLabel, formatJoinedDate } from './profile-utils'

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .18s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

function CopyField({ value, mono = false }: { value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => { setCopied(false) }, 1200)
  }
  return (
    <div className="group flex items-center gap-2">
      <span className={`text-sm text-ink ${mono ? "font-['JetBrains_Mono',ui-monospace,monospace] text-[13.5px] font-medium" : ''}`}>{value}</span>
      <button
        onClick={copy}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--gk-radius-sm)] border text-[var(--gk-fg-muted)] opacity-0 transition-all group-hover:opacity-100 hover:border-[var(--gk-border-strong)] hover:text-ink ${copied ? '!opacity-100 border-green bg-green-soft !text-green-deep' : 'border-[var(--gk-border)]'}`}
        title="Скопировать"
      >
        {copied ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        )}
      </button>
    </div>
  )
}

function ReqField({ label, value, mono = false, fullWidth = false }: { label: string; value: string; mono?: boolean; fullWidth?: boolean }) {
  if (!value) { return null }
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <p className="mb-1 text-xs text-[var(--gk-fg-muted)]">{label}</p>
      <CopyField value={value} mono={mono} />
    </div>
  )
}

function ReqSection({ title, children, dashed = false }: { title: string; children: React.ReactNode; dashed?: boolean }) {
  return (
    <div className={`px-5 py-4 sm:px-6 ${dashed ? 'border-t border-dashed border-[var(--gk-border)]' : ''}`}>
      <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--gk-fg-muted)]">{title}</p>
      {children}
    </div>
  )
}

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const id = Number(userId)

  const [reqOpen, setReqOpen] = useState(true)

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => getUserProfile(id),
    enabled: !isNaN(id) && id > 0,
  })

  const { data: reqData, isLoading: reqLoading } = useQuery({
    queryKey: ['user-requisites', id],
    queryFn: () => getUserRequisites(id),
    enabled: !isNaN(id) && id > 0,
  })

  if (user && !isNaN(id) && user.id === id) {
    return <Navigate to="/profile" replace />
  }

  if (profileLoading || reqLoading) {
    return (
      <MainLayout>
        <p className="text-sm text-[var(--gk-fg-muted)]">Загружаем профиль...</p>
      </MainLayout>
    )
  }

  const profile = profileData?.profile
  const req = reqData?.requisites

  if (!profile) {
    return (
      <MainLayout>
        <p className="text-sm text-[var(--gk-danger)]">Профиль не найден.</p>
      </MainLayout>
    )
  }

  const displayName = getDisplayName(req?.company_name || profile.first_name)
  const initials = getInitials(req?.company_name ?? '', profile.first_name)

  return (
    <MainLayout>
      <div className="mx-auto max-w-[860px]">
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Профиль</h1>
          <p className="mt-1.5 text-sm text-[var(--gk-fg-muted)]">Данные и реквизиты организации</p>
        </div>

        <div className="space-y-5">
          {/* Profile band */}
          <div className="rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] bg-cream">
            <div className="grid grid-cols-[auto_1fr] gap-7 p-6 sm:p-7">
              {/* Avatar */}
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[var(--gk-radius-lg)] border border-[var(--gk-border-strong)] bg-green-deep">
                {profile.company_logo ? (
                  <img src={profile.company_logo} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[28px] font-bold tracking-tight text-cream">
                    {initials}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 space-y-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[22px] font-bold tracking-tight text-ink">{displayName}</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2.5 py-1 text-xs font-medium text-green-deep">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-deep" />
                    {getRoleLabel(profile.role)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-9">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[.08em] text-[var(--gk-fg-muted)]">
                      Телефон
                    </p>
                    <CopyField value={profile.phone_number} mono />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[.08em] text-[var(--gk-fg-muted)]">
                      На платформе с
                    </p>
                    <p className="text-sm text-ink">{formatJoinedDate(profile.date_joined)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requisites card */}
          {req && (
            <div className="rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] bg-cream">
              <div className="flex items-center justify-between border-b border-[var(--gk-border)] px-5 py-4 sm:px-6">
                <div>
                  <h3 className="text-[17px] font-semibold tracking-tight text-ink">Реквизиты организации</h3>
                  <p className="mt-0.5 text-xs text-[var(--gk-fg-muted)]">Юридические данные контрагента</p>
                </div>
                <button
                  className="rounded-[var(--gk-radius-sm)] p-1.5 text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,.04)] hover:text-ink"
                  onClick={() => { setReqOpen(!reqOpen) }}
                  title={reqOpen ? 'Свернуть' : 'Развернуть'}
                >
                  <ChevronIcon open={reqOpen} />
                </button>
              </div>

              {reqOpen && (
                <>
                  <ReqSection title="Основные сведения">
                    <div className="grid grid-cols-2 gap-x-7 gap-y-4">
                      <ReqField label="Юридическое наименование" value={req.company_name} fullWidth />
                      <ReqField label="Юридический адрес" value={req.legal_address} fullWidth />
                      <ReqField label="ИНН" value={req.inn} mono />
                      <ReqField label="ОГРН" value={req.ogrn} mono />
                    </div>
                  </ReqSection>
                  <ReqSection title="Банковские реквизиты" dashed>
                    <div className="grid grid-cols-2 gap-x-7 gap-y-4">
                      <ReqField label="БИК" value={req.bik} mono />
                      <ReqField label="Наименование банка" value={req.bank_name} />
                      <ReqField label="Расчётный счёт" value={req.checking_account} mono />
                      <ReqField label="Корреспондентский счёт" value={req.correspondent_account} mono />
                    </div>
                  </ReqSection>
                  <ReqSection title="Контакты организации" dashed>
                    <div className="grid grid-cols-2 gap-x-7 gap-y-4">
                      <ReqField label="Контактный телефон" value={req.phone} mono />
                      <ReqField label="Факс" value={req.fax} mono />
                      <ReqField label="Email" value={req.email} fullWidth />
                    </div>
                  </ReqSection>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
