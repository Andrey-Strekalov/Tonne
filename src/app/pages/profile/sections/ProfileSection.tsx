import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProfile, uploadAvatar, deleteProfile } from '@/shared/api/profile'
import { getRequisites } from '@/shared/api/requisites'
import { useAuth } from '@/app/providers/auth-context'
import { Button } from '@/shared/ui/kit'
import { EditProfileModal } from '../components/EditProfileModal'
import { getDisplayName, getInitials, getRoleLabel, formatJoinedDate } from '../profile-utils'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>
)
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .18s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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

export function ProfileSection() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const [reqOpen, setReqOpen] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })
  const { data: reqData, isLoading: reqLoading } = useQuery({
    queryKey: ['requisites'],
    queryFn: getRequisites,
  })

  const uploadMut = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
      setImgSrc(null)
    },
  })

  const deleteAccountMut = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => { logout() },
  })

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) { return }
    const reader = new FileReader()
    reader.onload = () => { setImgSrc(reader.result as string) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (profileLoading || reqLoading) {
    return <p className="text-sm text-[var(--gk-fg-muted)]">Загружаем профиль...</p>
  }

  const profile = profileData?.profile
  const req = reqData?.requisites

  if (!profile || !req) {
    return <p className="text-sm text-[var(--gk-danger)]">Не удалось загрузить профиль.</p>
  }

  const displayName = getDisplayName(req.company_name)
  const initials = getInitials(req.company_name, profile.first_name)

  return (
    <>
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Профиль</h1>
        <p className="mt-1.5 text-sm text-[var(--gk-fg-muted)]">Личные данные и реквизиты организации</p>
      </div>

      <div className="space-y-5">
        {/* Profile band */}
        <div className="rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] bg-cream">
          <div className="grid grid-cols-[auto_1fr_auto] gap-7 p-6 sm:p-7">
            {/* Avatar */}
            <button
              type="button"
              className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-[var(--gk-radius-lg)] border border-[var(--gk-border-strong)] bg-green-deep"
              onClick={() => { fileRef.current?.click() }}
              title="Сменить фото"
            >
              {profile.company_logo ? (
                <img src={profile.company_logo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[28px] font-bold tracking-tight text-cream">
                  {initials}
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center gap-1 bg-[rgba(14,26,20,.6)] text-[11px] font-medium text-cream opacity-0 transition-opacity hover:opacity-100 [.group:hover_&]:opacity-100">
                <CameraIcon /> Сменить
              </span>
            </button>

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

            {/* Actions */}
            <div className="flex min-w-[200px] flex-col justify-center gap-2">
              <Button variant="accent" size="sm" onClick={() => { setEditOpen(true) }}>
                <PencilIcon /> Редактировать профиль
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogoutIcon /> Выйти
              </Button>
              <button
                type="button"
                className="mt-1.5 rounded-[var(--gk-radius-sm)] px-2 py-2 text-center text-[13px] text-[var(--gk-fg-muted)] transition-colors hover:text-[var(--gk-danger)]"
                onClick={() => { setDeleteAccountOpen(true) }}
              >
                <u className="decoration-[1px] underline-offset-[3px]">Удалить аккаунт</u>
              </button>
            </div>
          </div>
        </div>

        {/* Requisites card */}
        <div className="rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] bg-cream">
          <div className="flex items-center justify-between border-b border-[var(--gk-border)] px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight text-ink">Реквизиты организации</h3>
              <p className="mt-0.5 text-xs text-[var(--gk-fg-muted)]">Отображаются контрагентам в карточке сделки</p>
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
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {editOpen && (
        <EditProfileModal
          profile={profile}
          requisites={req}
          onClose={() => { setEditOpen(false) }}
        />
      )}

      {imgSrc !== null && (
        <AvatarCropModal
          imgSrc={imgSrc}
          isPending={uploadMut.isPending}
          onClose={() => { setImgSrc(null) }}
          onSave={(file) => { uploadMut.mutate(file) }}
        />
      )}

      {deleteAccountOpen && (
        <DeleteAccountModal
          isPending={deleteAccountMut.isPending}
          onClose={() => { setDeleteAccountOpen(false) }}
          onConfirm={() => { deleteAccountMut.mutate() }}
        />
      )}
    </>
  )
}

function AvatarCropModal({ imgSrc, isPending, onClose, onSave }: {
  imgSrc: string
  isPending: boolean
  onClose: () => void
  onSave: (file: File) => void
}) {
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 80, height: 80, x: 10, y: 10 })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleSave = () => {
    if (!completedCrop || !imgRef.current) { return }
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (!ctx) { return }

    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, 400, 400,
    )

    canvas.toBlob((blob) => {
      if (!blob) { return }
      onSave(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4 bg-[rgba(14,26,20,.5)] backdrop-blur-[3px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { onClose() } }}
    >
      <div className="w-full max-w-[480px] rounded-[var(--gk-radius-xl)] border border-[var(--gk-border-strong)] bg-[var(--gk-paper)] [box-shadow:var(--gk-shadow-lg)]">
        <div className="flex items-start justify-between gap-3 px-7 pt-6 pb-4">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-ink">Фото профиля</h2>
            <p className="mt-1 text-[13px] text-[var(--gk-fg-muted)]">Выберите область для отображения</p>
          </div>
          <button
            type="button"
            className="rounded-[var(--gk-radius-sm)] p-1.5 text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,.05)] hover:text-ink"
            onClick={onClose}
          >
            <XIcon />
          </button>
        </div>
        <div className="flex justify-center px-7 pb-2">
          <ReactCrop
            crop={crop}
            onChange={(c) => { setCrop(c) }}
            onComplete={(c) => { setCompletedCrop(c) }}
            aspect={1}
          >
            <img ref={imgRef} src={imgSrc} alt="Кроп аватара" className="max-h-[360px] max-w-full" />
          </ReactCrop>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--gk-border)] px-7 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Отмена</Button>
          <Button type="button" variant="accent" onClick={handleSave} disabled={isPending || !completedCrop}>
            {isPending ? 'Загрузка...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DeleteAccountModal({ isPending, onClose, onConfirm }: {
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-[rgba(14,26,20,.5)] backdrop-blur-[3px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { onClose() } }}
    >
      <div className="w-full max-w-[400px] rounded-[var(--gk-radius-xl)] border border-[var(--gk-border-strong)] bg-[var(--gk-paper)] [box-shadow:var(--gk-shadow-lg)]">
        <div className="p-7 pb-5">
          <h2 className="text-[20px] font-bold tracking-tight text-ink">Удалить аккаунт?</h2>
          <p className="mt-2 text-sm text-[var(--gk-fg-muted)]">
            Все ваши данные, реквизиты и объявления будут удалены безвозвратно. Это действие нельзя отменить.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--gk-border)] px-7 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Отмена</Button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-[var(--gk-radius)] bg-[var(--gk-danger)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8a2d24] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isPending ? 'Удаление...' : 'Удалить аккаунт'}
          </button>
        </div>
      </div>
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
