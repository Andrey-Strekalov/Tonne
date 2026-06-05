import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/app/layout/MainLayout'
import { useAuth } from '@/app/providers/auth-context'
import { getRequisites } from '@/shared/api/requisites'
import { getBids } from '@/shared/api/bids'
import { getContactRequests } from '@/shared/api/contacts'
import { getDisplayName } from './profile-utils'
import { ProfileSidebar } from './ProfileSidebar'
import { ProfileSection } from './sections/ProfileSection'
import { AdsSection } from './sections/AdsSection'
import { ContactsSection } from './sections/ContactsSection'

export type ProfileSection = 'profile' | 'ads' | 'contacts'

export function ProfilePage() {
  const { user } = useAuth()
  const [section, setSection] = useState<ProfileSection>('profile')

  const { data: reqData } = useQuery({
    queryKey: ['requisites'],
    queryFn: getRequisites,
  })
  const { data: myBids = [] } = useQuery({
    queryKey: ['bids', 'my-all', user?.id],
    queryFn: () => getBids({ author_id: user!.id, status: 'all', page_size: 100 }),
    enabled: user !== null,
    staleTime: 30_000,
  })
  const { data: contactsData } = useQuery({
    queryKey: ['contact-requests', 'incoming'],
    queryFn: () => getContactRequests({ direction: 'incoming' }),
    enabled: user !== null,
  })

  const companyName = getDisplayName(reqData?.requisites.company_name ?? '')
  const bidsCount = myBids.filter((b) => !b.is_archived).length
  const unreadContactsCount = (contactsData?.contact_requests ?? []).filter((cr) => !cr.is_read).length

  return (
    <MainLayout>
      <div className="-mx-4 sm:-mx-6 -mt-7 sm:-mt-10 flex min-h-[calc(100vh-57px)]">
        <ProfileSidebar
          section={section}
          onSectionChange={setSection}
          bidsCount={bidsCount}
          unreadContactsCount={unreadContactsCount}
          companyName={companyName}
        />
        <div className="min-w-0 flex-1 px-6 py-8 lg:px-10">
          {section === 'profile' && <ProfileSection />}
          {section === 'ads' && <AdsSection />}
          {section === 'contacts' && <ContactsSection />}
        </div>
      </div>
    </MainLayout>
  )
}
